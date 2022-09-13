package api

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/services/audit"

	"github.com/mattermost/mattermost-server/v6/shared/mlog"
)

func (a *API) registerBlocksRoutes(r *mux.Router) {
	// Blocks APIs
	r.HandleFunc("/boards/{boardID}/blocks", a.attachSession(a.handleGetBlocks, false)).Methods("GET")
	r.HandleFunc("/boards/{boardID}/blocks", a.sessionRequired(a.handlePostBlocks)).Methods("POST")
	r.HandleFunc("/boards/{boardID}/blocks", a.sessionRequired(a.handlePatchBlocks)).Methods("PATCH")
	r.HandleFunc("/boards/{boardID}/blocks/{blockID}", a.sessionRequired(a.handleDeleteBlock)).Methods("DELETE")
	r.HandleFunc("/boards/{boardID}/blocks/{blockID}", a.sessionRequired(a.handlePatchBlock)).Methods("PATCH")
	r.HandleFunc("/boards/{boardID}/blocks/{blockID}/undelete", a.sessionRequired(a.handleUndeleteBlock)).Methods("POST")
	r.HandleFunc("/boards/{boardID}/blocks/{blockID}/duplicate", a.sessionRequired(a.handleDuplicateBlock)).Methods("POST")
	r.HandleFunc("/boards/{boardID}/blocks/{blockID}/moveto/{where}/{dstBlockID}", a.sessionRequired(a.handleMoveBlockTo)).Methods("POST")
}

func (a *API) handleGetBlocks(w http.ResponseWriter, r *http.Request) {
	// swagger:operation GET /boards/{boardID}/blocks getBlocks
	//
	// Returns blocks
	//
	// ---
	// produces:
	// - application/json
	// parameters:
	// - name: boardID
	//   in: path
	//   description: Board ID
	//   required: true
	//   type: string
	// - name: parent_id
	//   in: query
	//   description: ID of parent block, omit to specify all blocks
	//   required: false
	//   type: string
	// - name: type
	//   in: query
	//   description: Type of blocks to return, omit to specify all types
	//   required: false
	//   type: string
	// security:
	// - BearerAuth: []
	// responses:
	//   '200':
	//     description: success
	//     schema:
	//       type: array
	//       items:
	//         "$ref": "#/definitions/Block"
	//   '404':
	//     description: board not found
	//   default:
	//     description: internal error
	//     schema:
	//       "$ref": "#/definitions/ErrorResponse"

	query := r.URL.Query()
	parentID := query.Get("parent_id")
	blockType := query.Get("type")
	all := query.Get("all")
	blockID := query.Get("block_id")
	boardID := mux.Vars(r)["boardID"]

	userID := getUserID(r)

	hasValidReadToken := a.hasValidReadTokenForBoard(r, boardID)
	if userID == "" && !hasValidReadToken {
		a.errorResponse(w, r, model.NewErrUnauthorized("access denied to board"))
		return
	}

	board, err := a.app.GetBoard(boardID)
	if err != nil {
		a.errorResponse(w, r, err)
		return
	}

	if !hasValidReadToken {
		if board.IsTemplate && board.Type == model.BoardTypeOpen {
			if board.TeamID != model.GlobalTeamID && !a.permissions.HasPermissionToTeam(userID, board.TeamID, model.PermissionViewTeam) {
				a.errorResponse(w, r, model.NewErrPermission("access denied to board template"))
				return
			}
		} else {
			if !a.permissions.HasPermissionToBoard(userID, boardID, model.PermissionViewBoard) {
				a.errorResponse(w, r, model.NewErrPermission("access denied to board"))
				return
			}
		}
		if board.IsTemplate {
			var isGuest bool
			isGuest, err = a.userIsGuest(userID)
			if err != nil {
				a.errorResponse(w, r, err)
				return
			}

			if isGuest {
				a.errorResponse(w, r, model.NewErrPermission("guest are not allowed to get board templates"))
				return
			}
		}
	}

	auditRec := a.makeAuditRecord(r, "getBlocks", audit.Fail)
	defer a.audit.LogRecord(audit.LevelRead, auditRec)
	auditRec.AddMeta("boardID", boardID)
	auditRec.AddMeta("parentID", parentID)
	auditRec.AddMeta("blockType", blockType)
	auditRec.AddMeta("all", all)
	auditRec.AddMeta("blockID", blockID)

	var blocks []model.Block
	var block *model.Block
	switch {
	case all != "":
		blocks, err = a.app.GetBlocksForBoard(boardID)
		if err != nil {
			a.errorResponse(w, r, err)
			return
		}
	case blockID != "":
		block, err = a.app.GetBlockByID(blockID)
		if err != nil {
			a.errorResponse(w, r, err)
			return
		}
		if block.BoardID != boardID {
			message := fmt.Sprintf("block ID=%s on BoardID=%s", block.ID, boardID)
			a.errorResponse(w, r, model.NewErrNotFound(message))
			return
		}

		blocks = append(blocks, *block)
	default:
		blocks, err = a.app.GetBlocks(boardID, parentID, blockType)
		if err != nil {
			a.errorResponse(w, r, err)
			return
		}
	}

	a.logger.Debug("GetBlocks",
		mlog.String("boardID", boardID),
		mlog.String("parentID", parentID),
		mlog.String("blockType", blockType),
		mlog.String("blockID", blockID),
		mlog.Int("block_count", len(blocks)),
	)

	var bErr error
	blocks, bErr = a.app.ApplyCloudLimits(blocks)
	if bErr != nil {
		a.errorResponse(w, r, err)
		return
	}

	json, err := json.Marshal(blocks)
	if err != nil {
		a.errorResponse(w, r, err)
		return
	}

	jsonBytesResponse(w, http.StatusOK, json)

	auditRec.AddMeta("blockCount", len(blocks))
	auditRec.Success()
}

func (a *API) handlePostBlocks(w http.ResponseWriter, r *http.Request) {
	// swagger:operation POST /boards/{boardID}/blocks updateBlocks
	//
	// Insert blocks. The specified IDs will only be used to link
	// blocks with existing ones, the rest will be replaced by server
	// generated IDs
	//
	// ---
	// produces:
	// - application/json
	// parameters:
	// - name: boardID
	//   in: path
	//   description: Board ID
	//   required: true
	//   type: string
	// - name: disable_notify
	//   in: query
	//   description: Disables notifications (for bulk inserting)
	//   required: false
	//   type: bool
	// - name: Body
	//   in: body
	//   description: array of blocks to insert or update
	//   required: true
	//   schema:
	//     type: array
	//     items:
	//       "$ref": "#/definitions/Block"
	// security:
	// - BearerAuth: []
	// responses:
	//   '200':
	//     description: success
	//     schema:
	//       items:
	//         $ref: '#/definitions/Block'
	//       type: array
	//   default:
	//     description: internal error
	//     schema:
	//       "$ref": "#/definitions/ErrorResponse"

	boardID := mux.Vars(r)["boardID"]
	userID := getUserID(r)

	val := r.URL.Query().Get("disable_notify")
	disableNotify := val == True

	requestBody, err := io.ReadAll(r.Body)
	if err != nil {
		a.errorResponse(w, r, err)
		return
	}

	var blocks []model.Block

	err = json.Unmarshal(requestBody, &blocks)
	if err != nil {
		a.errorResponse(w, r, err)
		return
	}

	hasComments := false
	hasContents := false
	for _, block := range blocks {
		// Error checking
		if len(block.Type) < 1 {
			message := fmt.Sprintf("missing type for block id %s", block.ID)
			a.errorResponse(w, r, model.NewErrBadRequest(message))
			return
		}

		if block.Type == model.TypeComment {
			hasComments = true
		} else {
			hasContents = true
		}

		if block.CreateAt < 1 {
			message := fmt.Sprintf("invalid createAt for block id %s", block.ID)
			a.errorResponse(w, r, model.NewErrBadRequest(message))
			return
		}

		if block.UpdateAt < 1 {
			message := fmt.Sprintf("invalid UpdateAt for block id %s", block.ID)
			a.errorResponse(w, r, model.NewErrBadRequest(message))
			return
		}

		if block.BoardID != boardID {
			message := fmt.Sprintf("invalid BoardID for block id %s", block.ID)
			a.errorResponse(w, r, model.NewErrBadRequest(message))
			return
		}
	}

	if hasContents {
		if !a.permissions.HasPermissionToBoard(userID, boardID, model.PermissionManageBoardCards) {
			a.errorResponse(w, r, model.NewErrPermission("access denied to make board changes"))
			return
		}
	}
	if hasComments {
		if !a.permissions.HasPermissionToBoard(userID, boardID, model.PermissionCommentBoardCards) {
			a.errorResponse(w, r, model.NewErrPermission("access denied to post card comments"))
			return
		}
	}

	blocks = model.GenerateBlockIDs(blocks, a.logger)

	auditRec := a.makeAuditRecord(r, "postBlocks", audit.Fail)
	defer a.audit.LogRecord(audit.LevelModify, auditRec)
	auditRec.AddMeta("disable_notify", disableNotify)

	ctx := r.Context()
	session := ctx.Value(sessionContextKey).(*model.Session)

	model.StampModificationMetadata(userID, blocks, auditRec)

	// this query param exists when creating template from board, or board from template
	sourceBoardID := r.URL.Query().Get("sourceBoardID")
	if sourceBoardID != "" {
		if updateFileIDsErr := a.app.CopyCardFiles(sourceBoardID, blocks); updateFileIDsErr != nil {
			a.errorResponse(w, r, updateFileIDsErr)
			return
		}
	}

	newBlocks, err := a.app.InsertBlocksAndNotify(blocks, session.UserID, disableNotify)
	if err != nil {
		a.errorResponse(w, r, err)
		return
	}

	a.logger.Debug("POST Blocks",
		mlog.Int("block_count", len(blocks)),
		mlog.Bool("disable_notify", disableNotify),
	)

	json, err := json.Marshal(newBlocks)
	if err != nil {
		a.errorResponse(w, r, err)
		return
	}

	jsonBytesResponse(w, http.StatusOK, json)

	auditRec.AddMeta("blockCount", len(blocks))
	auditRec.Success()
}

func (a *API) handleDeleteBlock(w http.ResponseWriter, r *http.Request) {
	// swagger:operation DELETE /boards/{boardID}/blocks/{blockID} deleteBlock
	//
	// Deletes a block
	//
	// ---
	// produces:
	// - application/json
	// parameters:
	// - name: boardID
	//   in: path
	//   description: Board ID
	//   required: true
	//   type: string
	// - name: blockID
	//   in: path
	//   description: ID of block to delete
	//   required: true
	//   type: string
	// - name: disable_notify
	//   in: query
	//   description: Disables notifications (for bulk deletion)
	//   required: false
	//   type: bool
	// security:
	// - BearerAuth: []
	// responses:
	//   '200':
	//     description: success
	//   '404':
	//     description: block not found
	//   default:
	//     description: internal error
	//     schema:
	//       "$ref": "#/definitions/ErrorResponse"

	userID := getUserID(r)
	vars := mux.Vars(r)
	boardID := vars["boardID"]
	blockID := vars["blockID"]

	val := r.URL.Query().Get("disable_notify")
	disableNotify := val == True

	if !a.permissions.HasPermissionToBoard(userID, boardID, model.PermissionManageBoardCards) {
		a.errorResponse(w, r, model.NewErrPermission("access denied to make board changes"))
		return
	}

	block, err := a.app.GetBlockByID(blockID)
	if err != nil {
		a.errorResponse(w, r, err)
		return
	}
	if block.BoardID != boardID {
		message := fmt.Sprintf("block ID=%s on BoardID=%s", block.ID, boardID)
		a.errorResponse(w, r, model.NewErrNotFound(message))
		return
	}

	auditRec := a.makeAuditRecord(r, "deleteBlock", audit.Fail)
	defer a.audit.LogRecord(audit.LevelModify, auditRec)
	auditRec.AddMeta("boardID", boardID)
	auditRec.AddMeta("blockID", blockID)

	err = a.app.DeleteBlockAndNotify(blockID, userID, disableNotify)
	if err != nil {
		a.errorResponse(w, r, err)
		return
	}

	a.logger.Debug("DELETE Block", mlog.String("boardID", boardID), mlog.String("blockID", blockID))
	jsonStringResponse(w, http.StatusOK, "{}")

	auditRec.Success()
}

func (a *API) handleUndeleteBlock(w http.ResponseWriter, r *http.Request) {
	// swagger:operation POST /boards/{boardID}/blocks/{blockID}/undelete undeleteBlock
	//
	// Undeletes a block
	//
	// ---
	// produces:
	// - application/json
	// parameters:
	// - name: boardID
	//   in: path
	//   description: Board ID
	//   required: true
	//   type: string
	// - name: blockID
	//   in: path
	//   description: ID of block to undelete
	//   required: true
	//   type: string
	// security:
	// - BearerAuth: []
	// responses:
	//   '200':
	//     description: success
	//     schema:
	//       "$ref": "#/definitions/BlockPatch"
	//   '404':
	//     description: block not found
	//   default:
	//     description: internal error
	//     schema:
	//       "$ref": "#/definitions/ErrorResponse"

	ctx := r.Context()
	session := ctx.Value(sessionContextKey).(*model.Session)
	userID := session.UserID

	vars := mux.Vars(r)
	blockID := vars["blockID"]
	boardID := vars["boardID"]

	board, err := a.app.GetBoard(boardID)
	if err != nil {
		a.errorResponse(w, r, err)
		return
	}

	block, err := a.app.GetLastBlockHistoryEntry(blockID)
	if err != nil {
		a.errorResponse(w, r, err)
		return
	}

	if board.ID != block.BoardID {
		message := fmt.Sprintf("block ID=%s on BoardID=%s", block.ID, board.ID)
		a.errorResponse(w, r, model.NewErrNotFound(message))
		return
	}

	if !a.permissions.HasPermissionToBoard(userID, boardID, model.PermissionManageBoardCards) {
		a.errorResponse(w, r, model.NewErrPermission("access denied to modify board members"))
		return
	}

	auditRec := a.makeAuditRecord(r, "undeleteBlock", audit.Fail)
	defer a.audit.LogRecord(audit.LevelModify, auditRec)
	auditRec.AddMeta("blockID", blockID)

	undeletedBlock, err := a.app.UndeleteBlock(blockID, userID)
	if err != nil {
		a.errorResponse(w, r, err)
		return
	}

	undeletedBlockData, err := json.Marshal(undeletedBlock)
	if err != nil {
		a.errorResponse(w, r, err)
		return
	}

	a.logger.Debug("UNDELETE Block", mlog.String("blockID", blockID))
	jsonBytesResponse(w, http.StatusOK, undeletedBlockData)

	auditRec.Success()
}

func (a *API) handlePatchBlock(w http.ResponseWriter, r *http.Request) {
	// swagger:operation PATCH /boards/{boardID}/blocks/{blockID} patchBlock
	//
	// Partially updates a block
	//
	// ---
	// produces:
	// - application/json
	// parameters:
	// - name: boardID
	//   in: path
	//   description: Board ID
	//   required: true
	//   type: string
	// - name: blockID
	//   in: path
	//   description: ID of block to patch
	//   required: true
	//   type: string
	// - name: disable_notify
	//   in: query
	//   description: Disables notifications (for bulk patching)
	//   required: false
	//   type: bool
	// - name: Body
	//   in: body
	//   description: block patch to apply
	//   required: true
	//   schema:
	//     "$ref": "#/definitions/BlockPatch"
	// security:
	// - BearerAuth: []
	// responses:
	//   '200':
	//     description: success
	//   '404':
	//     description: block not found
	//   default:
	//     description: internal error
	//     schema:
	//       "$ref": "#/definitions/ErrorResponse"

	userID := getUserID(r)
	vars := mux.Vars(r)
	boardID := vars["boardID"]
	blockID := vars["blockID"]

	val := r.URL.Query().Get("disable_notify")
	disableNotify := val == True

	if !a.permissions.HasPermissionToBoard(userID, boardID, model.PermissionManageBoardCards) {
		a.errorResponse(w, r, model.NewErrPermission("access denied to make board changes"))
		return
	}

	block, err := a.app.GetBlockByID(blockID)
	if err != nil {
		a.errorResponse(w, r, err)
		return
	}
	if block.BoardID != boardID {
		message := fmt.Sprintf("block ID=%s on BoardID=%s", block.ID, boardID)
		a.errorResponse(w, r, model.NewErrNotFound(message))
		return
	}

	requestBody, err := io.ReadAll(r.Body)
	if err != nil {
		a.errorResponse(w, r, err)
		return
	}

	var patch *model.BlockPatch
	err = json.Unmarshal(requestBody, &patch)
	if err != nil {
		a.errorResponse(w, r, err)
		return
	}

	auditRec := a.makeAuditRecord(r, "patchBlock", audit.Fail)
	defer a.audit.LogRecord(audit.LevelModify, auditRec)
	auditRec.AddMeta("boardID", boardID)
	auditRec.AddMeta("blockID", blockID)

	if _, err = a.app.PatchBlockAndNotify(blockID, patch, userID, disableNotify); err != nil {
		a.errorResponse(w, r, err)
		return
	}

	a.logger.Debug("PATCH Block", mlog.String("boardID", boardID), mlog.String("blockID", blockID))
	jsonStringResponse(w, http.StatusOK, "{}")

	auditRec.Success()
}

func (a *API) handlePatchBlocks(w http.ResponseWriter, r *http.Request) {
	// swagger:operation PATCH /boards/{boardID}/blocks/ patchBlocks
	//
	// Partially updates batch of blocks
	//
	// ---
	// produces:
	// - application/json
	// parameters:
	// - name: boardID
	//   in: path
	//   description: Workspace ID
	//   required: true
	//   type: string
	// - name: disable_notify
	//   in: query
	//   description: Disables notifications (for bulk patching)
	//   required: false
	//   type: bool
	// - name: Body
	//   in: body
	//   description: block Ids and block patches to apply
	//   required: true
	//   schema:
	//     "$ref": "#/definitions/BlockPatchBatch"
	// security:
	// - BearerAuth: []
	// responses:
	//   '200':
	//     description: success
	//   default:
	//     description: internal error
	//     schema:
	//       "$ref": "#/definitions/ErrorResponse"

	ctx := r.Context()
	session := ctx.Value(sessionContextKey).(*model.Session)
	userID := session.UserID

	vars := mux.Vars(r)
	teamID := vars["teamID"]

	val := r.URL.Query().Get("disable_notify")
	disableNotify := val == True

	requestBody, err := io.ReadAll(r.Body)
	if err != nil {
		a.errorResponse(w, r, err)
		return
	}

	var patches *model.BlockPatchBatch
	err = json.Unmarshal(requestBody, &patches)
	if err != nil {
		a.errorResponse(w, r, err)
		return
	}

	auditRec := a.makeAuditRecord(r, "patchBlocks", audit.Fail)
	defer a.audit.LogRecord(audit.LevelModify, auditRec)
	for i := range patches.BlockIDs {
		auditRec.AddMeta("block_"+strconv.FormatInt(int64(i), 10), patches.BlockIDs[i])
	}

	for _, blockID := range patches.BlockIDs {
		var block *model.Block
		block, err = a.app.GetBlockByID(blockID)
		if err != nil {
			a.errorResponse(w, r, model.NewErrForbidden("access denied to make board changes"))
			return
		}
		if !a.permissions.HasPermissionToBoard(userID, block.BoardID, model.PermissionManageBoardCards) {
			a.errorResponse(w, r, model.NewErrPermission("access denied to make board changesa"))
			return
		}
	}

	err = a.app.PatchBlocksAndNotify(teamID, patches, userID, disableNotify)
	if err != nil {
		a.errorResponse(w, r, err)
		return
	}

	a.logger.Debug("PATCH Blocks", mlog.String("patches", strconv.Itoa(len(patches.BlockIDs))))
	jsonStringResponse(w, http.StatusOK, "{}")

	auditRec.Success()
}

func (a *API) handleDuplicateBlock(w http.ResponseWriter, r *http.Request) {
	// swagger:operation POST /boards/{boardID}/blocks/{blockID}/duplicate duplicateBlock
	//
	// Returns the new created blocks
	//
	// ---
	// produces:
	// - application/json
	// parameters:
	// - name: boardID
	//   in: path
	//   description: Board ID
	//   required: true
	//   type: string
	// - name: blockID
	//   in: path
	//   description: Block ID
	//   required: true
	//   type: string
	// security:
	// - BearerAuth: []
	// responses:
	//   '200':
	//     description: success
	//     schema:
	//       type: array
	//       items:
	//         "$ref": "#/definitions/Block"
	//   '404':
	//     description: board or block not found
	//   default:
	//     description: internal error
	//     schema:
	//       "$ref": "#/definitions/ErrorResponse"

	boardID := mux.Vars(r)["boardID"]
	blockID := mux.Vars(r)["blockID"]
	userID := getUserID(r)
	query := r.URL.Query()
	asTemplate := query.Get("asTemplate")

	board, err := a.app.GetBoard(boardID)
	if err != nil {
		a.errorResponse(w, r, err)
		return
	}

	if userID == "" {
		a.errorResponse(w, r, model.NewErrUnauthorized("access denied to board"))
		return
	}

	block, err := a.app.GetBlockByID(blockID)
	if err != nil {
		a.errorResponse(w, r, err)
		return
	}

	if board.ID != block.BoardID {
		message := fmt.Sprintf("block ID=%s on BoardID=%s", block.ID, board.ID)
		a.errorResponse(w, r, model.NewErrNotFound(message))
		return
	}

	if block.Type == model.TypeComment {
		if !a.permissions.HasPermissionToBoard(userID, boardID, model.PermissionCommentBoardCards) {
			a.errorResponse(w, r, model.NewErrPermission("access denied to comment on board cards"))
			return
		}
	} else {
		if !a.permissions.HasPermissionToBoard(userID, boardID, model.PermissionManageBoardCards) {
			a.errorResponse(w, r, model.NewErrPermission("access denied to modify board cards"))
			return
		}
	}

	auditRec := a.makeAuditRecord(r, "duplicateBlock", audit.Fail)
	defer a.audit.LogRecord(audit.LevelRead, auditRec)
	auditRec.AddMeta("boardID", boardID)
	auditRec.AddMeta("blockID", blockID)

	a.logger.Debug("DuplicateBlock",
		mlog.String("boardID", boardID),
		mlog.String("blockID", blockID),
	)

	blocks, err := a.app.DuplicateBlock(boardID, blockID, userID, asTemplate == True)
	if err != nil {
		a.errorResponse(w, r, err)
		return
	}

	data, err := json.Marshal(blocks)
	if err != nil {
		a.errorResponse(w, r, err)
		return
	}

	// response
	jsonBytesResponse(w, http.StatusOK, data)

	auditRec.Success()
}

func (a *API) handleMoveBlockTo(w http.ResponseWriter, r *http.Request) {
	// swagger:operation POST /boards/{boardID}/blocks/{blockID}/move/{where}/{dstBlockID} moveBlockTo
	//
	// Move a block after another block in the parent card
	//
	// ---
	// produces:
	// - application/json
	// parameters:
	// - name: boardID
	//   in: path
	//   description: Board ID
	//   required: true
	//   type: string
	// - name: blockID
	//   in: path
	//   description: Block ID
	//   required: true
	//   type: string
	// - name: where
	//   in: path
	//   description: Relative location respect destination block (after or before)
	//   required: true
	//   type: string
	// - name: dstBlockID
	//   in: path
	//   description: Destination Block ID
	//   required: true
	//   type: string
	// security:
	// - BearerAuth: []
	// responses:
	//   '200':
	//     description: success
	//     schema:
	//       type: array
	//       items:
	//         "$ref": "#/definitions/Block"
	//   '404':
	//     description: board or block not found
	//   default:
	//     description: internal error
	//     schema:
	//       "$ref": "#/definitions/ErrorResponse"

	boardID := mux.Vars(r)["boardID"]
	blockID := mux.Vars(r)["blockID"]
	dstBlockID := mux.Vars(r)["dstBlockID"]
	where := mux.Vars(r)["where"]
	userID := getUserID(r)

	if where != "after" && where != "before" {
		a.errorResponse(w, r.URL.Path, http.StatusBadRequest, "invalid where parameter, use before or after", nil)
	}

	board, err := a.app.GetBoard(boardID)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}
	if board == nil {
		a.errorResponse(w, r.URL.Path, http.StatusNotFound, "", nil)
	}

	if userID == "" {
		a.errorResponse(w, r.URL.Path, http.StatusUnauthorized, "", PermissionError{"access denied to board"})
		return
	}

	block, err := a.app.GetBlockByID(blockID)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}
	if block == nil {
		a.errorResponse(w, r.URL.Path, http.StatusNotFound, "", nil)
		return
	}

	if board.ID != block.BoardID {
		a.errorResponse(w, r.URL.Path, http.StatusNotFound, "", nil)
		return
	}

	dstBlock, err := a.app.GetBlockByID(dstBlockID)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}
	if dstBlock == nil {
		a.errorResponse(w, r.URL.Path, http.StatusNotFound, "", nil)
		return
	}

	if board.ID != block.BoardID {
		a.errorResponse(w, r.URL.Path, http.StatusNotFound, "", nil)
		return
	}

	if block.ParentID != dstBlock.ParentID {
		a.errorResponse(w, r.URL.Path, http.StatusBadRequest, "", nil)
		return
	}

	if !a.permissions.HasPermissionToBoard(userID, boardID, model.PermissionManageBoardCards) {
		a.errorResponse(w, r.URL.Path, http.StatusForbidden, "", PermissionError{"access denied to modify board cards"})
		return
	}

	card, err := a.app.GetBlockByID(block.ParentID)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	contentOrder := card.Fields["contentOrder"].([]interface{})
	newContentOrder := []interface{}{}
	foundDst := false
	foundSrc := false
	for _, id := range contentOrder {
		stringID, ok := id.(string)
		if !ok {
			newContentOrder = append(newContentOrder, id)
			continue
		}

		if dstBlockID == stringID {
			foundDst = true
			if where == "after" {
				newContentOrder = append(newContentOrder, id)
				newContentOrder = append(newContentOrder, blockID)
			} else {
				newContentOrder = append(newContentOrder, blockID)
				newContentOrder = append(newContentOrder, id)
			}
			continue
		}

		if blockID == stringID {
			foundSrc = true
			continue
		}

		newContentOrder = append(newContentOrder, id)
	}

	if !foundDst || !foundSrc {
		a.errorResponse(w, r.URL.Path, http.StatusBadRequest, "", nil)
		return
	}

	auditRec := a.makeAuditRecord(r, "moveBlockAfter", audit.Fail)
	defer a.audit.LogRecord(audit.LevelRead, auditRec)
	auditRec.AddMeta("boardID", boardID)
	auditRec.AddMeta("blockID", blockID)
	auditRec.AddMeta("dstBlockID", dstBlockID)

	patch := &model.BlockPatch{
		UpdatedFields: map[string]interface{}{
			"contentOrder": newContentOrder,
		},
	}

	_, err = a.app.PatchBlock(block.ParentID, patch, userID)
	if errors.Is(err, app.ErrPatchUpdatesLimitedCards) {
		a.errorResponse(w, r.URL.Path, http.StatusForbidden, "", err)
		return
	}
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	// response
	jsonStringResponse(w, http.StatusOK, "{}")

	auditRec.Success()
}
