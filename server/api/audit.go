package api

import (
	"net/http"

	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/services/audit"
)

// makeAuditRecord creates an audit record pre-populated with data from the request.
func (a *API) makeAuditRecord(r *http.Request, event string, initialStatus string) *audit.Record {
	ctx := r.Context()
	session := ctx.Value("session").(*model.Session)
	userID := session.UserID

	workspaceID := "unknown"
	container, err := a.getContainer(r)
	if err == nil {
		workspaceID = container.WorkspaceID
	}

	rec := &audit.Record{
		APIPath:   r.URL.Path,
		Event:     event,
		Status:    initialStatus,
		UserID:    userID,
		SessionID: session.ID,
		Client:    r.UserAgent(),
		IPAddress: r.RemoteAddr,
		Meta:      []audit.Meta{{K: audit.KeyWorkspaceID, V: workspaceID}},
	}

	return rec
}
