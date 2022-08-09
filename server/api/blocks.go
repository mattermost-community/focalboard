package api

import (
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
	"github.com/mattermost/focalboard/server/app"
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
		a.errorResponse(w, r.URL.Path, http.StatusUnauthorized, "", PermissionError{"access denied to board"})
		return
	}

	board, err := a.app.GetBoard(boardID)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}
	if board == nil {
		a.errorResponse(w, r.URL.Path, http.StatusNotFound, "Board not found", nil)
		return
	}

	if !hasValidReadToken {
		if board.IsTemplate && board.Type == model.BoardTypeOpen {
			if board.TeamID != model.GlobalTeamID && !a.permissions.HasPermissionToTeam(userID, board.TeamID, model.PermissionViewTeam) {
				a.errorResponse(w, r.URL.Path, http.StatusForbidden, "", PermissionError{"access denied to board template"})
				return
			}
		} else {
			if !a.permissions.HasPermissionToBoard(userID, boardID, model.PermissionViewBoard) {
				a.errorResponse(w, r.URL.Path, http.StatusForbidden, "", PermissionError{"access denied to board"})
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
			a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
			return
		}
	case blockID != "":
		block, err = a.app.GetBlockByID(blockID)
		if err != nil {
			a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
			return
		}
		if block != nil {
			if block.BoardID != boardID {
				a.errorResponse(w, r.URL.Path, http.StatusNotFound, "", nil)
				return
			}

			blocks = append(blocks, *block)
		}
	default:
		blocks, err = a.app.GetBlocks(boardID, parentID, blockType)
		if err != nil {
			a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
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
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", bErr)
		return
	}

	json, err := json.Marshal(blocks)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
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
	//   description: Disables notifications (for bulk data inserting)
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

	// in phase 1 we use "manage_board_cards", but we would have to
	// check on specific actions for phase 2
	if !a.permissions.HasPermissionToBoard(userID, boardID, model.PermissionManageBoardCards) {
		a.errorResponse(w, r.URL.Path, http.StatusForbidden, "", PermissionError{"access denied to make board changes"})
		return
	}

	requestBody, err := ioutil.ReadAll(r.Body)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	var blocks []model.Block

	err = json.Unmarshal(requestBody, &blocks)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	for _, block := range blocks {
		// Error checking
		if len(block.Type) < 1 {
			message := fmt.Sprintf("missing type for block id %s", block.ID)
			a.errorResponse(w, r.URL.Path, http.StatusBadRequest, message, nil)
			return
		}

		if block.CreateAt < 1 {
			message := fmt.Sprintf("invalid createAt for block id %s", block.ID)
			a.errorResponse(w, r.URL.Path, http.StatusBadRequest, message, nil)
			return
		}

		if block.UpdateAt < 1 {
			message := fmt.Sprintf("invalid UpdateAt for block id %s", block.ID)
			a.errorResponse(w, r.URL.Path, http.StatusBadRequest, message, nil)
			return
		}

		if block.BoardID != boardID {
			message := fmt.Sprintf("invalid BoardID for block id %s", block.ID)
			a.errorResponse(w, r.URL.Path, http.StatusBadRequest, message, nil)
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
			a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", updateFileIDsErr)
			return
		}
	}

	newBlocks, err := a.app.InsertBlocks(blocks, session.UserID, !disableNotify)
	if err != nil {
		if errors.Is(err, app.ErrViewsLimitReached) {
			a.errorResponse(w, r.URL.Path, http.StatusBadRequest, err.Error(), err)
		} else {
			a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		}

		return
	}

	a.logger.Debug("POST Blocks",
		mlog.Int("block_count", len(blocks)),
		mlog.Bool("disable_notify", disableNotify),
	)

	json, err := json.Marshal(newBlocks)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
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

	if !a.permissions.HasPermissionToBoard(userID, boardID, model.PermissionManageBoardCards) {
		a.errorResponse(w, r.URL.Path, http.StatusForbidden, "", PermissionError{"access denied to make board changes"})
		return
	}

	block, err := a.app.GetBlockByID(blockID)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}
	if block == nil || block.BoardID != boardID {
		a.errorResponse(w, r.URL.Path, http.StatusNotFound, "", nil)
		return
	}

	auditRec := a.makeAuditRecord(r, "deleteBlock", audit.Fail)
	defer a.audit.LogRecord(audit.LevelModify, auditRec)
	auditRec.AddMeta("boardID", boardID)
	auditRec.AddMeta("blockID", blockID)

	err = a.app.DeleteBlock(blockID, userID)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
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
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}
	if board == nil {
		a.errorResponse(w, r.URL.Path, http.StatusNotFound, "", nil)
		return
	}

	block, err := a.app.GetLastBlockHistoryEntry(blockID)
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

	if !a.permissions.HasPermissionToBoard(userID, boardID, model.PermissionManageBoardCards) {
		a.errorResponse(w, r.URL.Path, http.StatusForbidden, "", PermissionError{"access denied to modify board members"})
		return
	}

	auditRec := a.makeAuditRecord(r, "undeleteBlock", audit.Fail)
	defer a.audit.LogRecord(audit.LevelModify, auditRec)
	auditRec.AddMeta("blockID", blockID)

	undeletedBlock, err := a.app.UndeleteBlock(blockID, userID)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	undeletedBlockData, err := json.Marshal(undeletedBlock)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
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

	if !a.permissions.HasPermissionToBoard(userID, boardID, model.PermissionManageBoardCards) {
		a.errorResponse(w, r.URL.Path, http.StatusForbidden, "", PermissionError{"access denied to make board changes"})
		return
	}

	block, err := a.app.GetBlockByID(blockID)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}
	if block == nil || block.BoardID != boardID {
		a.errorResponse(w, r.URL.Path, http.StatusNotFound, "", nil)
		return
	}

	requestBody, err := ioutil.ReadAll(r.Body)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	var patch *model.BlockPatch
	err = json.Unmarshal(requestBody, &patch)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	auditRec := a.makeAuditRecord(r, "patchBlock", audit.Fail)
	defer a.audit.LogRecord(audit.LevelModify, auditRec)
	auditRec.AddMeta("boardID", boardID)
	auditRec.AddMeta("blockID", blockID)

	err = a.app.PatchBlock(blockID, patch, userID)
	if errors.Is(err, app.ErrPatchUpdatesLimitedCards) {
		a.errorResponse(w, r.URL.Path, http.StatusForbidden, "", err)
		return
	}
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
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

	requestBody, err := ioutil.ReadAll(r.Body)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	var patches *model.BlockPatchBatch
	err = json.Unmarshal(requestBody, &patches)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
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
			a.errorResponse(w, r.URL.Path, http.StatusForbidden, "", PermissionError{"access denied to make board changes"})
			return
		}
		if !a.permissions.HasPermissionToBoard(userID, block.BoardID, model.PermissionManageBoardCards) {
			a.errorResponse(w, r.URL.Path, http.StatusForbidden, "", PermissionError{"access denied to make board changes"})
			return
		}
	}

	err = a.app.PatchBlocks(teamID, patches, userID)
	if errors.Is(err, app.ErrPatchUpdatesLimitedCards) {
		a.errorResponse(w, r.URL.Path, http.StatusForbidden, "", err)
		return
	}
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
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

	if !a.permissions.HasPermissionToBoard(userID, boardID, model.PermissionManageBoardCards) {
		a.errorResponse(w, r.URL.Path, http.StatusForbidden, "", PermissionError{"access denied to modify board members"})
		return
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
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, err.Error(), err)
		return
	}

	data, err := json.Marshal(blocks)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	// response
	jsonBytesResponse(w, http.StatusOK, data)

	auditRec.Success()
}
