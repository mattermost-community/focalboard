package api

import (
	"encoding/json"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/services/audit"

	"github.com/mattermost/mattermost-server/v6/shared/mlog"
)

func (a *API) registerVirtual(r *mux.Router) {
	// Virtual APIs
	r.HandleFunc("/virtual/links", a.sessionRequired(a.handleGetVirtualLinks)).Methods("GET")
}

func (a *API) handleGetVirtualLinks(w http.ResponseWriter, r *http.Request) {
	// ToDo: add API docs

	query := r.URL.Query()
	teamID := query.Get("team")
	driverName := query.Get("driver")
	userID := getUserID(r)

	if !a.permissions.HasPermissionToTeam(userID, teamID, model.PermissionViewTeam) {
		a.errorResponse(w, r, model.NewErrPermission("access denied to team"))
		return
	}

	auditRec := a.makeAuditRecord(r, "getVirtualLinks", audit.Fail)
	defer a.audit.LogRecord(audit.LevelRead, auditRec)
	auditRec.AddMeta("teamID", teamID)
	auditRec.AddMeta("userID", userID)
	auditRec.AddMeta("driver", driverName)

	links, err := a.app.GetVirtualLinksForDriver(driverName, userID, teamID)
	if err != nil {
		a.errorResponse(w, r, err)
		return
	}

	a.logger.Debug("GetVirtualLinks",
		mlog.String("teamID", teamID),
		mlog.String("userID", userID),
		mlog.String("driver", driverName),
		mlog.Int("virtual_link_count", len(links)),
	)

	json, err := json.Marshal(links)
	if err != nil {
		a.errorResponse(w, r, err)
		return
	}

	jsonBytesResponse(w, http.StatusOK, json)

	auditRec.AddMeta("virtualLinkCount", len(links))
	auditRec.Success()
}
