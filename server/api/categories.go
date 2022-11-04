package api

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/services/audit"
)

func (a *API) registerCategoriesRoutes(r *mux.Router) {
	// Category APIs
	r.HandleFunc("/teams/{teamID}/categories", a.sessionRequired(a.handleCreateCategory)).Methods(http.MethodPost)
	r.HandleFunc("/teams/{teamID}/categories/reorder", a.sessionRequired(a.handleReorderCategories)).Methods(http.MethodPut)
	r.HandleFunc("/teams/{teamID}/categories/{categoryID}", a.sessionRequired(a.handleUpdateCategory)).Methods(http.MethodPut)
	r.HandleFunc("/teams/{teamID}/categories/{categoryID}", a.sessionRequired(a.handleDeleteCategory)).Methods(http.MethodDelete)
	r.HandleFunc("/teams/{teamID}/categories", a.sessionRequired(a.handleGetUserCategoryBoards)).Methods(http.MethodGet)
	r.HandleFunc("/teams/{teamID}/categories/{categoryID}/boards/reorder", a.sessionRequired(a.handleReorderCategoryBoards)).Methods(http.MethodPut)
	r.HandleFunc("/teams/{teamID}/categories/{categoryID}/boards/{boardID}", a.sessionRequired(a.handleUpdateCategoryBoard)).Methods(http.MethodPost)
}

func (a *API) handleCreateCategory(w http.ResponseWriter, r *http.Request) {
	// swagger:operation POST /teams/{teamID}/categories createCategory
	//
	// Create a category for boards
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
	// - name: Body
	//   in: body
	//   description: category to create
	//   required: true
	//   schema:
	//     "$ref": "#/definitions/Category"
	// security:
	// - BearerAuth: []
	// responses:
	//   '200':
	//     description: success
	//     schema:
	//       "$ref": "#/definitions/Category"
	//   default:
	//     description: internal error
	//     schema:
	//       "$ref": "#/definitions/ErrorResponse"

	requestBody, err := io.ReadAll(r.Body)
	if err != nil {
		a.errorResponse(w, r, err)
		return
	}

	var category model.Category

	err = json.Unmarshal(requestBody, &category)
	if err != nil {
		a.errorResponse(w, r, err)
		return
	}

	auditRec := a.makeAuditRecord(r, "createCategory", audit.Fail)
	defer a.audit.LogRecord(audit.LevelModify, auditRec)

	ctx := r.Context()
	session := ctx.Value(sessionContextKey).(*model.Session)

	// user can only create category for themselves
	if category.UserID != session.UserID {
		message := fmt.Sprintf("userID %s and category userID %s mismatch", session.UserID, category.UserID)
		a.errorResponse(w, r, model.NewErrBadRequest(message))
		return
	}

	vars := mux.Vars(r)
	teamID := vars["teamID"]

	if category.TeamID != teamID {
		a.errorResponse(w, r, model.NewErrBadRequest("teamID mismatch"))
		return
	}

	createdCategory, err := a.app.CreateCategory(&category)
	if err != nil {
		a.errorResponse(w, r, err)
		return
	}

	data, err := json.Marshal(createdCategory)
	if err != nil {
		a.errorResponse(w, r, err)
		return
	}

	jsonBytesResponse(w, http.StatusOK, data)
	auditRec.AddMeta("categoryID", createdCategory.ID)
	auditRec.Success()
}

func (a *API) handleUpdateCategory(w http.ResponseWriter, r *http.Request) {
	// swagger:operation PUT /teams/{teamID}/categories/{categoryID} updateCategory
	//
	// Create a category for boards
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
	// - name: categoryID
	//   in: path
	//   description: Category ID
	//   required: true
	//   type: string
	// - name: Body
	//   in: body
	//   description: category to update
	//   required: true
	//   schema:
	//     "$ref": "#/definitions/Category"
	// security:
	// - BearerAuth: []
	// responses:
	//   '200':
	//     description: success
	//     schema:
	//       "$ref": "#/definitions/Category"
	//   default:
	//     description: internal error
	//     schema:
	//       "$ref": "#/definitions/ErrorResponse"

	vars := mux.Vars(r)
	categoryID := vars["categoryID"]

	requestBody, err := io.ReadAll(r.Body)
	if err != nil {
		a.errorResponse(w, r, err)
		return
	}

	var category model.Category
	err = json.Unmarshal(requestBody, &category)
	if err != nil {
		a.errorResponse(w, r, err)
		return
	}

	auditRec := a.makeAuditRecord(r, "updateCategory", audit.Fail)
	defer a.audit.LogRecord(audit.LevelModify, auditRec)

	if categoryID != category.ID {
		a.errorResponse(w, r, model.NewErrBadRequest("categoryID mismatch in patch and body"))
		return
	}

	ctx := r.Context()
	session := ctx.Value(sessionContextKey).(*model.Session)

	// user can only update category for themselves
	if category.UserID != session.UserID {
		a.errorResponse(w, r, model.NewErrBadRequest("user ID mismatch in session and category"))
		return
	}

	teamID := vars["teamID"]
	if category.TeamID != teamID {
		a.errorResponse(w, r, model.NewErrBadRequest("teamID mismatch"))
		return
	}

	updatedCategory, err := a.app.UpdateCategory(&category)
	if err != nil {
		a.errorResponse(w, r, err)
		return
	}

	data, err := json.Marshal(updatedCategory)
	if err != nil {
		a.errorResponse(w, r, err)
		return
	}

	jsonBytesResponse(w, http.StatusOK, data)
	auditRec.Success()
}

func (a *API) handleDeleteCategory(w http.ResponseWriter, r *http.Request) {
	// swagger:operation DELETE /teams/{teamID}/categories/{categoryID} deleteCategory
	//
	// Delete a category
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
	// - name: categoryID
	//   in: path
	//   description: Category ID
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

	userID := session.UserID
	teamID := vars["teamID"]
	categoryID := vars["categoryID"]

	auditRec := a.makeAuditRecord(r, "deleteCategory", audit.Fail)
	defer a.audit.LogRecord(audit.LevelModify, auditRec)

	deletedCategory, err := a.app.DeleteCategory(categoryID, userID, teamID)
	if err != nil {
		a.errorResponse(w, r, err)
		return
	}

	data, err := json.Marshal(deletedCategory)
	if err != nil {
		a.errorResponse(w, r, err)
		return
	}

	jsonBytesResponse(w, http.StatusOK, data)
	auditRec.Success()
}

func (a *API) handleGetUserCategoryBoards(w http.ResponseWriter, r *http.Request) {
	// swagger:operation GET /teams/{teamID}/categories getUserCategoryBoards
	//
	// Gets the user's board categories
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
	//       items:
	//         "$ref": "#/definitions/CategoryBoards"
	//       type: array
	//   default:
	//     description: internal error
	//     schema:
	//       "$ref": "#/definitions/ErrorResponse"

	ctx := r.Context()
	session := ctx.Value(sessionContextKey).(*model.Session)
	userID := session.UserID

	vars := mux.Vars(r)
	teamID := vars["teamID"]

	auditRec := a.makeAuditRecord(r, "getUserCategoryBoards", audit.Fail)
	defer a.audit.LogRecord(audit.LevelModify, auditRec)

	categoryBlocks, err := a.app.GetUserCategoryBoards(userID, teamID)
	if err != nil {
		a.errorResponse(w, r, err)
		return
	}

	data, err := json.Marshal(categoryBlocks)
	if err != nil {
		a.errorResponse(w, r, err)
		return
	}

	jsonBytesResponse(w, http.StatusOK, data)
	auditRec.Success()
}

func (a *API) handleUpdateCategoryBoard(w http.ResponseWriter, r *http.Request) {
	// swagger:operation POST /teams/{teamID}/categories/{categoryID}/boards/{boardID} updateCategoryBoard
	//
	// Set the category of a board
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
	// - name: categoryID
	//   in: path
	//   description: Category ID
	//   required: true
	//   type: string
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

	auditRec := a.makeAuditRecord(r, "updateCategoryBoard", audit.Fail)
	defer a.audit.LogRecord(audit.LevelModify, auditRec)

	vars := mux.Vars(r)
	categoryID := vars["categoryID"]
	boardID := vars["boardID"]
	teamID := vars["teamID"]

	ctx := r.Context()
	session := ctx.Value(sessionContextKey).(*model.Session)
	userID := session.UserID

	// TODO: Check the category and the team matches
	err := a.app.AddUpdateUserCategoryBoard(teamID, userID, map[string]string{boardID: categoryID})
	if err != nil {
		a.errorResponse(w, r, err)
		return
	}

	jsonBytesResponse(w, http.StatusOK, []byte("ok"))
	auditRec.Success()
}

func (a *API) handleReorderCategories(w http.ResponseWriter, r *http.Request) {
	// swagger:operation PUT /teams/{teamID}/categories/reorder handleReorderCategories
	//
	// Updated sidebar category order
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

	vars := mux.Vars(r)
	teamID := vars["teamID"]

	ctx := r.Context()
	session := ctx.Value(sessionContextKey).(*model.Session)
	userID := session.UserID

	requestBody, err := io.ReadAll(r.Body)
	if err != nil {
		a.errorResponse(w, r, err)
		return
	}

	var newCategoryOrder []string

	err = json.Unmarshal(requestBody, &newCategoryOrder)
	if err != nil {
		a.errorResponse(w, r, err)
		return
	}

	auditRec := a.makeAuditRecord(r, "reorderCategories", audit.Fail)
	defer a.audit.LogRecord(audit.LevelModify, auditRec)

	updatedCategoryOrder, err := a.app.ReorderCategories(userID, teamID, newCategoryOrder)
	if err != nil {
		a.errorResponse(w, r, err)
		return
	}

	data, err := json.Marshal(updatedCategoryOrder)
	if err != nil {
		a.errorResponse(w, r, err)
		return
	}

	jsonBytesResponse(w, http.StatusOK, data)
	auditRec.Success()
}

func (a *API) handleReorderCategoryBoards(w http.ResponseWriter, r *http.Request) {
	// swagger:operation PUT /teams/{teamID}/categories/{categoryID}/boards/reorder handleReorderCategoryBoards
	//
	// Updates order of boards inside a sidebar category
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
	// - name: categoryID
	//   in: path
	//   description: Category ID
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
	teamID := vars["teamID"]
	categoryID := vars["categoryID"]

	ctx := r.Context()
	session := ctx.Value(sessionContextKey).(*model.Session)
	userID := session.UserID

	requestBody, err := io.ReadAll(r.Body)
	if err != nil {
		a.errorResponse(w, r, err)
		return
	}

	var newBoardsOrder []string
	err = json.Unmarshal(requestBody, &newBoardsOrder)
	if err != nil {
		a.errorResponse(w, r, err)
		return
	}

	auditRec := a.makeAuditRecord(r, "reorderCategoryBoards", audit.Fail)
	defer a.audit.LogRecord(audit.LevelModify, auditRec)

	updatedBoardsOrder, err := a.app.ReorderCategoryBoards(userID, teamID, categoryID, newBoardsOrder)
	if err != nil {
		a.errorResponse(w, r, err)
		return
	}

	data, err := json.Marshal(updatedBoardsOrder)
	if err != nil {
		a.errorResponse(w, r, err)
		return
	}

	jsonBytesResponse(w, http.StatusOK, data)
	auditRec.Success()
}
