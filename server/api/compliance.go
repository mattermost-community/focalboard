package api

import (
	"net/http"

	"github.com/gorilla/mux"
	"github.com/mattermost/focalboard/server/model"
	mmModel "github.com/mattermost/mattermost-server/v6/model"
)

func (a *API) registerComplianceRoutes(r *mux.Router) {
	// Compliance APIs
	r.HandleFunc("/admin/boards", a.sessionRequired(a.handleGetAllBoards)).Methods("GET")
	r.HandleFunc("/admin/boards_history", a.sessionRequired(a.handleGetBoardsHistory)).Methods("POST")
	r.HandleFunc("/admin/blocks_history", a.sessionRequired(a.handleGetBlocksHistory)).Methods("GET")
}

func (a *API) handleGetAllBoards(w http.ResponseWriter, r *http.Request) {
	// TODO(@pinjasaur): swagger

	// Valid authorization (`manage_system`)?
	userID := getUserID(r)
	if !a.permissions.HasPermissionTo(userID, mmModel.PermissionManageSystem) {
		a.errorResponse(w, r, model.NewErrUnauthorized("access denied Compliance Export getAllBoards"))
		return
	}

	// Valid license feature (Compliance)?
	license := a.app.GetLicense()
	if license == nil || !(*license.Features.Compliance) {
		a.errorResponse(w, r, model.NewErrNotImplemented("insufficient license Compliance Export getAllBoards"))
		return
	}

	stringResponse(w, "OK")
}

func (a *API) handleGetBoardsHistory(w http.ResponseWriter, r *http.Request) {
	// TODO(@pinjasaur): swagger

	// Valid authorization (`manage_system`)?
	userID := getUserID(r)
	if !a.permissions.HasPermissionTo(userID, mmModel.PermissionManageSystem) {
		a.errorResponse(w, r, model.NewErrUnauthorized("access denied Compliance Export getBoardsHistory"))
		return
	}

	// Valid license feature (Compliance)?
	license := a.app.GetLicense()
	if license == nil || !(*license.Features.Compliance) {
		a.errorResponse(w, r, model.NewErrNotImplemented("insufficient license Compliance Export getBoardsHistory"))
		return
	}

	stringResponse(w, "OK")
}

func (a *API) handleGetBlocksHistory(w http.ResponseWriter, r *http.Request) {
	// TODO(@pinjasaur): swagger

	// Valid authorization (`manage_system`)?
	userID := getUserID(r)
	if !a.permissions.HasPermissionTo(userID, mmModel.PermissionManageSystem) {
		a.errorResponse(w, r, model.NewErrUnauthorized("access denied Compliance Export getBlocksHistory"))
		return
	}

	// Valid license feature (Compliance)?
	license := a.app.GetLicense()
	if license == nil || !(*license.Features.Compliance) {
		a.errorResponse(w, r, model.NewErrNotImplemented("insufficient license Compliance Export getBlocksHistory"))
		return
	}

	stringResponse(w, "OK")
}
