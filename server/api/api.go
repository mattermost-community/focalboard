package api

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"io/ioutil"
	"net/http"
	"path/filepath"
	"runtime/debug"
	"strconv"
	"strings"
	"time"

	"github.com/gorilla/mux"
	"github.com/mattermost/focalboard/server/app"
	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/services/audit"
	"github.com/mattermost/focalboard/server/services/permissions"
	"github.com/mattermost/focalboard/server/utils"

	"github.com/mattermost/mattermost-server/v6/shared/mlog"
)

const (
	HeaderRequestedWith    = "X-Requested-With"
	HeaderRequestedWithXML = "XMLHttpRequest"
	UploadFormFileKey      = "file"
)

const (
	ErrorNoTeamCode    = 1000
	ErrorNoTeamMessage = "No team"
)

type PermissionError struct {
	msg string
}

func (pe PermissionError) Error() string {
	return pe.msg
}

// ----------------------------------------------------------------------------------------------------
// REST APIs

type API struct {
	app             *app.App
	authService     string
	permissions     permissions.PermissionsService
	singleUserToken string
	MattermostAuth  bool
	logger          *mlog.Logger
	audit           *audit.Audit
}

func NewAPI(app *app.App, singleUserToken string, authService string, permissions permissions.PermissionsService,
	logger *mlog.Logger, audit *audit.Audit) *API {
	return &API{
		app:             app,
		singleUserToken: singleUserToken,
		authService:     authService,
		permissions:     permissions,
		logger:          logger,
		audit:           audit,
	}
}

func (a *API) RegisterRoutes(r *mux.Router) {
	apiv1 := r.PathPrefix("/api/v1").Subrouter()
	apiv1.Use(a.panicHandler)
	apiv1.Use(a.requireCSRFToken)

	// Board APIs
	apiv1.HandleFunc("/teams/{teamID}/boards", a.sessionRequired(a.handleGetBoards)).Methods("GET")
	apiv1.HandleFunc("/teams/{teamID}/boards/search", a.sessionRequired(a.handleSearchBoards)).Methods("GET")
	apiv1.HandleFunc("/teams/{teamID}/templates", a.sessionRequired(a.handleGetTemplates)).Methods("GET")
	apiv1.HandleFunc("/boards", a.sessionRequired(a.handleCreateBoard)).Methods("POST")
	apiv1.HandleFunc("/boards/{boardID}", a.attachSession(a.handleGetBoard, false)).Methods("GET")
	apiv1.HandleFunc("/boards/{boardID}", a.sessionRequired(a.handlePatchBoard)).Methods("PATCH")
	apiv1.HandleFunc("/boards/{boardID}", a.sessionRequired(a.handleDeleteBoard)).Methods("DELETE")
	apiv1.HandleFunc("/boards/{boardID}/duplicate", a.sessionRequired(a.handleDuplicateBoard)).Methods("POST")
	apiv1.HandleFunc("/boards/{boardID}/blocks", a.attachSession(a.handleGetBlocks, false)).Methods("GET")
	apiv1.HandleFunc("/boards/{boardID}/blocks", a.sessionRequired(a.handlePostBlocks)).Methods("POST")
	apiv1.HandleFunc("/boards/{boardID}/blocks", a.sessionRequired(a.handlePatchBlocks)).Methods("PATCH")
	apiv1.HandleFunc("/boards/{boardID}/blocks/{blockID}", a.sessionRequired(a.handleDeleteBlock)).Methods("DELETE")
	apiv1.HandleFunc("/boards/{boardID}/blocks/{blockID}", a.sessionRequired(a.handlePatchBlock)).Methods("PATCH")
	apiv1.HandleFunc("/boards/{boardID}/blocks/{blockID}/undelete", a.sessionRequired(a.handleUndeleteBlock)).Methods("POST")
	apiv1.HandleFunc("/boards/{boardID}/blocks/{blockID}/subtree", a.attachSession(a.handleGetSubTree, false)).Methods("GET")
	apiv1.HandleFunc("/boards/{boardID}/blocks/{blockID}/duplicate", a.attachSession(a.handleDuplicateBlock, false)).Methods("POST")
	apiv1.HandleFunc("/boards/{boardID}/metadata", a.sessionRequired(a.handleGetBoardMetadata)).Methods("GET")

	// Import&Export APIs
	apiv1.HandleFunc("/boards/{boardID}/blocks/export", a.sessionRequired(a.handleExport)).Methods("GET")
	apiv1.HandleFunc("/boards/{boardID}/blocks/import", a.sessionRequired(a.handleImport)).Methods("POST")

	// Member APIs
	apiv1.HandleFunc("/boards/{boardID}/members", a.sessionRequired(a.handleGetMembersForBoard)).Methods("GET")
	apiv1.HandleFunc("/boards/{boardID}/members", a.sessionRequired(a.handleAddMember)).Methods("POST")
	apiv1.HandleFunc("/boards/{boardID}/members/{userID}", a.sessionRequired(a.handleUpdateMember)).Methods("PUT")
	apiv1.HandleFunc("/boards/{boardID}/members/{userID}", a.sessionRequired(a.handleDeleteMember)).Methods("DELETE")
	apiv1.HandleFunc("/boards/{boardID}/join", a.sessionRequired(a.handleJoinBoard)).Methods("POST")

	// Sharing APIs
	apiv1.HandleFunc("/boards/{boardID}/sharing", a.sessionRequired(a.handlePostSharing)).Methods("POST")
	apiv1.HandleFunc("/boards/{boardID}/sharing", a.sessionRequired(a.handleGetSharing)).Methods("GET")

	// Team APIs
	apiv1.HandleFunc("/teams", a.sessionRequired(a.handleGetTeams)).Methods("GET")
	apiv1.HandleFunc("/teams/{teamID}", a.sessionRequired(a.handleGetTeam)).Methods("GET")
	apiv1.HandleFunc("/teams/{teamID}/regenerate_signup_token", a.sessionRequired(a.handlePostTeamRegenerateSignupToken)).Methods("POST")
	apiv1.HandleFunc("/teams/{teamID}/users", a.sessionRequired(a.handleGetTeamUsers)).Methods("GET")
	apiv1.HandleFunc("/teams/{teamID}/archive/export", a.sessionRequired(a.handleArchiveExportTeam)).Methods("GET")
	apiv1.HandleFunc("/teams/{teamID}/{boardID}/files", a.sessionRequired(a.handleUploadFile)).Methods("POST")

	// User APIs
	apiv1.HandleFunc("/users/me", a.sessionRequired(a.handleGetMe)).Methods("GET")
	apiv1.HandleFunc("/users/me/memberships", a.sessionRequired(a.handleGetMyMemberships)).Methods("GET")
	apiv1.HandleFunc("/users/{userID}", a.sessionRequired(a.handleGetUser)).Methods("GET")
	apiv1.HandleFunc("/users/{userID}/changepassword", a.sessionRequired(a.handleChangePassword)).Methods("POST")
	apiv1.HandleFunc("/users/{userID}/config", a.sessionRequired(a.handleUpdateUserConfig)).Methods(http.MethodPut)

	// BoardsAndBlocks APIs
	apiv1.HandleFunc("/boards-and-blocks", a.sessionRequired(a.handleCreateBoardsAndBlocks)).Methods("POST")
	apiv1.HandleFunc("/boards-and-blocks", a.sessionRequired(a.handlePatchBoardsAndBlocks)).Methods("PATCH")
	apiv1.HandleFunc("/boards-and-blocks", a.sessionRequired(a.handleDeleteBoardsAndBlocks)).Methods("DELETE")

	// Auth APIs
	apiv1.HandleFunc("/login", a.handleLogin).Methods("POST")
	apiv1.HandleFunc("/logout", a.sessionRequired(a.handleLogout)).Methods("POST")
	apiv1.HandleFunc("/register", a.handleRegister).Methods("POST")
	apiv1.HandleFunc("/clientConfig", a.getClientConfig).Methods("GET")

	// Category APIs
	apiv1.HandleFunc("/teams/{teamID}/categories", a.sessionRequired(a.handleCreateCategory)).Methods(http.MethodPost)
	apiv1.HandleFunc("/teams/{teamID}/categories/{categoryID}", a.sessionRequired(a.handleUpdateCategory)).Methods(http.MethodPut)
	apiv1.HandleFunc("/teams/{teamID}/categories/{categoryID}", a.sessionRequired(a.handleDeleteCategory)).Methods(http.MethodDelete)

	// Category Block APIs
	apiv1.HandleFunc("/teams/{teamID}/categories", a.sessionRequired(a.handleGetUserCategoryBlocks)).Methods(http.MethodGet)
	apiv1.HandleFunc("/teams/{teamID}/categories/{categoryID}/blocks/{blockID}", a.sessionRequired(a.handleUpdateCategoryBlock)).Methods(http.MethodPost)

	// Get Files API
	files := r.PathPrefix("/files").Subrouter()
	files.HandleFunc("/teams/{teamID}/{boardID}/{filename}", a.attachSession(a.handleServeFile, false)).Methods("GET")

	// Subscriptions
	apiv1.HandleFunc("/subscriptions", a.sessionRequired(a.handleCreateSubscription)).Methods("POST")
	apiv1.HandleFunc("/subscriptions/{blockID}/{subscriberID}", a.sessionRequired(a.handleDeleteSubscription)).Methods("DELETE")
	apiv1.HandleFunc("/subscriptions/{subscriberID}", a.sessionRequired(a.handleGetSubscriptions)).Methods("GET")

	// onboarding tour endpoints
	apiv1.HandleFunc("/teams/{teamID}/onboard", a.sessionRequired(a.handleOnboard)).Methods(http.MethodPost)

	// archives
	apiv1.HandleFunc("/boards/{boardID}/archive/export", a.sessionRequired(a.handleArchiveExportBoard)).Methods("GET")
	apiv1.HandleFunc("/teams/{teamID}/archive/import", a.sessionRequired(a.handleArchiveImport)).Methods("POST")
}

func (a *API) RegisterAdminRoutes(r *mux.Router) {
	r.HandleFunc("/api/v1/admin/users/{username}/password", a.adminRequired(a.handleAdminSetPassword)).Methods("POST")
}

func getUserID(r *http.Request) string {
	ctx := r.Context()
	session, ok := ctx.Value(sessionContextKey).(*model.Session)
	if !ok {
		return ""
	}
	return session.UserID
}

func (a *API) panicHandler(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if p := recover(); p != nil {
				a.logger.Error("Http handler panic",
					mlog.Any("panic", p),
					mlog.String("stack", string(debug.Stack())),
					mlog.String("uri", r.URL.Path),
				)
				a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", nil)
			}
		}()

		next.ServeHTTP(w, r)
	})
}

func (a *API) requireCSRFToken(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !a.checkCSRFToken(r) {
			a.logger.Error("checkCSRFToken FAILED")
			a.errorResponse(w, r.URL.Path, http.StatusBadRequest, "checkCSRFToken FAILED", nil)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func (a *API) getClientConfig(w http.ResponseWriter, r *http.Request) {
	clientConfig := a.app.GetClientConfig()

	configData, err := json.Marshal(clientConfig)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}
	jsonBytesResponse(w, http.StatusOK, configData)
}

func (a *API) checkCSRFToken(r *http.Request) bool {
	token := r.Header.Get(HeaderRequestedWith)
	return token == HeaderRequestedWithXML
}

func (a *API) hasValidReadTokenForBoard(r *http.Request, boardID string) bool {
	query := r.URL.Query()
	readToken := query.Get("read_token")

	if len(readToken) < 1 {
		return false
	}

	isValid, err := a.app.IsValidReadToken(boardID, readToken)
	if err != nil {
		a.logger.Error("IsValidReadTokenForBoard ERROR", mlog.Err(err))
		return false
	}

	return isValid
}

func (a *API) handleGetBlocks(w http.ResponseWriter, r *http.Request) {
	// swagger:operation GET /api/v1/boards/{boardID}/blocks getBlocks
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

	board, err := a.app.GetBoard(boardID)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}
	if board == nil {
		a.errorResponse(w, r.URL.Path, http.StatusNotFound, "Board not found", nil)
		return
	}

	if !a.hasValidReadTokenForBoard(r, boardID) {
		if board.IsTemplate {
			if !a.permissions.HasPermissionToTeam(userID, board.TeamID, model.PermissionViewTeam) {
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

	json, err := json.Marshal(blocks)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	jsonBytesResponse(w, http.StatusOK, json)

	auditRec.AddMeta("blockCount", len(blocks))
	auditRec.Success()
}

func stampModificationMetadata(r *http.Request, blocks []model.Block, auditRec *audit.Record) {
	userID := getUserID(r)
	if userID == model.SingleUser {
		userID = ""
	}

	now := utils.GetMillis()
	for i := range blocks {
		blocks[i].ModifiedBy = userID
		blocks[i].UpdateAt = now

		if auditRec != nil {
			auditRec.AddMeta("block_"+strconv.FormatInt(int64(i), 10), blocks[i])
		}
	}
}

func (a *API) handleCreateCategory(w http.ResponseWriter, r *http.Request) {
	requestBody, err := ioutil.ReadAll(r.Body)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	var category model.Category

	err = json.Unmarshal(requestBody, &category)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	auditRec := a.makeAuditRecord(r, "createCategory", audit.Fail)
	defer a.audit.LogRecord(audit.LevelModify, auditRec)

	ctx := r.Context()
	session := ctx.Value(sessionContextKey).(*model.Session)

	// user can only create category for themselves
	if category.UserID != session.UserID {
		a.errorResponse(
			w,
			r.URL.Path,
			http.StatusBadRequest,
			fmt.Sprintf("userID %s and category userID %s mismatch", session.UserID, category.UserID),
			nil,
		)
		return
	}

	vars := mux.Vars(r)
	teamID := vars["teamID"]

	if category.TeamID != teamID {
		a.errorResponse(
			w,
			r.URL.Path,
			http.StatusBadRequest,
			"teamID mismatch",
			nil,
		)
		return
	}

	createdCategory, err := a.app.CreateCategory(&category)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	data, err := json.Marshal(createdCategory)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	jsonBytesResponse(w, http.StatusOK, data)
	auditRec.AddMeta("categoryID", createdCategory.ID)
	auditRec.Success()
}

func (a *API) handleUpdateCategory(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	categoryID := vars["categoryID"]

	requestBody, err := ioutil.ReadAll(r.Body)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	var category model.Category
	err = json.Unmarshal(requestBody, &category)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	auditRec := a.makeAuditRecord(r, "updateCategory", audit.Fail)
	defer a.audit.LogRecord(audit.LevelModify, auditRec)

	if categoryID != category.ID {
		a.errorResponse(w, r.URL.Path, http.StatusBadRequest, "categoryID mismatch in patch and body", nil)
		return
	}

	ctx := r.Context()
	session := ctx.Value(sessionContextKey).(*model.Session)

	// user can only update category for themselves
	if category.UserID != session.UserID {
		a.errorResponse(w, r.URL.Path, http.StatusBadRequest, "user ID mismatch in session and category", nil)
		return
	}

	teamID := vars["teamID"]
	if category.TeamID != teamID {
		a.errorResponse(
			w,
			r.URL.Path,
			http.StatusBadRequest,
			"teamID mismatch",
			nil,
		)
		return
	}

	updatedCategory, err := a.app.UpdateCategory(&category)
	if err != nil {
		switch {
		case errors.Is(err, app.ErrorCategoryDeleted):
			a.errorResponse(w, r.URL.Path, http.StatusNotFound, "", err)
		case errors.Is(err, app.ErrorCategoryPermissionDenied):
			a.errorResponse(w, r.URL.Path, http.StatusForbidden, "", err)
		default:
			a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		}
		return
	}

	data, err := json.Marshal(updatedCategory)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	jsonBytesResponse(w, http.StatusOK, data)
	auditRec.Success()
}

func (a *API) handleDeleteCategory(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	session := ctx.Value(sessionContextKey).(*model.Session)
	vars := mux.Vars(r)

	userID := session.UserID
	teamID := vars["teamID"]
	categoryID := vars["categoryID"]

	auditRec := a.makeAuditRecord(r, "deleteCategory", audit.Fail)
	defer a.audit.LogRecord(audit.LevelModify, auditRec)

	deletedCategory, err := a.app.DeleteCategory(categoryID, userID, teamID)
	if err != nil {
		if errors.Is(err, app.ErrorCategoryPermissionDenied) {
			a.errorResponse(w, r.URL.Path, http.StatusForbidden, "", err)
		} else {
			a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		}
		return
	}

	data, err := json.Marshal(deletedCategory)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	jsonBytesResponse(w, http.StatusOK, data)
	auditRec.Success()
}

func (a *API) handleGetUserCategoryBlocks(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	session := ctx.Value(sessionContextKey).(*model.Session)
	userID := session.UserID

	vars := mux.Vars(r)
	teamID := vars["teamID"]

	auditRec := a.makeAuditRecord(r, "getUserCategoryBlocks", audit.Fail)
	defer a.audit.LogRecord(audit.LevelModify, auditRec)

	categoryBlocks, err := a.app.GetUserCategoryBlocks(userID, teamID)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	data, err := json.Marshal(categoryBlocks)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	jsonBytesResponse(w, http.StatusOK, data)
	auditRec.Success()
}

func (a *API) handleUpdateCategoryBlock(w http.ResponseWriter, r *http.Request) {
	auditRec := a.makeAuditRecord(r, "updateCategoryBlock", audit.Fail)
	defer a.audit.LogRecord(audit.LevelModify, auditRec)

	vars := mux.Vars(r)
	categoryID := vars["categoryID"]
	blockID := vars["blockID"]
	teamID := vars["teamID"]

	ctx := r.Context()
	session := ctx.Value(sessionContextKey).(*model.Session)
	userID := session.UserID

	err := a.app.AddUpdateUserCategoryBlock(teamID, userID, categoryID, blockID)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	jsonBytesResponse(w, http.StatusOK, []byte("ok"))
	auditRec.Success()
}

func (a *API) handlePostBlocks(w http.ResponseWriter, r *http.Request) {
	// swagger:operation POST /api/v1/boards/{boardID}/blocks updateBlocks
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

	newBlocks, err := a.app.InsertBlocks(blocks, session.UserID, true)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	a.logger.Debug("POST Blocks", mlog.Int("block_count", len(blocks)))

	json, err := json.Marshal(newBlocks)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	jsonBytesResponse(w, http.StatusOK, json)

	auditRec.AddMeta("blockCount", len(blocks))
	auditRec.Success()
}

func (a *API) handleUpdateUserConfig(w http.ResponseWriter, r *http.Request) {
	// swagger:operation PATCH /api/v1/users/{userID}/config updateUserConfig
	//
	// Updates user config
	//
	// ---
	// produces:
	// - application/json
	// parameters:
	// - name: userID
	//   in: path
	//   description: User ID
	//   required: true
	//   type: string
	// - name: Body
	//   in: body
	//   description: User config patch to apply
	//   required: true
	//   schema:
	//     "$ref": "#/definitions/UserPropPatch"
	// security:
	// - BearerAuth: []
	// responses:
	//   '200':
	//     description: success
	//   default:
	//     description: internal error
	//     schema:
	//       "$ref": "#/definitions/ErrorResponse"

	requestBody, err := ioutil.ReadAll(r.Body)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	var patch *model.UserPropPatch
	err = json.Unmarshal(requestBody, &patch)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	vars := mux.Vars(r)
	userID := vars["userID"]

	ctx := r.Context()
	session := ctx.Value(sessionContextKey).(*model.Session)

	auditRec := a.makeAuditRecord(r, "updateUserConfig", audit.Fail)
	defer a.audit.LogRecord(audit.LevelModify, auditRec)

	// a user can update only own config
	if userID != session.UserID {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	updatedConfig, err := a.app.UpdateUserConfig(userID, *patch)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	data, err := json.Marshal(updatedConfig)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	jsonBytesResponse(w, http.StatusOK, data)
	auditRec.Success()
}

func (a *API) handleGetUser(w http.ResponseWriter, r *http.Request) {
	// swagger:operation GET /api/v1/users/{userID} getUser
	//
	// Returns a user
	//
	// ---
	// produces:
	// - application/json
	// parameters:
	// - name: userID
	//   in: path
	//   description: User ID
	//   required: true
	//   type: string
	// security:
	// - BearerAuth: []
	// responses:
	//   '200':
	//     description: success
	//     schema:
	//       "$ref": "#/definitions/User"
	//   default:
	//     description: internal error
	//     schema:
	//       "$ref": "#/definitions/ErrorResponse"

	vars := mux.Vars(r)
	userID := vars["userID"]

	auditRec := a.makeAuditRecord(r, "postBlocks", audit.Fail)
	defer a.audit.LogRecord(audit.LevelRead, auditRec)
	auditRec.AddMeta("userID", userID)

	user, err := a.app.GetUser(userID)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	userData, err := json.Marshal(user)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	jsonBytesResponse(w, http.StatusOK, userData)
	auditRec.Success()
}

func (a *API) handleGetMe(w http.ResponseWriter, r *http.Request) {
	// swagger:operation GET /api/v1/users/me getMe
	//
	// Returns the currently logged-in user
	//
	// ---
	// produces:
	// - application/json
	// security:
	// - BearerAuth: []
	// responses:
	//   '200':
	//     description: success
	//     schema:
	//       "$ref": "#/definitions/User"
	//   default:
	//     description: internal error
	//     schema:
	//       "$ref": "#/definitions/ErrorResponse"

	userID := getUserID(r)

	var user *model.User
	var err error

	auditRec := a.makeAuditRecord(r, "getMe", audit.Fail)
	defer a.audit.LogRecord(audit.LevelRead, auditRec)

	if userID == model.SingleUser {
		now := utils.GetMillis()
		user = &model.User{
			ID:       model.SingleUser,
			Username: model.SingleUser,
			Email:    model.SingleUser,
			CreateAt: now,
			UpdateAt: now,
		}
	} else {
		user, err = a.app.GetUser(userID)
		if err != nil {
			a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
			return
		}
	}

	userData, err := json.Marshal(user)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	jsonBytesResponse(w, http.StatusOK, userData)

	auditRec.AddMeta("userID", user.ID)
	auditRec.Success()
}

func (a *API) handleGetMyMemberships(w http.ResponseWriter, r *http.Request) {
	// swagger:operation GET /api/v1/users/me/memberships getMyMemberships
	//
	// Returns the currently users board memberships
	//
	// ---
	// produces:
	// - application/json
	// security:
	// - BearerAuth: []
	// responses:
	//   '200':
	//     description: success
	//     schema:
	//       type: array
	//       items:
	//         "$ref": "#/definitions/BoardMember"
	//   default:
	//     description: internal error
	//     schema:
	//       "$ref": "#/definitions/ErrorResponse"

	userID := getUserID(r)

	auditRec := a.makeAuditRecord(r, "getMyBoardMemberships", audit.Fail)
	auditRec.AddMeta("userID", userID)
	defer a.audit.LogRecord(audit.LevelRead, auditRec)

	members, err := a.app.GetMembersForUser(userID)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	membersData, err := json.Marshal(members)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	jsonBytesResponse(w, http.StatusOK, membersData)

	auditRec.Success()
}

func (a *API) handleDeleteBlock(w http.ResponseWriter, r *http.Request) {
	// swagger:operation DELETE /api/v1/boards/{boardID}/blocks/{blockID} deleteBlock
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
	// swagger:operation POST /api/v1/workspaces/{workspaceID}/blocks/{blockID}/undelete undeleteBlock
	//
	// Undeletes a block
	//
	// ---
	// produces:
	// - application/json
	// parameters:
	// - name: workspaceID
	//   in: path
	//   description: Workspace ID
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
	//   default:
	//     description: internal error
	//     schema:
	//       "$ref": "#/definitions/ErrorResponse"

	ctx := r.Context()
	session := ctx.Value(sessionContextKey).(*model.Session)
	userID := session.UserID

	vars := mux.Vars(r)
	blockID := vars["blockID"]

	auditRec := a.makeAuditRecord(r, "undeleteBlock", audit.Fail)
	defer a.audit.LogRecord(audit.LevelModify, auditRec)
	auditRec.AddMeta("blockID", blockID)

	err := a.app.UndeleteBlock(blockID, userID)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	a.logger.Debug("UNDELETE Block", mlog.String("blockID", blockID))
	jsonStringResponse(w, http.StatusOK, "{}")

	auditRec.Success()
}

func (a *API) handlePatchBlock(w http.ResponseWriter, r *http.Request) {
	// swagger:operation PATCH /api/v1/boards/{boardID}/blocks/{blockID} patchBlock
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
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	a.logger.Debug("PATCH Block", mlog.String("boardID", boardID), mlog.String("blockID", blockID))
	jsonStringResponse(w, http.StatusOK, "{}")

	auditRec.Success()
}

func (a *API) handlePatchBlocks(w http.ResponseWriter, r *http.Request) {
	// swagger:operation PATCH /api/v1/boards/{boardID}/blocks/ patchBlocks
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

	err = a.app.PatchBlocks(teamID, patches, userID)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	a.logger.Debug("PATCH Blocks", mlog.String("patches", strconv.Itoa(len(patches.BlockIDs))))
	jsonStringResponse(w, http.StatusOK, "{}")

	auditRec.Success()
}

func (a *API) handleGetSubTree(w http.ResponseWriter, r *http.Request) {
	// swagger:operation GET /api/v1/boards/{boardID}/blocks/{blockID}/subtree getSubTree
	//
	// Returns the blocks of a subtree
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
	//   description: The ID of the root block of the subtree
	//   required: true
	//   type: string
	// - name: l
	//   in: query
	//   description: The number of levels to return. 2 or 3. Defaults to 2.
	//   required: false
	//   type: integer
	//   minimum: 2
	//   maximum: 3
	// security:
	// - BearerAuth: []
	// responses:
	//   '200':
	//     description: success
	//     schema:
	//       type: array
	//       items:
	//         "$ref": "#/definitions/Block"
	//   default:
	//     description: internal error
	//     schema:
	//       "$ref": "#/definitions/ErrorResponse"

	userID := getUserID(r)
	vars := mux.Vars(r)
	boardID := vars["boardID"]
	blockID := vars["blockID"]

	if !a.hasValidReadTokenForBoard(r, boardID) && !a.permissions.HasPermissionToBoard(userID, boardID, model.PermissionViewBoard) {
		a.errorResponse(w, r.URL.Path, http.StatusForbidden, "", PermissionError{"access denied to board"})
		return
	}

	query := r.URL.Query()
	levels, err := strconv.ParseInt(query.Get("l"), 10, 32)
	if err != nil {
		levels = 2
	}

	if levels != 2 && levels != 3 {
		a.logger.Error("Invalid levels", mlog.Int64("levels", levels))
		a.errorResponse(w, r.URL.Path, http.StatusBadRequest, "invalid levels", nil)
		return
	}

	auditRec := a.makeAuditRecord(r, "getSubTree", audit.Fail)
	defer a.audit.LogRecord(audit.LevelRead, auditRec)
	auditRec.AddMeta("boardID", boardID)
	auditRec.AddMeta("blockID", blockID)

	blocks, err := a.app.GetSubTree(boardID, blockID, int(levels), model.QuerySubtreeOptions{})
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	a.logger.Debug("GetSubTree",
		mlog.Int64("levels", levels),
		mlog.String("boardID", boardID),
		mlog.String("blockID", blockID),
		mlog.Int("block_count", len(blocks)),
	)
	json, err := json.Marshal(blocks)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	jsonBytesResponse(w, http.StatusOK, json)

	auditRec.AddMeta("blockCount", len(blocks))
	auditRec.Success()
}

func (a *API) handleExport(w http.ResponseWriter, r *http.Request) {
	// swagger:operation GET /api/v1/boards/{boardID}/blocks/export exportBlocks
	//
	// Returns all blocks of a board
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
	// security:
	// - BearerAuth: []
	// responses:
	//   '200':
	//     description: success
	//     schema:
	//       type: array
	//       items:
	//         "$ref": "#/definitions/Block"
	//   default:
	//     description: internal error
	//     schema:
	//       "$ref": "#/definitions/ErrorResponse"

	userID := getUserID(r)
	vars := mux.Vars(r)
	boardID := vars["boardID"]

	if !a.permissions.HasPermissionToBoard(userID, boardID, model.PermissionViewBoard) {
		a.errorResponse(w, r.URL.Path, http.StatusForbidden, "", PermissionError{"access denied to board"})
		return
	}

	query := r.URL.Query()
	rootID := query.Get("root_id")

	auditRec := a.makeAuditRecord(r, "export", audit.Fail)
	defer a.audit.LogRecord(audit.LevelRead, auditRec)
	auditRec.AddMeta("boardID", boardID)
	auditRec.AddMeta("rootID", rootID)

	var blocks []model.Block
	var err error
	if rootID == "" {
		blocks, err = a.app.GetBlocksForBoard(boardID)
	} else {
		blocks, err = a.app.GetBlocksWithBoardID(boardID)
	}
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	a.logger.Debug("raw blocks", mlog.Int("block_count", len(blocks)))
	auditRec.AddMeta("rawCount", len(blocks))

	blocks = filterOrphanBlocks(blocks)

	a.logger.Debug("EXPORT filtered blocks", mlog.Int("block_count", len(blocks)))
	auditRec.AddMeta("filteredCount", len(blocks))

	json, err := json.Marshal(blocks)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	jsonBytesResponse(w, http.StatusOK, json)

	auditRec.Success()
}

func filterOrphanBlocks(blocks []model.Block) (ret []model.Block) {
	queue := make([]model.Block, 0)
	childrenOfBlockWithID := make(map[string]*[]model.Block)

	// Build the trees from nodes
	for _, block := range blocks {
		if len(block.ParentID) == 0 {
			// Queue root blocks to process first
			queue = append(queue, block)
		} else {
			siblings := childrenOfBlockWithID[block.ParentID]
			if siblings != nil {
				*siblings = append(*siblings, block)
			} else {
				siblings := []model.Block{block}
				childrenOfBlockWithID[block.ParentID] = &siblings
			}
		}
	}

	// Map the trees to an array, which skips orphaned nodes
	blocks = make([]model.Block, 0)
	for len(queue) > 0 {
		block := queue[0]
		queue = queue[1:] // dequeue
		blocks = append(blocks, block)
		children := childrenOfBlockWithID[block.ID]
		if children != nil {
			queue = append(queue, *children...)
		}
	}

	return blocks
}

func (a *API) handleImport(w http.ResponseWriter, r *http.Request) {
	// swagger:operation POST /api/v1/boards/{boardID}/blocks/import importBlocks
	//
	// Import blocks on a given board
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
	// - name: Body
	//   in: body
	//   description: array of blocks to import
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
	//   default:
	//     description: internal error
	//     schema:
	//       "$ref": "#/definitions/ErrorResponse"

	userID := getUserID(r)
	vars := mux.Vars(r)
	boardID := vars["boardID"]

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

	auditRec := a.makeAuditRecord(r, "import", audit.Fail)
	defer a.audit.LogRecord(audit.LevelModify, auditRec)
	auditRec.AddMeta("boardID", boardID)

	// all blocks should now be part of the board that they're being
	// imported onto
	for i := range blocks {
		blocks[i].BoardID = boardID
	}

	stampModificationMetadata(r, blocks, auditRec)

	if _, err = a.app.InsertBlocks(model.GenerateBlockIDs(blocks, a.logger), userID, false); err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	jsonStringResponse(w, http.StatusOK, "{}")

	a.logger.Debug("IMPORT BlockIDs", mlog.Int("block_count", len(blocks)))
	auditRec.AddMeta("blockCount", len(blocks))
	auditRec.Success()
}

// Sharing

func (a *API) handleGetSharing(w http.ResponseWriter, r *http.Request) {
	// swagger:operation GET /api/v1/boards/{boardID}/sharing getSharing
	//
	// Returns sharing information for a board
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
	// security:
	// - BearerAuth: []
	// responses:
	//   '200':
	//     description: success
	//     schema:
	//       "$ref": "#/definitions/Sharing"
	//   default:
	//     description: internal error
	//     schema:
	//       "$ref": "#/definitions/ErrorResponse"

	vars := mux.Vars(r)
	boardID := vars["boardID"]

	userID := getUserID(r)
	if !a.permissions.HasPermissionToBoard(userID, boardID, model.PermissionViewBoard) {
		a.errorResponse(w, r.URL.Path, http.StatusForbidden, "", PermissionError{"access denied to sharing the board"})
		return
	}

	auditRec := a.makeAuditRecord(r, "getSharing", audit.Fail)
	defer a.audit.LogRecord(audit.LevelRead, auditRec)
	auditRec.AddMeta("boardID", boardID)

	sharing, err := a.app.GetSharing(boardID)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}
	if sharing == nil {
		a.errorResponse(w, r.URL.Path, http.StatusNotFound, "", nil)
		return
	}

	sharingData, err := json.Marshal(sharing)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	jsonBytesResponse(w, http.StatusOK, sharingData)

	a.logger.Debug("GET sharing",
		mlog.String("boardID", boardID),
		mlog.String("shareID", sharing.ID),
		mlog.Bool("enabled", sharing.Enabled),
	)
	auditRec.AddMeta("shareID", sharing.ID)
	auditRec.AddMeta("enabled", sharing.Enabled)
	auditRec.Success()
}

func (a *API) handlePostSharing(w http.ResponseWriter, r *http.Request) {
	// swagger:operation POST /api/v1/boards/{boardID}/sharing postSharing
	//
	// Sets sharing information for a board
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
	// - name: Body
	//   in: body
	//   description: sharing information for a root block
	//   required: true
	//   schema:
	//     "$ref": "#/definitions/Sharing"
	// security:
	// - BearerAuth: []
	// responses:
	//   '200':
	//     description: success
	//   default:
	//     description: internal error
	//     schema:
	//       "$ref": "#/definitions/ErrorResponse"

	boardID := mux.Vars(r)["boardID"]

	userID := getUserID(r)
	if !a.permissions.HasPermissionToBoard(userID, boardID, model.PermissionShareBoard) {
		a.errorResponse(w, r.URL.Path, http.StatusForbidden, "", PermissionError{"access denied to sharing the board"})
		return
	}

	requestBody, err := ioutil.ReadAll(r.Body)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	var sharing model.Sharing
	err = json.Unmarshal(requestBody, &sharing)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	// Stamp boardID from the URL
	sharing.ID = boardID

	auditRec := a.makeAuditRecord(r, "postSharing", audit.Fail)
	defer a.audit.LogRecord(audit.LevelModify, auditRec)
	auditRec.AddMeta("shareID", sharing.ID)
	auditRec.AddMeta("enabled", sharing.Enabled)

	// Stamp ModifiedBy
	modifiedBy := userID
	if userID == model.SingleUser {
		modifiedBy = ""
	}
	sharing.ModifiedBy = modifiedBy

	if userID == model.SingleUser {
		userID = ""
	}

	if !a.app.GetClientConfig().EnablePublicSharedBoards {
		a.logger.Info(
			"Attempt to turn on sharing for board via API failed, sharing off in configuration.",
			mlog.String("boardID", sharing.ID),
			mlog.String("userID", userID))
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "Turning on sharing for board failed, see log for details.", nil)
		return
	}

	sharing.ModifiedBy = userID

	err = a.app.UpsertSharing(sharing)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	jsonStringResponse(w, http.StatusOK, "{}")

	a.logger.Debug("POST sharing", mlog.String("sharingID", sharing.ID))
	auditRec.Success()
}

// Team

func (a *API) handleGetTeams(w http.ResponseWriter, r *http.Request) {
	// swagger:operation GET /api/v1/teams getTeams
	//
	// Returns information of all the teams
	//
	// ---
	// produces:
	// - application/json
	// security:
	// - BearerAuth: []
	// responses:
	//   '200':
	//     description: success
	//     schema:
	//       type: array
	//       items:
	//         "$ref": "#/definitions/Team"
	//   default:
	//     description: internal error
	//     schema:
	//       "$ref": "#/definitions/ErrorResponse"

	userID := getUserID(r)

	teams, err := a.app.GetTeamsForUser(userID)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
	}

	auditRec := a.makeAuditRecord(r, "getTeams", audit.Fail)
	defer a.audit.LogRecord(audit.LevelRead, auditRec)
	auditRec.AddMeta("teamCount", len(teams))

	data, err := json.Marshal(teams)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	jsonBytesResponse(w, http.StatusOK, data)
	auditRec.Success()
}

func (a *API) handleGetTeam(w http.ResponseWriter, r *http.Request) {
	// swagger:operation GET /api/v1/teams/{teamID} getTeam
	//
	// Returns information of the root team
	//
	// ---
	// produces:
	// - application/json
	// parameters:
	// - name: teamID
	//   in: path
	//   description: Team ID
	//   required: true
	//   type: string
	// security:
	// - BearerAuth: []
	// responses:
	//   '200':
	//     description: success
	//     schema:
	//       "$ref": "#/definitions/Team"
	//   default:
	//     description: internal error
	//     schema:
	//       "$ref": "#/definitions/ErrorResponse"

	vars := mux.Vars(r)
	teamID := vars["teamID"]
	userID := getUserID(r)

	if !a.permissions.HasPermissionToTeam(userID, teamID, model.PermissionViewTeam) {
		a.errorResponse(w, r.URL.Path, http.StatusForbidden, "", PermissionError{"access denied to team"})
		return
	}

	var team *model.Team
	var err error

	if a.MattermostAuth {
		team, err = a.app.GetTeam(teamID)
		if err != nil {
			a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		}
		if team == nil {
			a.errorResponse(w, r.URL.Path, http.StatusUnauthorized, "invalid team", nil)
			return
		}
	} else {
		team, err = a.app.GetRootTeam()
		if err != nil {
			a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
			return
		}
	}

	auditRec := a.makeAuditRecord(r, "getTeam", audit.Fail)
	defer a.audit.LogRecord(audit.LevelRead, auditRec)
	auditRec.AddMeta("resultTeamID", team.ID)

	data, err := json.Marshal(team)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	jsonBytesResponse(w, http.StatusOK, data)
	auditRec.Success()
}

func (a *API) handlePostTeamRegenerateSignupToken(w http.ResponseWriter, r *http.Request) {
	// swagger:operation POST /api/v1/teams/{teamID}/regenerate_signup_token regenerateSignupToken
	//
	// Regenerates the signup token for the root team
	//
	// ---
	// produces:
	// - application/json
	// parameters:
	// - name: teamID
	//   in: path
	//   description: Team ID
	//   required: true
	//   type: string
	// security:
	// - BearerAuth: []
	// responses:
	//   '200':
	//     description: success
	//   default:
	//     description: internal error
	//     schema:
	//       "$ref": "#/definitions/ErrorResponse"

	team, err := a.app.GetRootTeam()
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	auditRec := a.makeAuditRecord(r, "regenerateSignupToken", audit.Fail)
	defer a.audit.LogRecord(audit.LevelModify, auditRec)

	team.SignupToken = utils.NewID(utils.IDTypeToken)

	err = a.app.UpsertTeamSignupToken(*team)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	jsonStringResponse(w, http.StatusOK, "{}")
	auditRec.Success()
}

// File upload

func (a *API) handleServeFile(w http.ResponseWriter, r *http.Request) {
	// swagger:operation GET "api/v1/files/teams/{teamID}/{boardID}/{filename} getFile
	//
	// Returns the contents of an uploaded file
	//
	// ---
	// produces:
	// - application/json
	// - image/jpg
	// - image/png
	// - image/gif
	// parameters:
	// - name: teamID
	//   in: path
	//   description: Team ID
	//   required: true
	//   type: string
	// - name: boardID
	//   in: path
	//   description: Board ID
	//   required: true
	//   type: string
	// - name: filename
	//   in: path
	//   description: name of the file
	//   required: true
	//   type: string
	// security:
	// - BearerAuth: []
	// responses:
	//   '200':
	//     description: success
	//   default:
	//     description: internal error
	//     schema:
	//       "$ref": "#/definitions/ErrorResponse"

	vars := mux.Vars(r)
	boardID := vars["boardID"]
	filename := vars["filename"]
	userID := getUserID(r)

	hasValidReadToken := a.hasValidReadTokenForBoard(r, boardID)
	if !hasValidReadToken && !a.permissions.HasPermissionToBoard(userID, boardID, model.PermissionViewBoard) {
		a.errorResponse(w, r.URL.Path, http.StatusForbidden, "", PermissionError{"access denied to board"})
		return
	}

	board, err := a.app.GetBoard(boardID)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}
	if board == nil {
		a.errorResponse(w, r.URL.Path, http.StatusNotFound, "", nil)
		return
	}

	auditRec := a.makeAuditRecord(r, "getFile", audit.Fail)
	defer a.audit.LogRecord(audit.LevelRead, auditRec)
	auditRec.AddMeta("boardID", boardID)
	auditRec.AddMeta("teamID", board.TeamID)
	auditRec.AddMeta("filename", filename)

	contentType := "image/jpg"

	fileExtension := strings.ToLower(filepath.Ext(filename))
	if fileExtension == "png" {
		contentType = "image/png"
	}

	if fileExtension == "gif" {
		contentType = "image/gif"
	}

	w.Header().Set("Content-Type", contentType)

	fileReader, err := a.app.GetFileReader(board.TeamID, boardID, filename)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}
	defer fileReader.Close()
	http.ServeContent(w, r, filename, time.Now(), fileReader)
	auditRec.Success()
}

// FileUploadResponse is the response to a file upload
// swagger:model
type FileUploadResponse struct {
	// The FileID to retrieve the uploaded file
	// required: true
	FileID string `json:"fileId"`
}

func FileUploadResponseFromJSON(data io.Reader) (*FileUploadResponse, error) {
	var fileUploadResponse FileUploadResponse

	if err := json.NewDecoder(data).Decode(&fileUploadResponse); err != nil {
		return nil, err
	}
	return &fileUploadResponse, nil
}

func (a *API) handleUploadFile(w http.ResponseWriter, r *http.Request) {
	// swagger:operation POST /api/v1/teams/{teamID}/boards/{boardID}/files uploadFile
	//
	// Upload a binary file, attached to a root block
	//
	// ---
	// consumes:
	// - multipart/form-data
	// produces:
	// - application/json
	// parameters:
	// - name: teamID
	//   in: path
	//   description: ID of the team
	//   required: true
	//   type: string
	// - name: boardID
	//   in: path
	//   description: Board ID
	//   required: true
	//   type: string
	// - name: uploaded file
	//   in: formData
	//   type: file
	//   description: The file to upload
	// security:
	// - BearerAuth: []
	// responses:
	//   '200':
	//     description: success
	//     schema:
	//       "$ref": "#/definitions/FileUploadResponse"
	//   default:
	//     description: internal error
	//     schema:
	//       "$ref": "#/definitions/ErrorResponse"

	vars := mux.Vars(r)
	boardID := vars["boardID"]
	userID := getUserID(r)

	if !a.permissions.HasPermissionToBoard(userID, boardID, model.PermissionManageBoardCards) {
		a.errorResponse(w, r.URL.Path, http.StatusForbidden, "", PermissionError{"access denied to make board changes"})
		return
	}

	board, err := a.app.GetBoard(boardID)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}
	if board == nil {
		a.errorResponse(w, r.URL.Path, http.StatusNotFound, "", nil)
		return
	}

	file, handle, err := r.FormFile(UploadFormFileKey)
	if err != nil {
		fmt.Fprintf(w, "%v", err)
		return
	}
	defer file.Close()

	auditRec := a.makeAuditRecord(r, "uploadFile", audit.Fail)
	defer a.audit.LogRecord(audit.LevelModify, auditRec)
	auditRec.AddMeta("boardID", boardID)
	auditRec.AddMeta("teamID", board.TeamID)
	auditRec.AddMeta("filename", handle.Filename)

	fileID, err := a.app.SaveFile(file, board.TeamID, boardID, handle.Filename)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	a.logger.Debug("uploadFile",
		mlog.String("filename", handle.Filename),
		mlog.String("fileID", fileID),
	)
	data, err := json.Marshal(FileUploadResponse{FileID: fileID})
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	jsonBytesResponse(w, http.StatusOK, data)

	auditRec.AddMeta("fileID", fileID)
	auditRec.Success()
}

func (a *API) handleGetTeamUsers(w http.ResponseWriter, r *http.Request) {
	// swagger:operation GET /api/v1/teams/{teamID}/users getTeamUsers
	//
	// Returns team users
	//
	// ---
	// produces:
	// - application/json
	// parameters:
	// - name: teamID
	//   in: path
	//   description: Team ID
	//   required: true
	//   type: string
	// - name: search
	//   in: query
	//   description: string to filter users list
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
	//         "$ref": "#/definitions/User"
	//   default:
	//     description: internal error
	//     schema:
	//       "$ref": "#/definitions/ErrorResponse"

	vars := mux.Vars(r)
	teamID := vars["teamID"]
	userID := getUserID(r)
	query := r.URL.Query()
	searchQuery := query.Get("search")

	if !a.permissions.HasPermissionToTeam(userID, teamID, model.PermissionViewTeam) {
		a.errorResponse(w, r.URL.Path, http.StatusForbidden, "Access denied to team", PermissionError{"access denied to team"})
		return
	}

	auditRec := a.makeAuditRecord(r, "getUsers", audit.Fail)
	defer a.audit.LogRecord(audit.LevelRead, auditRec)

	users, err := a.app.SearchTeamUsers(teamID, searchQuery)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "searchQuery="+searchQuery, err)
		return
	}

	data, err := json.Marshal(users)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	jsonBytesResponse(w, http.StatusOK, data)

	auditRec.AddMeta("userCount", len(users))
	auditRec.Success()
}

func (a *API) handleGetBoards(w http.ResponseWriter, r *http.Request) {
	// swagger:operation GET /api/v1/teams/{teamID}/boards getBoards
	//
	// Returns team boards
	//
	// ---
	// produces:
	// - application/json
	// parameters:
	// - name: teamID
	//   in: path
	//   description: Team ID
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
	//         "$ref": "#/definitions/Board"
	//   default:
	//     description: internal error
	//     schema:
	//       "$ref": "#/definitions/ErrorResponse"

	teamID := mux.Vars(r)["teamID"]
	userID := getUserID(r)

	if !a.permissions.HasPermissionToTeam(userID, teamID, model.PermissionViewTeam) {
		a.errorResponse(w, r.URL.Path, http.StatusForbidden, "", PermissionError{"access denied to team"})
		return
	}

	auditRec := a.makeAuditRecord(r, "getBoards", audit.Fail)
	defer a.audit.LogRecord(audit.LevelRead, auditRec)
	auditRec.AddMeta("teamID", teamID)

	// retrieve boards list
	boards, err := a.app.GetBoardsForUserAndTeam(userID, teamID)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	a.logger.Debug("GetBoards",
		mlog.String("teamID", teamID),
		mlog.Int("boardsCount", len(boards)),
	)

	data, err := json.Marshal(boards)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	// response
	jsonBytesResponse(w, http.StatusOK, data)

	auditRec.AddMeta("boardsCount", len(boards))
	auditRec.Success()
}

func (a *API) handleGetTemplates(w http.ResponseWriter, r *http.Request) {
	// swagger:operation GET /api/v1/teams/{teamID}/templates getTemplates
	//
	// Returns team templates
	//
	// ---
	// produces:
	// - application/json
	// parameters:
	// - name: teamID
	//   in: path
	//   description: Team ID
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
	//         "$ref": "#/definitions/Board"
	//   default:
	//     description: internal error
	//     schema:
	//       "$ref": "#/definitions/ErrorResponse"

	teamID := mux.Vars(r)["teamID"]
	userID := getUserID(r)

	if teamID != "0" && !a.permissions.HasPermissionToTeam(userID, teamID, model.PermissionViewTeam) {
		a.errorResponse(w, r.URL.Path, http.StatusForbidden, "", PermissionError{"access denied to team"})
		return
	}

	auditRec := a.makeAuditRecord(r, "getTemplates", audit.Fail)
	defer a.audit.LogRecord(audit.LevelRead, auditRec)
	auditRec.AddMeta("teamID", teamID)

	// retrieve boards list
	boards, err := a.app.GetTemplateBoards(teamID, userID)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	a.logger.Debug("GetTemplates",
		mlog.String("teamID", teamID),
		mlog.Int("boardsCount", len(boards)),
	)

	data, err := json.Marshal(boards)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	// response
	jsonBytesResponse(w, http.StatusOK, data)

	auditRec.AddMeta("templatesCount", len(boards))
	auditRec.Success()
}

// subscriptions

func (a *API) handleCreateSubscription(w http.ResponseWriter, r *http.Request) {
	// swagger:operation POST /api/v1/subscriptions createSubscription
	//
	// Creates a subscription to a block for a user. The user will receive change notifications for the block.
	//
	// ---
	// produces:
	// - application/json
	// parameters:
	// - name: Body
	//   in: body
	//   description: subscription definition
	//   required: true
	//   schema:
	//     "$ref": "#/definitions/Subscription"
	// security:
	// - BearerAuth: []
	// responses:
	//   '200':
	//     description: success
	//     schema:
	//         "$ref": "#/definitions/User"
	//   default:
	//     description: internal error
	//     schema:
	//       "$ref": "#/definitions/ErrorResponse"

	requestBody, err := ioutil.ReadAll(r.Body)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	var sub model.Subscription

	err = json.Unmarshal(requestBody, &sub)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	if err = sub.IsValid(); err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusBadRequest, "", err)
	}

	ctx := r.Context()
	session := ctx.Value(sessionContextKey).(*model.Session)

	auditRec := a.makeAuditRecord(r, "createSubscription", audit.Fail)
	defer a.audit.LogRecord(audit.LevelModify, auditRec)
	auditRec.AddMeta("subscriber_id", sub.SubscriberID)
	auditRec.AddMeta("block_id", sub.BlockID)

	// User can only create subscriptions for themselves (for now)
	if session.UserID != sub.SubscriberID {
		a.errorResponse(w, r.URL.Path, http.StatusBadRequest, "userID and subscriberID mismatch", nil)
		return
	}

	// check for valid block
	block, err := a.app.GetBlockByID(sub.BlockID)
	if err != nil || block == nil {
		a.errorResponse(w, r.URL.Path, http.StatusBadRequest, "invalid blockID", err)
		return
	}

	subNew, err := a.app.CreateSubscription(&sub)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	a.logger.Debug("CREATE subscription",
		mlog.String("subscriber_id", subNew.SubscriberID),
		mlog.String("block_id", subNew.BlockID),
	)

	json, err := json.Marshal(subNew)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	jsonBytesResponse(w, http.StatusOK, json)
	auditRec.Success()
}

func (a *API) handleDeleteSubscription(w http.ResponseWriter, r *http.Request) {
	// swagger:operation DELETE /api/v1/subscriptions/{blockID}/{subscriberID} deleteSubscription
	//
	// Deletes a subscription a user has for a a block. The user will no longer receive change notifications for the block.
	//
	// ---
	// produces:
	// - application/json
	// parameters:
	// - name: blockID
	//   in: path
	//   description: Block ID
	//   required: true
	//   type: string
	// - name: subscriberID
	//   in: path
	//   description: Subscriber ID
	//   required: true
	//   type: string
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

	vars := mux.Vars(r)
	blockID := vars["blockID"]
	subscriberID := vars["subscriberID"]

	auditRec := a.makeAuditRecord(r, "deleteSubscription", audit.Fail)
	defer a.audit.LogRecord(audit.LevelModify, auditRec)
	auditRec.AddMeta("block_id", blockID)
	auditRec.AddMeta("subscriber_id", subscriberID)

	// User can only delete subscriptions for themselves
	if session.UserID != subscriberID {
		a.errorResponse(w, r.URL.Path, http.StatusBadRequest, "userID and subscriberID mismatch", nil)
		return
	}

	_, err := a.app.DeleteSubscription(blockID, subscriberID)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	a.logger.Debug("DELETE subscription",
		mlog.String("blockID", blockID),
		mlog.String("subscriberID", subscriberID),
	)
	jsonStringResponse(w, http.StatusOK, "{}")

	auditRec.Success()
}

func (a *API) handleGetSubscriptions(w http.ResponseWriter, r *http.Request) {
	// swagger:operation GET /api/v1/subscriptions/{subscriberID} getSubscriptions
	//
	// Gets subscriptions for a user.
	//
	// ---
	// produces:
	// - application/json
	// parameters:
	// - name: subscriberID
	//   in: path
	//   description: Subscriber ID
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
	//         "$ref": "#/definitions/User"
	//   default:
	//     description: internal error
	//     schema:
	//       "$ref": "#/definitions/ErrorResponse"
	ctx := r.Context()
	session := ctx.Value(sessionContextKey).(*model.Session)

	vars := mux.Vars(r)
	subscriberID := vars["subscriberID"]

	auditRec := a.makeAuditRecord(r, "getSubscriptions", audit.Fail)
	defer a.audit.LogRecord(audit.LevelRead, auditRec)
	auditRec.AddMeta("subscriber_id", subscriberID)

	// User can only get subscriptions for themselves (for now)
	if session.UserID != subscriberID {
		a.errorResponse(w, r.URL.Path, http.StatusBadRequest, "userID and subscriberID mismatch", nil)
		return
	}

	subs, err := a.app.GetSubscriptions(subscriberID)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	a.logger.Debug("GET subscriptions",
		mlog.String("subscriberID", subscriberID),
		mlog.Int("count", len(subs)),
	)

	json, err := json.Marshal(subs)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}
	jsonBytesResponse(w, http.StatusOK, json)

	auditRec.AddMeta("subscription_count", len(subs))
	auditRec.Success()
}

func (a *API) handleCreateBoard(w http.ResponseWriter, r *http.Request) {
	// swagger:operation POST /api/v1/boards createBoard
	//
	// Creates a new board
	//
	// ---
	// produces:
	// - application/json
	// parameters:
	// - name: Body
	//   in: body
	//   description: the board to create
	//   required: true
	//   schema:
	//     "$ref": "#/definitions/Board"
	// security:
	// - BearerAuth: []
	// responses:
	//   '200':
	//     description: success
	//     schema:
	//       $ref: '#/definitions/Board'
	//   default:
	//     description: internal error
	//     schema:
	//       "$ref": "#/definitions/ErrorResponse"

	userID := getUserID(r)

	requestBody, err := ioutil.ReadAll(r.Body)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	var newBoard *model.Board
	if err = json.Unmarshal(requestBody, &newBoard); err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusBadRequest, "", err)
		return
	}

	if newBoard.Type == model.BoardTypeOpen {
		if !a.permissions.HasPermissionToTeam(userID, newBoard.TeamID, model.PermissionCreatePublicChannel) {
			a.errorResponse(w, r.URL.Path, http.StatusForbidden, "", PermissionError{"access denied to create public boards"})
			return
		}
	} else {
		if !a.permissions.HasPermissionToTeam(userID, newBoard.TeamID, model.PermissionCreatePrivateChannel) {
			a.errorResponse(w, r.URL.Path, http.StatusForbidden, "", PermissionError{"access denied to create private boards"})
			return
		}
	}

	if err = newBoard.IsValid(); err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusBadRequest, err.Error(), err)
		return
	}

	auditRec := a.makeAuditRecord(r, "createBoard", audit.Fail)
	defer a.audit.LogRecord(audit.LevelModify, auditRec)
	auditRec.AddMeta("teamID", newBoard.TeamID)
	auditRec.AddMeta("boardType", newBoard.Type)

	// create board
	board, err := a.app.CreateBoard(newBoard, userID, true)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	a.logger.Debug("CreateBoard",
		mlog.String("teamID", board.TeamID),
		mlog.String("boardID", board.ID),
		mlog.String("boardType", string(board.Type)),
		mlog.String("userID", userID),
	)

	data, err := json.Marshal(board)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	// response
	jsonBytesResponse(w, http.StatusOK, data)

	auditRec.Success()
}

func (a *API) handleOnboard(w http.ResponseWriter, r *http.Request) {
	// swagger:operation POST /api/v1/team/{teamID}/onboard onboard
	//
	// Onboards a user on Boards.
	//
	// ---
	// produces:
	// - application/json
	// parameters:
	// - name: teamID
	//   in: path
	//   description: Team ID
	//   required: true
	//   type: string
	// security:
	// - BearerAuth: []
	// responses:
	//   '200':
	//     description: success
	//     schema:
	//         "$ref": "#/definitions/OnboardingResponse"
	//   default:
	//     description: internal error
	//     schema:
	//       "$ref": "#/definitions/ErrorResponse"
	teamID := mux.Vars(r)["teamID"]
	ctx := r.Context()
	session := ctx.Value(sessionContextKey).(*model.Session)

	teamID, boardID, err := a.app.PrepareOnboardingTour(session.UserID, teamID)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	response := map[string]string{
		"teamID":  teamID,
		"boardID": boardID,
	}
	data, err := json.Marshal(response)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	jsonBytesResponse(w, http.StatusOK, data)
}

func (a *API) handleGetBoard(w http.ResponseWriter, r *http.Request) {
	// swagger:operation GET /api/v1/boards/{boardID} getBoard
	//
	// Returns a board
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
	// security:
	// - BearerAuth: []
	// responses:
	//   '200':
	//     description: success
	//     schema:
	//       "$ref": "#/definitions/Board"
	//   default:
	//     description: internal error
	//     schema:
	//       "$ref": "#/definitions/ErrorResponse"

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
		a.errorResponse(w, r.URL.Path, http.StatusNotFound, "", nil)
		return
	}

	if !hasValidReadToken {
		if board.Type == model.BoardTypePrivate {
			if !a.permissions.HasPermissionToBoard(userID, boardID, model.PermissionViewBoard) {
				a.errorResponse(w, r.URL.Path, http.StatusForbidden, "", PermissionError{"access denied to board"})
				return
			}
		} else {
			if !a.permissions.HasPermissionToTeam(userID, board.TeamID, model.PermissionViewTeam) {
				a.errorResponse(w, r.URL.Path, http.StatusForbidden, "", PermissionError{"access denied to board"})
				return
			}
		}
	}

	auditRec := a.makeAuditRecord(r, "getBoard", audit.Fail)
	defer a.audit.LogRecord(audit.LevelRead, auditRec)
	auditRec.AddMeta("boardID", boardID)

	a.logger.Debug("GetBoard",
		mlog.String("boardID", boardID),
	)

	data, err := json.Marshal(board)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	// response
	jsonBytesResponse(w, http.StatusOK, data)

	auditRec.Success()
}

func (a *API) handlePatchBoard(w http.ResponseWriter, r *http.Request) {
	// swagger:operation PATCH /api/v1/boards/{boardID} patchBoard
	//
	// Partially updates a board
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
	// - name: Body
	//   in: body
	//   description: board patch to apply
	//   required: true
	//   schema:
	//     "$ref": "#/definitions/BoardPatch"
	// security:
	// - BearerAuth: []
	// responses:
	//   '200':
	//     description: success
	//     schema:
	//       $ref: '#/definitions/Board'
	//   default:
	//     description: internal error
	//     schema:
	//       "$ref": "#/definitions/ErrorResponse"

	boardID := mux.Vars(r)["boardID"]
	board, err := a.app.GetBoard(boardID)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}
	if board == nil {
		a.errorResponse(w, r.URL.Path, http.StatusNotFound, "", nil)
		return
	}

	userID := getUserID(r)

	requestBody, err := ioutil.ReadAll(r.Body)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	var patch *model.BoardPatch
	if err = json.Unmarshal(requestBody, &patch); err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusBadRequest, "", err)
		return
	}

	if err = patch.IsValid(); err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusBadRequest, err.Error(), err)
		return
	}

	if !a.permissions.HasPermissionToBoard(userID, boardID, model.PermissionManageBoardProperties) {
		a.errorResponse(w, r.URL.Path, http.StatusForbidden, "", PermissionError{"access denied to modifying board properties"})
		return
	}

	if patch.Type != nil {
		if !a.permissions.HasPermissionToBoard(userID, boardID, model.PermissionManageBoardType) {
			a.errorResponse(w, r.URL.Path, http.StatusForbidden, "", PermissionError{"access denied to modifying board type"})
			return
		}
	}

	auditRec := a.makeAuditRecord(r, "patchBoard", audit.Fail)
	defer a.audit.LogRecord(audit.LevelModify, auditRec)
	auditRec.AddMeta("boardID", boardID)
	auditRec.AddMeta("userID", userID)

	// patch board
	updatedBoard, err := a.app.PatchBoard(patch, boardID, userID)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	a.logger.Debug("PatchBoard",
		mlog.String("boardID", boardID),
		mlog.String("userID", userID),
	)

	data, err := json.Marshal(updatedBoard)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	// response
	jsonBytesResponse(w, http.StatusOK, data)

	auditRec.Success()
}

func (a *API) handleDeleteBoard(w http.ResponseWriter, r *http.Request) {
	// swagger:operation DELETE /api/v1/boards/{boardID} deleteBoard
	//
	// Removes a board
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
	// security:
	// - BearerAuth: []
	// responses:
	//   '200':
	//     description: success
	//   default:
	//     description: internal error
	//     schema:
	//       "$ref": "#/definitions/ErrorResponse"

	boardID := mux.Vars(r)["boardID"]
	userID := getUserID(r)

	if !a.permissions.HasPermissionToBoard(userID, boardID, model.PermissionDeleteBoard) {
		a.errorResponse(w, r.URL.Path, http.StatusForbidden, "", PermissionError{"access denied to delete board"})
		return
	}

	auditRec := a.makeAuditRecord(r, "deleteBoard", audit.Fail)
	defer a.audit.LogRecord(audit.LevelModify, auditRec)
	auditRec.AddMeta("boardID", boardID)

	if err := a.app.DeleteBoard(boardID, userID); err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	a.logger.Debug("DELETE Board", mlog.String("boardID", boardID))
	jsonStringResponse(w, http.StatusOK, "{}")

	auditRec.Success()
}

func (a *API) handleDuplicateBoard(w http.ResponseWriter, r *http.Request) {
	// swagger:operation POST /api/v1/boards/{boardID}/duplicate duplicateBoard
	//
	// Returns the new created board and all the blocks
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
	// security:
	// - BearerAuth: []
	// responses:
	//   '200':
	//     description: success
	//     schema:
	//       $ref: '#/definitions/BoardsAndBlocks'
	//   default:
	//     description: internal error
	//     schema:
	//       "$ref": "#/definitions/ErrorResponse"

	boardID := mux.Vars(r)["boardID"]
	userID := getUserID(r)
	query := r.URL.Query()
	asTemplate := query.Get("asTemplate")
	toTeam := query.Get("toTeam")

	if toTeam != "" && !a.permissions.HasPermissionToTeam(userID, toTeam, model.PermissionViewTeam) {
		a.errorResponse(w, r.URL.Path, http.StatusForbidden, "", PermissionError{"access denied to team"})
		return
	}

	if userID == "" {
		a.errorResponse(w, r.URL.Path, http.StatusUnauthorized, "", PermissionError{"access denied to board"})
		return
	}

	board, err := a.app.GetBoard(boardID)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}
	if board == nil {
		a.errorResponse(w, r.URL.Path, http.StatusNotFound, "", nil)
		return
	}

	if board.Type == model.BoardTypePrivate {
		if !a.permissions.HasPermissionToBoard(userID, boardID, model.PermissionViewBoard) {
			a.errorResponse(w, r.URL.Path, http.StatusForbidden, "", PermissionError{"access denied to board"})
			return
		}
	} else {
		if !a.permissions.HasPermissionToTeam(userID, board.TeamID, model.PermissionViewTeam) {
			a.errorResponse(w, r.URL.Path, http.StatusForbidden, "", PermissionError{"access denied to board"})
			return
		}
	}

	auditRec := a.makeAuditRecord(r, "duplicateBoard", audit.Fail)
	defer a.audit.LogRecord(audit.LevelRead, auditRec)
	auditRec.AddMeta("boardID", boardID)

	a.logger.Debug("DuplicateBoard",
		mlog.String("boardID", boardID),
	)

	boardsAndBlocks, _, err := a.app.DuplicateBoard(boardID, userID, toTeam, asTemplate == "true")
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, err.Error(), err)
		return
	}

	data, err := json.Marshal(boardsAndBlocks)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	// response
	jsonBytesResponse(w, http.StatusOK, data)

	auditRec.Success()
}

func (a *API) handleDuplicateBlock(w http.ResponseWriter, r *http.Request) {
	// swagger:operation POST /api/v1/boards/{boardID}/blocks/{blockID}/duplicate duplicateBlock
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
	//   default:
	//     description: internal error
	//     schema:
	//       "$ref": "#/definitions/ErrorResponse"

	boardID := mux.Vars(r)["boardID"]
	blockID := mux.Vars(r)["blockID"]
	userID := getUserID(r)
	query := r.URL.Query()
	asTemplate := query.Get("asTemplate")

	if userID == "" {
		a.errorResponse(w, r.URL.Path, http.StatusUnauthorized, "", PermissionError{"access denied to board"})
		return
	}

	board, err := a.app.GetBlockByID(blockID)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}
	if board == nil {
		a.errorResponse(w, r.URL.Path, http.StatusNotFound, "", nil)
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

	blocks, err := a.app.DuplicateBlock(boardID, blockID, userID, asTemplate == "true")
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

func (a *API) handleGetBoardMetadata(w http.ResponseWriter, r *http.Request) {
	// swagger:operation GET /api/v1/boards/{boardID}/metadata getBoardMetadata
	//
	// Returns a board's metadata
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
	// security:
	// - BearerAuth: []
	// responses:
	//   '200':
	//     description: success
	//     schema:
	//       "$ref": "#/definitions/BoardMetadata"
	//   '404':
	//     description: board not found
	//   '501':
	//     description: required license not found
	//   default:
	//     description: internal error
	//     schema:
	//       "$ref": "#/definitions/ErrorResponse"

	boardID := mux.Vars(r)["boardID"]
	userID := getUserID(r)

	board, boardMetadata, err := a.app.GetBoardMetadata(boardID)
	if errors.Is(err, app.ErrInsufficientLicense) {
		a.errorResponse(w, r.URL.Path, http.StatusNotImplemented, "", err)
		return
	}
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}
	if board == nil || boardMetadata == nil {
		a.errorResponse(w, r.URL.Path, http.StatusNotFound, "", nil)
		return
	}

	if board.Type == model.BoardTypePrivate {
		if !a.permissions.HasPermissionToBoard(userID, boardID, model.PermissionViewBoard) {
			a.errorResponse(w, r.URL.Path, http.StatusForbidden, "", PermissionError{"access denied to board"})
			return
		}
	} else {
		if !a.permissions.HasPermissionToTeam(userID, board.TeamID, model.PermissionViewTeam) {
			a.errorResponse(w, r.URL.Path, http.StatusForbidden, "", PermissionError{"access denied to board"})
			return
		}
	}

	auditRec := a.makeAuditRecord(r, "getBoardMetadata", audit.Fail)
	defer a.audit.LogRecord(audit.LevelRead, auditRec)
	auditRec.AddMeta("boardID", boardID)

	data, err := json.Marshal(boardMetadata)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	// response
	jsonBytesResponse(w, http.StatusOK, data)

	auditRec.Success()
}

func (a *API) handleSearchBoards(w http.ResponseWriter, r *http.Request) {
	// swagger:operation GET /api/v1/teams/{teamID}/boards/search searchBoards
	//
	// Returns the boards that match with a search term
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
	// - name: teamID
	//   in: path
	//   description: Team ID
	//   required: true
	//   type: string
	// - name: q
	//   in: query
	//   description: The search term. Must have at least one character
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
	//         "$ref": "#/definitions/Board"
	//   default:
	//     description: internal error
	//     schema:
	//       "$ref": "#/definitions/ErrorResponse"

	teamID := mux.Vars(r)["teamID"]
	term := r.URL.Query().Get("q")
	userID := getUserID(r)

	if !a.permissions.HasPermissionToTeam(userID, teamID, model.PermissionViewTeam) {
		a.errorResponse(w, r.URL.Path, http.StatusForbidden, "", PermissionError{"access denied to team"})
		return
	}

	if len(term) == 0 {
		jsonStringResponse(w, http.StatusOK, "[]")
		return
	}

	auditRec := a.makeAuditRecord(r, "searchBoards", audit.Fail)
	defer a.audit.LogRecord(audit.LevelRead, auditRec)
	auditRec.AddMeta("teamID", teamID)

	// retrieve boards list
	boards, err := a.app.SearchBoardsForUserAndTeam(term, userID, teamID)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	a.logger.Debug("SearchBoards",
		mlog.String("teamID", teamID),
		mlog.Int("boardsCount", len(boards)),
	)

	data, err := json.Marshal(boards)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	// response
	jsonBytesResponse(w, http.StatusOK, data)

	auditRec.AddMeta("boardsCount", len(boards))
	auditRec.Success()
}

func (a *API) handleGetMembersForBoard(w http.ResponseWriter, r *http.Request) {
	// swagger:operation GET /api/v1/boards/{boardID}/members getMembersForBoard
	//
	// Returns the members of the board
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
	// security:
	// - BearerAuth: []
	// responses:
	//   '200':
	//     description: success
	//     schema:
	//       type: array
	//       items:
	//         "$ref": "#/definitions/BoardMember"
	//   default:
	//     description: internal error
	//     schema:
	//       "$ref": "#/definitions/ErrorResponse"

	boardID := mux.Vars(r)["boardID"]
	userID := getUserID(r)

	if !a.permissions.HasPermissionToBoard(userID, boardID, model.PermissionViewBoard) {
		a.errorResponse(w, r.URL.Path, http.StatusForbidden, "", PermissionError{"access denied to board members"})
		return
	}

	auditRec := a.makeAuditRecord(r, "getMembersForBoard", audit.Fail)
	defer a.audit.LogRecord(audit.LevelModify, auditRec)
	auditRec.AddMeta("boardID", boardID)

	members, err := a.app.GetMembersForBoard(boardID)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	a.logger.Debug("GetMembersForBoard",
		mlog.String("boardID", boardID),
		mlog.Int("membersCount", len(members)),
	)

	data, err := json.Marshal(members)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	// response
	jsonBytesResponse(w, http.StatusOK, data)

	auditRec.Success()
}

func (a *API) handleAddMember(w http.ResponseWriter, r *http.Request) {
	// swagger:operation POST /boards/{boardID}/members addMember
	//
	// Adds a new member to a board
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
	// - name: Body
	//   in: body
	//   description: membership to replace the current one with
	//   required: true
	//   schema:
	//     "$ref": "#/definitions/BoardMember"
	// security:
	// - BearerAuth: []
	// responses:
	//   '200':
	//     description: success
	//     schema:
	//       $ref: '#/definitions/BoardMember'
	//   default:
	//     description: internal error
	//     schema:
	//       "$ref": "#/definitions/ErrorResponse"

	boardID := mux.Vars(r)["boardID"]
	board, err := a.app.GetBoard(boardID)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}
	if board == nil {
		a.errorResponse(w, r.URL.Path, http.StatusNotFound, "", nil)
		return
	}

	userID := getUserID(r)

	requestBody, err := ioutil.ReadAll(r.Body)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	var reqBoardMember *model.BoardMember
	if err = json.Unmarshal(requestBody, &reqBoardMember); err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusBadRequest, "", err)
		return
	}

	if reqBoardMember.UserID == "" {
		a.errorResponse(w, r.URL.Path, http.StatusBadRequest, "", err)
		return
	}

	// currently all memberships are created as editors by default
	newBoardMember := &model.BoardMember{
		UserID:       reqBoardMember.UserID,
		BoardID:      boardID,
		SchemeEditor: true,
	}

	if board.Type == model.BoardTypePrivate && !a.permissions.HasPermissionToBoard(userID, boardID, model.PermissionManageBoardRoles) {
		a.errorResponse(w, r.URL.Path, http.StatusForbidden, "", PermissionError{"access denied to modify board members"})
		return
	}

	auditRec := a.makeAuditRecord(r, "addMember", audit.Fail)
	defer a.audit.LogRecord(audit.LevelModify, auditRec)
	auditRec.AddMeta("boardID", boardID)
	auditRec.AddMeta("addedUserID", reqBoardMember.UserID)

	member, err := a.app.AddMemberToBoard(newBoardMember)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	a.logger.Debug("AddMember",
		mlog.String("boardID", board.ID),
		mlog.String("addedUserID", reqBoardMember.UserID),
	)

	data, err := json.Marshal(member)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	// response
	jsonBytesResponse(w, http.StatusOK, data)

	auditRec.Success()
}

func (a *API) handleJoinBoard(w http.ResponseWriter, r *http.Request) {
	// swagger:operation POST /boards/{boardID}/join joinBoard
	//
	// Become a member of a board
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
	// security:
	// - BearerAuth: []
	// responses:
	//   '200':
	//     description: success
	//     schema:
	//       $ref: '#/definitions/BoardMember'
	//   '404':
	//     description: board not found
	//   '503':
	//     description: access denied
	//   default:
	//     description: internal error
	//     schema:
	//       "$ref": "#/definitions/ErrorResponse"

	userID := getUserID(r)
	if userID == "" {
		a.errorResponse(w, r.URL.Path, http.StatusBadRequest, "", nil)
		return
	}

	boardID := mux.Vars(r)["boardID"]
	board, err := a.app.GetBoard(boardID)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}
	if board == nil {
		a.errorResponse(w, r.URL.Path, http.StatusNotFound, "", nil)
		return
	}
	if board.Type != model.BoardTypeOpen {
		a.errorResponse(w, r.URL.Path, http.StatusForbidden, "", nil)
		return
	}

	if !a.permissions.HasPermissionToTeam(userID, board.TeamID, model.PermissionViewTeam) {
		a.errorResponse(w, r.URL.Path, http.StatusForbidden, "", nil)
		return
	}

	// currently all memberships are created as editors by default
	// TODO: Support different public roles
	newBoardMember := &model.BoardMember{
		UserID:       userID,
		BoardID:      boardID,
		SchemeEditor: true,
	}

	auditRec := a.makeAuditRecord(r, "joinBoard", audit.Fail)
	defer a.audit.LogRecord(audit.LevelModify, auditRec)
	auditRec.AddMeta("boardID", boardID)
	auditRec.AddMeta("addedUserID", userID)

	member, err := a.app.AddMemberToBoard(newBoardMember)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	a.logger.Debug("AddMember",
		mlog.String("boardID", board.ID),
		mlog.String("addedUserID", userID),
	)

	data, err := json.Marshal(member)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	// response
	jsonBytesResponse(w, http.StatusOK, data)

	auditRec.Success()
}

func (a *API) handleUpdateMember(w http.ResponseWriter, r *http.Request) {
	// swagger:operation PUT /boards/{boardID}/members/{userID} updateMember
	//
	// Updates a board member
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
	// - name: userID
	//   in: path
	//   description: User ID
	//   required: true
	//   type: string
	// - name: Body
	//   in: body
	//   description: membership to replace the current one with
	//   required: true
	//   schema:
	//     "$ref": "#/definitions/BoardMember"
	// security:
	// - BearerAuth: []
	// responses:
	//   '200':
	//     description: success
	//     schema:
	//       $ref: '#/definitions/BoardMember'
	//   default:
	//     description: internal error
	//     schema:
	//       "$ref": "#/definitions/ErrorResponse"

	boardID := mux.Vars(r)["boardID"]
	paramsUserID := mux.Vars(r)["userID"]
	userID := getUserID(r)

	requestBody, err := ioutil.ReadAll(r.Body)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	var reqBoardMember *model.BoardMember
	if err = json.Unmarshal(requestBody, &reqBoardMember); err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusBadRequest, "", err)
		return
	}

	newBoardMember := &model.BoardMember{
		UserID:          paramsUserID,
		BoardID:         boardID,
		SchemeAdmin:     reqBoardMember.SchemeAdmin,
		SchemeEditor:    reqBoardMember.SchemeEditor,
		SchemeCommenter: reqBoardMember.SchemeCommenter,
		SchemeViewer:    reqBoardMember.SchemeViewer,
	}

	if !a.permissions.HasPermissionToBoard(userID, boardID, model.PermissionManageBoardRoles) {
		a.errorResponse(w, r.URL.Path, http.StatusForbidden, "", PermissionError{"access denied to modify board members"})
		return
	}

	auditRec := a.makeAuditRecord(r, "patchMember", audit.Fail)
	defer a.audit.LogRecord(audit.LevelModify, auditRec)
	auditRec.AddMeta("boardID", boardID)
	auditRec.AddMeta("patchedUserID", paramsUserID)

	member, err := a.app.UpdateBoardMember(newBoardMember)
	if errors.Is(err, app.ErrBoardMemberIsLastAdmin) {
		a.errorResponse(w, r.URL.Path, http.StatusBadRequest, "", err)
		return
	}
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	a.logger.Debug("PatchMember",
		mlog.String("boardID", boardID),
		mlog.String("patchedUserID", paramsUserID),
	)

	data, err := json.Marshal(member)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	// response
	jsonBytesResponse(w, http.StatusOK, data)

	auditRec.Success()
}

func (a *API) handleDeleteMember(w http.ResponseWriter, r *http.Request) {
	// swagger:operation DELETE /api/v1/boards/{boardID}/members/{userID} deleteMember
	//
	// Deletes a member from a board
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
	// - name: userID
	//   in: path
	//   description: User ID
	//   required: true
	//   type: string
	// security:
	// - BearerAuth: []
	// responses:
	//   '200':
	//     description: success
	//   default:
	//     description: internal error
	//     schema:
	//       "$ref": "#/definitions/ErrorResponse"

	boardID := mux.Vars(r)["boardID"]
	paramsUserID := mux.Vars(r)["userID"]
	userID := getUserID(r)

	if paramsUserID != userID && !a.permissions.HasPermissionToBoard(userID, boardID, model.PermissionManageBoardRoles) {
		a.errorResponse(w, r.URL.Path, http.StatusForbidden, "", PermissionError{"access denied to modify board members"})
		return
	}

	board, err := a.app.GetBoard(boardID)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}
	if board == nil {
		a.errorResponse(w, r.URL.Path, http.StatusNotFound, "", err)
		return
	}

	auditRec := a.makeAuditRecord(r, "deleteMember", audit.Fail)
	defer a.audit.LogRecord(audit.LevelModify, auditRec)
	auditRec.AddMeta("boardID", boardID)
	auditRec.AddMeta("addedUserID", paramsUserID)

	deleteErr := a.app.DeleteBoardMember(boardID, paramsUserID)
	if errors.Is(deleteErr, app.ErrBoardMemberIsLastAdmin) {
		a.errorResponse(w, r.URL.Path, http.StatusBadRequest, "", deleteErr)
		return
	}
	if deleteErr != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", deleteErr)
		return
	}

	a.logger.Debug("DeleteMember",
		mlog.String("boardID", boardID),
		mlog.String("addedUserID", paramsUserID),
	)

	// response
	jsonStringResponse(w, http.StatusOK, "{}")

	auditRec.Success()
}

func (a *API) handleCreateBoardsAndBlocks(w http.ResponseWriter, r *http.Request) {
	// swagger:operation POST /api/v1/boards-and-blocks insertBoardsAndBlocks
	//
	// Creates new boards and blocks
	//
	// ---
	// produces:
	// - application/json
	// parameters:
	// - name: Body
	//   in: body
	//   description: the boards and blocks to create
	//   required: true
	//   schema:
	//     "$ref": "#/definitions/BoardsAndBlocks"
	// security:
	// - BearerAuth: []
	// responses:
	//   '200':
	//     description: success
	//     schema:
	//       $ref: '#/definitions/BoardsAndBlocks'
	//   default:
	//     description: internal error
	//     schema:
	//       "$ref": "#/definitions/ErrorResponse"

	userID := getUserID(r)

	requestBody, err := ioutil.ReadAll(r.Body)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	var newBab *model.BoardsAndBlocks
	if err = json.Unmarshal(requestBody, &newBab); err != nil {
		// a.errorResponse(w, r.URL.Path, http.StatusBadRequest, "", err)
		a.errorResponse(w, r.URL.Path, http.StatusBadRequest, "", err)
		return
	}

	for _, block := range newBab.Blocks {
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
	}

	// permission check
	createsPublicBoards := false
	createsPrivateBoards := false
	teamID := ""
	for _, board := range newBab.Boards {
		if board.Type == model.BoardTypeOpen {
			createsPublicBoards = true
		}
		if board.Type == model.BoardTypePrivate {
			createsPrivateBoards = true
		}

		if teamID == "" {
			teamID = board.TeamID
			continue
		}

		if teamID != board.TeamID {
			message := "cannot create boards for multiple teams"
			a.errorResponse(w, r.URL.Path, http.StatusBadRequest, message, nil)
			return
		}

		if board.ID == "" {
			message := "boards need an ID to be referenced from the blocks"
			a.errorResponse(w, r.URL.Path, http.StatusBadRequest, message, nil)
			return
		}
	}

	// IDs of boards and blocks are used to confirm that they're
	// linked and then regenerated by the server
	newBab, err = model.GenerateBoardsAndBlocksIDs(newBab, a.logger)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusBadRequest, err.Error(), err)
		return
	}

	if createsPublicBoards && !a.permissions.HasPermissionToTeam(userID, teamID, model.PermissionCreatePublicChannel) {
		a.errorResponse(w, r.URL.Path, http.StatusForbidden, "", PermissionError{"access denied to create public boards"})
		return
	}

	if createsPrivateBoards && !a.permissions.HasPermissionToTeam(userID, teamID, model.PermissionCreatePrivateChannel) {
		a.errorResponse(w, r.URL.Path, http.StatusForbidden, "", PermissionError{"access denied to create private boards"})
		return
	}
	auditRec := a.makeAuditRecord(r, "createBoardsAndBlocks", audit.Fail)
	defer a.audit.LogRecord(audit.LevelModify, auditRec)
	auditRec.AddMeta("teamID", teamID)
	auditRec.AddMeta("userID", userID)
	auditRec.AddMeta("boardsCount", len(newBab.Boards))
	auditRec.AddMeta("blocksCount", len(newBab.Blocks))

	// create boards and blocks
	bab, err := a.app.CreateBoardsAndBlocks(newBab, userID, true)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, err.Error(), err)
		return
	}

	a.logger.Debug("CreateBoardsAndBlocks",
		mlog.String("teamID", teamID),
		mlog.String("userID", userID),
		mlog.Int("boardCount", len(bab.Boards)),
		mlog.Int("blockCount", len(bab.Blocks)),
	)

	data, err := json.Marshal(bab)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, err.Error(), err)
		return
	}

	// response
	jsonBytesResponse(w, http.StatusOK, data)

	auditRec.Success()
}

func (a *API) handlePatchBoardsAndBlocks(w http.ResponseWriter, r *http.Request) {
	// swagger:operation PATCH /api/v1/boards-and-blocks patchBoardsAndBlocks
	//
	// Patches a set of related boards and blocks
	//
	// ---
	// produces:
	// - application/json
	// parameters:
	// - name: Body
	//   in: body
	//   description: the patches for the boards and blocks
	//   required: true
	//   schema:
	//     "$ref": "#/definitions/PatchBoardsAndBlocks"
	// security:
	// - BearerAuth: []
	// responses:
	//   '200':
	//     description: success
	//     schema:
	//       $ref: '#/definitions/BoardsAndBlocks'
	//   default:
	//     description: internal error
	//     schema:
	//       "$ref": "#/definitions/ErrorResponse"

	userID := getUserID(r)

	requestBody, err := ioutil.ReadAll(r.Body)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	var pbab *model.PatchBoardsAndBlocks
	if err = json.Unmarshal(requestBody, &pbab); err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusBadRequest, "", err)
		return
	}

	if err = pbab.IsValid(); err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusBadRequest, "", err)
		return
	}

	teamID := ""
	boardIDMap := map[string]bool{}
	for i, boardID := range pbab.BoardIDs {
		boardIDMap[boardID] = true
		patch := pbab.BoardPatches[i]

		if err = patch.IsValid(); err != nil {
			a.errorResponse(w, r.URL.Path, http.StatusBadRequest, "", err)
			return
		}

		if !a.permissions.HasPermissionToBoard(userID, boardID, model.PermissionManageBoardProperties) {
			a.errorResponse(w, r.URL.Path, http.StatusForbidden, "", PermissionError{"access denied to modifying board properties"})
			return
		}

		if patch.Type != nil {
			if !a.permissions.HasPermissionToBoard(userID, boardID, model.PermissionManageBoardType) {
				a.errorResponse(w, r.URL.Path, http.StatusForbidden, "", PermissionError{"access denied to modifying board type"})
				return
			}
		}

		board, err2 := a.app.GetBoard(boardID)
		if err2 != nil {
			a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err2)
			return
		}
		if board == nil {
			a.errorResponse(w, r.URL.Path, http.StatusBadRequest, "", nil)
			return
		}

		if teamID == "" {
			teamID = board.TeamID
		}
		if teamID != board.TeamID {
			a.errorResponse(w, r.URL.Path, http.StatusBadRequest, "", nil)
			return
		}
	}

	for _, blockID := range pbab.BlockIDs {
		block, err2 := a.app.GetBlockByID(blockID)
		if err2 != nil {
			a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err2)
			return
		}
		if block == nil {
			a.errorResponse(w, r.URL.Path, http.StatusBadRequest, "", nil)
			return
		}

		if _, ok := boardIDMap[block.BoardID]; !ok {
			a.errorResponse(w, r.URL.Path, http.StatusBadRequest, "", nil)
			return
		}
	}

	auditRec := a.makeAuditRecord(r, "patchBoardsAndBlocks", audit.Fail)
	defer a.audit.LogRecord(audit.LevelModify, auditRec)
	auditRec.AddMeta("boardsCount", len(pbab.BoardIDs))
	auditRec.AddMeta("blocksCount", len(pbab.BlockIDs))

	bab, err := a.app.PatchBoardsAndBlocks(pbab, userID)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	a.logger.Debug("PATCH BoardsAndBlocks",
		mlog.Int("boardsCount", len(pbab.BoardIDs)),
		mlog.Int("blocksCount", len(pbab.BlockIDs)),
	)

	data, err := json.Marshal(bab)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	// response
	jsonBytesResponse(w, http.StatusOK, data)

	auditRec.Success()
}

func (a *API) handleDeleteBoardsAndBlocks(w http.ResponseWriter, r *http.Request) {
	// swagger:operation DELETE /api/v1/boards-and-blocks deleteBoardsAndBlocks
	//
	// Deletes boards and blocks
	//
	// ---
	// produces:
	// - application/json
	// parameters:
	// - name: Body
	//   in: body
	//   description: the boards and blocks to delete
	//   required: true
	//   schema:
	//     "$ref": "#/definitions/DeleteBoardsAndBlocks"
	// security:
	// - BearerAuth: []
	// responses:
	//   '200':
	//     description: success
	//   default:
	//     description: internal error
	//     schema:
	//       "$ref": "#/definitions/ErrorResponse"

	userID := getUserID(r)

	requestBody, err := ioutil.ReadAll(r.Body)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	var dbab *model.DeleteBoardsAndBlocks
	if err = json.Unmarshal(requestBody, &dbab); err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusBadRequest, "", err)
		return
	}

	// user must have permission to delete all the boards, and that
	// would include the permission to manage their blocks
	teamID := ""
	for _, boardID := range dbab.Boards {
		// all boards in the request should belong to the same team
		board, err := a.app.GetBoard(boardID)
		if err != nil {
			a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
			return
		}
		if board == nil {
			a.errorResponse(w, r.URL.Path, http.StatusBadRequest, "", err)
			return
		}
		if teamID == "" {
			teamID = board.TeamID
		}
		if teamID != board.TeamID {
			a.errorResponse(w, r.URL.Path, http.StatusBadRequest, "", nil)
			return
		}

		// permission check
		if !a.permissions.HasPermissionToBoard(userID, boardID, model.PermissionDeleteBoard) {
			a.errorResponse(w, r.URL.Path, http.StatusForbidden, "", PermissionError{"access denied to delete board"})
			return
		}
	}

	if err := dbab.IsValid(); err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusBadRequest, "", err)
		return
	}

	auditRec := a.makeAuditRecord(r, "deleteBoardsAndBlocks", audit.Fail)
	defer a.audit.LogRecord(audit.LevelModify, auditRec)
	auditRec.AddMeta("boardsCount", len(dbab.Boards))
	auditRec.AddMeta("blocksCount", len(dbab.Blocks))

	if err := a.app.DeleteBoardsAndBlocks(dbab, userID); err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	a.logger.Debug("DELETE BoardsAndBlocks",
		mlog.Int("boardsCount", len(dbab.Boards)),
		mlog.Int("blocksCount", len(dbab.Blocks)),
	)

	// response
	jsonStringResponse(w, http.StatusOK, "{}")
	auditRec.Success()
}

// Response helpers

func (a *API) errorResponse(w http.ResponseWriter, api string, code int, message string, sourceError error) {
	a.logger.Error("API ERROR",
		mlog.Int("code", code),
		mlog.Err(sourceError),
		mlog.String("msg", message),
		mlog.String("api", api),
	)

	w.Header().Set("Content-Type", "application/json")
	data, err := json.Marshal(model.ErrorResponse{Error: message, ErrorCode: code})
	if err != nil {
		data = []byte("{}")
	}
	w.WriteHeader(code)
	_, _ = w.Write(data)
}

func jsonStringResponse(w http.ResponseWriter, code int, message string) { //nolint:unparam
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	fmt.Fprint(w, message)
}

func jsonBytesResponse(w http.ResponseWriter, code int, json []byte) { //nolint:unparam
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	_, _ = w.Write(json)
}
