package api

import (
	"encoding/json"
	"io/ioutil"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/services/audit"
	"github.com/mattermost/focalboard/server/utils"
)

func (a *API) registerUsersRoutes(r *mux.Router) {
	// Users APIs
	r.HandleFunc("/users", a.sessionRequired(a.handleGetUsersList)).Methods("POST")
	r.HandleFunc("/users/me", a.sessionRequired(a.handleGetMe)).Methods("GET")
	r.HandleFunc("/users/me/memberships", a.sessionRequired(a.handleGetMyMemberships)).Methods("GET")
	r.HandleFunc("/users/{userID}", a.sessionRequired(a.handleGetUser)).Methods("GET")
	r.HandleFunc("/users/{userID}/config", a.sessionRequired(a.handleUpdateUserConfig)).Methods(http.MethodPut)
	r.HandleFunc("/users/me/config", a.sessionRequired(a.handleGetUserPreferences)).Methods(http.MethodGet)
}

func (a *API) handleGetUsersList(w http.ResponseWriter, r *http.Request) {
	// swagger:operation POST /users getUsersList
	//
	// Returns a user[]
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

	requestBody, err := ioutil.ReadAll(r.Body)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	var userIDs []string
	if err = json.Unmarshal(requestBody, &userIDs); err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	auditRec := a.makeAuditRecord(r, "getUsersList", audit.Fail)
	defer a.audit.LogRecord(audit.LevelAuth, auditRec)

	users, err := a.app.GetUsersList(userIDs)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusBadRequest, err.Error(), err)
		return
	}

	usersList, err := json.Marshal(users)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusBadRequest, "", err)
		return
	}

	jsonStringResponse(w, http.StatusOK, string(usersList))
	auditRec.Success()
}

func (a *API) handleGetMe(w http.ResponseWriter, r *http.Request) {
	// swagger:operation GET /users/me getMe
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
		ws, _ := a.app.GetRootTeam()
		now := utils.GetMillis()
		user = &model.User{
			ID:       model.SingleUser,
			Username: model.SingleUser,
			Email:    model.SingleUser,
			CreateAt: ws.UpdateAt,
			UpdateAt: now,
			Props:    map[string]interface{}{},
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
	// swagger:operation GET /users/me/memberships getMyMemberships
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

func (a *API) handleGetUser(w http.ResponseWriter, r *http.Request) {
	// swagger:operation GET /users/{userID} getUser
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

	ctx := r.Context()
	session := ctx.Value(sessionContextKey).(*model.Session)

	canSeeUser, err := a.app.CanSeeUser(session.UserID, userID)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}
	if !canSeeUser {
		a.errorResponse(w, r.URL.Path, http.StatusNotFound, "", nil)
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

func (a *API) handleUpdateUserConfig(w http.ResponseWriter, r *http.Request) {
	// swagger:operation PATCH /users/{userID}/config updateUserConfig
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
		a.errorResponse(w, r.URL.Path, http.StatusForbidden, "", nil)
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

func (a *API) handleGetUserPreferences(w http.ResponseWriter, r *http.Request) {
	// swagger:operation GET /users/me/config getUserConfig
	//
	// Returns an array of user preferences
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
	//       "$ref": "#/definitions/Preferences"
	//   default:
	//     description: internal error
	//     schema:
	//       "$ref": "#/definitions/ErrorResponse"

	userID := getUserID(r)

	auditRec := a.makeAuditRecord(r, "getUserConfig", audit.Fail)
	defer a.audit.LogRecord(audit.LevelRead, auditRec)

	preferences, err := a.app.GetUserPreferences(userID)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	data, err := json.Marshal(preferences)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	jsonBytesResponse(w, http.StatusOK, data)
	auditRec.Success()
}
