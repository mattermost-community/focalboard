package api

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
	"github.com/mattermost/focalboard/server/model"
	mmModel "github.com/mattermost/mattermost-server/v6/model"
	"github.com/mattermost/mattermost-server/v6/shared/mlog"
)

const (
	complianceDefaultPage    = "0"
	complianceDefaultPerPage = "60"
)

func (a *API) registerComplianceRoutes(r *mux.Router) {
	// Compliance APIs
	r.HandleFunc("/admin/boards", a.sessionRequired(a.handleGetAllBoards)).Methods("GET")
	r.HandleFunc("/admin/boards_history", a.sessionRequired(a.handleGetBoardsHistory)).Methods("GET")
	r.HandleFunc("/admin/blocks_history", a.sessionRequired(a.handleGetBlocksHistory)).Methods("GET")
}

func (a *API) handleGetAllBoards(w http.ResponseWriter, r *http.Request) {
	// TODO(@pinjasaur): swagger

	query := r.URL.Query()
	teamID := query.Get("team_id")
	strPage := query.Get("page")
	strPerPage := query.Get("per_page")

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

	if strPage == "" {
		strPage = complianceDefaultPage
	}
	if strPerPage == "" {
		strPerPage = complianceDefaultPerPage
	}
	page, err := strconv.Atoi(strPage)
	if err != nil {
		message := fmt.Sprintf("invalid `page` parameter: %s", err)
		a.errorResponse(w, r, model.NewErrBadRequest(message))
		return
	}
	perPage, err := strconv.Atoi(strPerPage)
	if err != nil {
		message := fmt.Sprintf("invalid `per_page` parameter: %s", err)
		a.errorResponse(w, r, model.NewErrBadRequest(message))
		return
	}

	boards, err := a.app.GetBoardsForTeam(teamID, page, perPage)
	if err != nil {
		a.errorResponse(w, r, err)
		return
	}

	// N+1; is there more?
	// TODO: potentially fragile if len(boards) == 0 or perPage < 0
	hasNext := len(boards) > perPage
	if hasNext {
		boards = boards[:len(boards)-1]
	}

	a.logger.Debug("GetAllBoards",
		mlog.String("teamID", teamID),
		mlog.Int("boardsCount", len(boards)),
	)

	response := model.ComplianceResponse{
		HasNext: hasNext,
		Results: boards,
	}
	data, err := json.Marshal(response)
	if err != nil {
		a.errorResponse(w, r, err)
		return
	}

	jsonBytesResponse(w, http.StatusOK, data)
}

func (a *API) handleGetBoardsHistory(w http.ResponseWriter, r *http.Request) {
	// TODO(@pinjasaur): swagger

	query := r.URL.Query()
	strModifiedSince := query.Get("modified_since") // required, everything else optional
	includeDeleted := query.Get("include_deleted") == "true"
	teamID := query.Get("team_id")
	strPage := query.Get("page")
	strPerPage := query.Get("per_page")

	if strModifiedSince == "" {
		a.errorResponse(w, r, model.NewErrBadRequest("`modified_since` parameter required"))
		return
	}

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

	if strPage == "" {
		strPage = complianceDefaultPage
	}
	if strPerPage == "" {
		strPerPage = complianceDefaultPerPage
	}
	page, err := strconv.Atoi(strPage)
	if err != nil {
		message := fmt.Sprintf("invalid `page` parameter: %s", err)
		a.errorResponse(w, r, model.NewErrBadRequest(message))
		return
	}
	perPage, err := strconv.Atoi(strPerPage)
	if err != nil {
		message := fmt.Sprintf("invalid `per_page` parameter: %s", err)
		a.errorResponse(w, r, model.NewErrBadRequest(message))
		return
	}
	modifiedSince, err := strconv.Atoi(strModifiedSince)
	if err != nil {
		message := fmt.Sprintf("invalid `modified_since` parameter: %s", err)
		a.errorResponse(w, r, model.NewErrBadRequest(message))
		return
	}

	boards, err := a.app.GetBoardsHistory(modifiedSince, includeDeleted, teamID, page, perPage)
	if err != nil {
		a.errorResponse(w, r, err)
		return
	}

	// N+1; is there more?
	// TODO: potentially fragile if len(boards) == 0 or perPage < 0
	hasNext := len(boards) > perPage
	if hasNext {
		boards = boards[:len(boards)-1]
	}

	a.logger.Debug("GetBoardsHistory",
		mlog.String("teamID", teamID),
		mlog.Int("boardsCount", len(boards)),
	)

	response := model.ComplianceResponse{
		HasNext: hasNext,
		Results: boards,
	}
	data, err := json.Marshal(response)
	if err != nil {
		a.errorResponse(w, r, err)
		return
	}

	jsonBytesResponse(w, http.StatusOK, data)
}

func (a *API) handleGetBlocksHistory(w http.ResponseWriter, r *http.Request) {
	// TODO(@pinjasaur): swagger

	query := r.URL.Query()
	strModifiedSince := query.Get("modified_since") // required, everything else optional
	includeDeleted := query.Get("include_deleted") == "true"
	teamID := query.Get("team_id")
	boardID := query.Get("board_id")
	strPage := query.Get("page")
	strPerPage := query.Get("per_page")

	if strModifiedSince == "" {
		a.errorResponse(w, r, model.NewErrBadRequest("`modified_since` parameter required"))
		return
	}

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

	if strPage == "" {
		strPage = complianceDefaultPage
	}
	if strPerPage == "" {
		strPerPage = complianceDefaultPerPage
	}
	page, err := strconv.Atoi(strPage)
	if err != nil {
		message := fmt.Sprintf("invalid `page` parameter: %s", err)
		a.errorResponse(w, r, model.NewErrBadRequest(message))
		return
	}
	perPage, err := strconv.Atoi(strPerPage)
	if err != nil {
		message := fmt.Sprintf("invalid `per_page` parameter: %s", err)
		a.errorResponse(w, r, model.NewErrBadRequest(message))
		return
	}
	modifiedSince, err := strconv.Atoi(strModifiedSince)
	if err != nil {
		message := fmt.Sprintf("invalid `modified_since` parameter: %s", err)
		a.errorResponse(w, r, model.NewErrBadRequest(message))
		return
	}

	blocks, err := a.app.GetBlocksHistory(modifiedSince, includeDeleted, teamID, boardID, page, perPage)
	if err != nil {
		a.errorResponse(w, r, err)
		return
	}

	// N+1; is there more?
	// TODO: potentially fragile if len(blocks) == 0 or perPage < 0
	hasNext := len(blocks) > perPage
	if hasNext {
		blocks = blocks[:len(blocks)-1]
	}

	a.logger.Debug("GetBlocksHistory",
		mlog.String("teamID", teamID),
		mlog.String("boardID", boardID),
		mlog.Int("blocksCount", len(blocks)),
	)

	response := model.ComplianceResponse{
		HasNext: hasNext,
		Results: blocks,
	}
	data, err := json.Marshal(response)
	if err != nil {
		a.errorResponse(w, r, err)
		return
	}

	jsonBytesResponse(w, http.StatusOK, data)
}
