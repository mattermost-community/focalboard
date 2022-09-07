package api

import (
	"encoding/json"
	"io/ioutil"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/services/audit"
	"github.com/mattermost/mattermost-server/v6/shared/mlog"
)

func (a *API) registerMembersRoutes(r *mux.Router) {
	// Member APIs
	r.HandleFunc("/boards/{boardID}/members", a.sessionRequired(a.handleGetMembersForBoard)).Methods("GET")
	r.HandleFunc("/boards/{boardID}/members", a.sessionRequired(a.handleAddMember)).Methods("POST")
	r.HandleFunc("/boards/{boardID}/members/{userID}", a.sessionRequired(a.handleUpdateMember)).Methods("PUT")
	r.HandleFunc("/boards/{boardID}/members/{userID}", a.sessionRequired(a.handleDeleteMember)).Methods("DELETE")
	r.HandleFunc("/boards/{boardID}/join", a.sessionRequired(a.handleJoinBoard)).Methods("POST")
	r.HandleFunc("/boards/{boardID}/leave", a.sessionRequired(a.handleLeaveBoard)).Methods("POST")
}

func (a *API) handleGetMembersForBoard(w http.ResponseWriter, r *http.Request) {
	// swagger:operation GET /boards/{boardID}/members getMembersForBoard
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

	if pErr := a.ensurePermissionToBoard(userID, boardID, model.PermissionViewBoard); pErr != nil {
		a.errorResponse(w, r, pErr)
		return
	}

	auditRec := a.makeAuditRecord(r, "getMembersForBoard", audit.Fail)
	defer a.audit.LogRecord(audit.LevelModify, auditRec)
	auditRec.AddMeta("boardID", boardID)

	members, err := a.app.GetMembersForBoard(boardID)
	if err != nil {
		a.errorResponse(w, r, err)
		return
	}

	a.logger.Debug("GetMembersForBoard",
		mlog.String("boardID", boardID),
		mlog.Int("membersCount", len(members)),
	)

	data, err := json.Marshal(members)
	if err != nil {
		a.errorResponse(w, r, err)
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
	//   '404':
	//     description: board not found
	//   default:
	//     description: internal error
	//     schema:
	//       "$ref": "#/definitions/ErrorResponse"

	boardID := mux.Vars(r)["boardID"]
	userID := getUserID(r)

	board, err := a.app.GetBoard(boardID)
	if err != nil {
		a.errorResponse(w, r, err)
		return
	}

	if pErr := a.ensurePermissionToBoard(userID, boardID, model.PermissionManageBoardRoles); pErr != nil {
		a.errorResponse(w, r, pErr)
		return
	}

	requestBody, err := ioutil.ReadAll(r.Body)
	if err != nil {
		a.errorResponse(w, r, err)
		return
	}

	var reqBoardMember *model.BoardMember
	if err = json.Unmarshal(requestBody, &reqBoardMember); err != nil {
		a.errorResponse(w, r, model.NewErrBadRequest(err.Error()))
		return
	}

	if reqBoardMember.UserID == "" {
		a.errorResponse(w, r, model.NewErrBadRequest(err.Error()))
		return
	}

	// currently all memberships are created as editors by default
	newBoardMember := &model.BoardMember{
		UserID:       reqBoardMember.UserID,
		BoardID:      boardID,
		SchemeEditor: true,
	}

	auditRec := a.makeAuditRecord(r, "addMember", audit.Fail)
	defer a.audit.LogRecord(audit.LevelModify, auditRec)
	auditRec.AddMeta("boardID", boardID)
	auditRec.AddMeta("addedUserID", reqBoardMember.UserID)

	member, err := a.app.AddMemberToBoard(newBoardMember)
	if err != nil {
		a.errorResponse(w, r, err)
		return
	}

	a.logger.Debug("AddMember",
		mlog.String("boardID", board.ID),
		mlog.String("addedUserID", reqBoardMember.UserID),
	)

	data, err := json.Marshal(member)
	if err != nil {
		a.errorResponse(w, r, err)
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
	//   '403':
	//     description: access denied
	//   default:
	//     description: internal error
	//     schema:
	//       "$ref": "#/definitions/ErrorResponse"

	userID := getUserID(r)
	if userID == "" {
		a.errorResponse(w, r, model.NewErrBadRequest(""))
		return
	}

	boardID := mux.Vars(r)["boardID"]
	board, err := a.app.GetBoard(boardID)
	if err != nil {
		a.errorResponse(w, r, err)
		return
	}
	if board.Type != model.BoardTypeOpen {
		a.errorResponse(w, r, model.NewErrForbidden(""))
		return
	}

	if pErr := a.ensurePermissionToTeam(userID, board.TeamID, model.PermissionViewTeam); pErr != nil {
		a.errorResponse(w, r, pErr)
		return
	}

	isGuest, err := a.userIsGuest(userID)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}
	if isGuest {
		a.errorResponse(w, r.URL.Path, http.StatusForbidden, "", PermissionError{"guests not allowed to join boards"})
		return
	}

	newBoardMember := &model.BoardMember{
		UserID:          userID,
		BoardID:         boardID,
		SchemeAdmin:     board.MinimumRole == model.BoardRoleAdmin,
		SchemeEditor:    board.MinimumRole == model.BoardRoleNone || board.MinimumRole == model.BoardRoleEditor,
		SchemeCommenter: board.MinimumRole == model.BoardRoleCommenter,
		SchemeViewer:    board.MinimumRole == model.BoardRoleViewer,
	}

	auditRec := a.makeAuditRecord(r, "joinBoard", audit.Fail)
	defer a.audit.LogRecord(audit.LevelModify, auditRec)
	auditRec.AddMeta("boardID", boardID)
	auditRec.AddMeta("addedUserID", userID)

	member, err := a.app.AddMemberToBoard(newBoardMember)
	if err != nil {
		a.errorResponse(w, r, err)
		return
	}

	a.logger.Debug("JoinBoard",
		mlog.String("boardID", board.ID),
		mlog.String("addedUserID", userID),
	)

	data, err := json.Marshal(member)
	if err != nil {
		a.errorResponse(w, r, err)
		return
	}

	// response
	jsonBytesResponse(w, http.StatusOK, data)

	auditRec.Success()
}

func (a *API) handleLeaveBoard(w http.ResponseWriter, r *http.Request) {
	// swagger:operation POST /boards/{boardID}/leave leaveBoard
	//
	// Remove your own membership from a board
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
	//   '404':
	//     description: board not found
	//   '403':
	//     description: access denied
	//   default:
	//     description: internal error
	//     schema:
	//       "$ref": "#/definitions/ErrorResponse"

	userID := getUserID(r)
	if userID == "" {
		a.errorResponse(w, r, model.NewErrBadRequest(""))
		return
	}

	boardID := mux.Vars(r)["boardID"]

	if pErr := a.ensurePermissionToBoard(userID, boardID, model.PermissionViewBoard); pErr != nil {
		a.errorResponse(w, r, pErr)
		return
	}

	board, err := a.app.GetBoard(boardID)
	if err != nil {
		a.errorResponse(w, r, err)
		return
	}

	auditRec := a.makeAuditRecord(r, "leaveBoard", audit.Fail)
	defer a.audit.LogRecord(audit.LevelModify, auditRec)
	auditRec.AddMeta("boardID", boardID)
	auditRec.AddMeta("addedUserID", userID)

	err = a.app.DeleteBoardMember(boardID, userID)
	if err != nil {
		a.errorResponse(w, r, err)
		return
	}

	a.logger.Debug("LeaveBoard",
		mlog.String("boardID", board.ID),
		mlog.String("addedUserID", userID),
	)

	jsonStringResponse(w, http.StatusOK, "{}")

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
		a.errorResponse(w, r, err)
		return
	}

	var reqBoardMember *model.BoardMember
	if err = json.Unmarshal(requestBody, &reqBoardMember); err != nil {
		a.errorResponse(w, r, model.NewErrBadRequest(err.Error()))
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

	isGuest, err := a.userIsGuest(paramsUserID)
	if err != nil {
		a.errorResponse(w, r, err)
		return
	}

	if isGuest {
		newBoardMember.SchemeAdmin = false
	}

	if pErr := a.ensurePermissionToBoard(userID, boardID, model.PermissionManageBoardRoles); pErr != nil {
		a.errorResponse(w, r, pErr)
		return
	}

	auditRec := a.makeAuditRecord(r, "patchMember", audit.Fail)
	defer a.audit.LogRecord(audit.LevelModify, auditRec)
	auditRec.AddMeta("boardID", boardID)
	auditRec.AddMeta("patchedUserID", paramsUserID)

	member, err := a.app.UpdateBoardMember(newBoardMember)
	if err != nil {
		a.errorResponse(w, r, err)
		return
	}

	a.logger.Debug("PatchMember",
		mlog.String("boardID", boardID),
		mlog.String("patchedUserID", paramsUserID),
	)

	data, err := json.Marshal(member)
	if err != nil {
		a.errorResponse(w, r, err)
		return
	}

	// response
	jsonBytesResponse(w, http.StatusOK, data)

	auditRec.Success()
}

func (a *API) handleDeleteMember(w http.ResponseWriter, r *http.Request) {
	// swagger:operation DELETE /boards/{boardID}/members/{userID} deleteMember
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
	//   '404':
	//     description: board not found
	//   default:
	//     description: internal error
	//     schema:
	//       "$ref": "#/definitions/ErrorResponse"

	boardID := mux.Vars(r)["boardID"]
	paramsUserID := mux.Vars(r)["userID"]
	userID := getUserID(r)

	if _, err := a.app.GetBoard(boardID); err != nil {
		a.errorResponse(w, r, err)
		return
	}

	if pErr := a.ensurePermissionToBoard(userID, boardID, model.PermissionManageBoardRoles); pErr != nil {
		a.errorResponse(w, r, pErr)
		return
	}

	auditRec := a.makeAuditRecord(r, "deleteMember", audit.Fail)
	defer a.audit.LogRecord(audit.LevelModify, auditRec)
	auditRec.AddMeta("boardID", boardID)
	auditRec.AddMeta("addedUserID", paramsUserID)

	deleteErr := a.app.DeleteBoardMember(boardID, paramsUserID)
	if deleteErr != nil {
		a.errorResponse(w, r, deleteErr)
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
