package api

import (
	"fmt"
	"net/http"
	"time"

	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/services/audit"
)

func (a *API) handleArchiveExport(w http.ResponseWriter, r *http.Request) {
	// swagger:operation GET /api/v1/workspaces/{workspaceID}/archive/export archiveExport
	//
	// Exports an archive of all blocks for one or more boards.
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
	rootID := query.Get("root_id")
	container, err := a.getContainer(r)
	if err != nil {
		a.noContainerErrorResponse(w, r.URL.Path, err)
		return
	}

	auditRec := a.makeAuditRecord(r, "archiveExport", audit.Fail)
	defer a.audit.LogRecord(audit.LevelRead, auditRec)
	auditRec.AddMeta("rootID", rootID)

	var boardIDs []string
	if rootID != "" {
		boardIDs = []string{rootID}
	}
	opts := model.ExportArchiveOptions{
		WorkspaceID: container.WorkspaceID,
		BoardIDs:    boardIDs,
	}

	filename := fmt.Sprintf("archive-%s.focalboard", time.Now().Format("2006-01-02"))
	w.Header().Set("Content-Type", "application/octet-stream")
	w.Header().Set("Content-Disposition", "attachment; filename="+filename)
	w.Header().Set("Content-Transfer-Encoding", "binary")

	if err := a.app.ExportArchive(w, opts); err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
	}

	auditRec.Success()
}

func (a *API) handleArchiveImport(w http.ResponseWriter, r *http.Request) {
	// swagger:operation POST /api/v1/workspaces/{workspaceID}/archive/import archiveImport
	//
	// Import an archive of boards.
	//
	// ---
	// produces:
	// - application/json
	// consumes:
	// - multipart/form-data
	// parameters:
	// - name: workspaceID
	//   in: path
	//   description: Workspace ID
	//   required: true
	//   type: string
	// - name: file
	//   in: formData
	//   description: archive to import
	//   required: true
	//   type: file
	// security:
	// - BearerAuth: []
	// responses:
	//   '200':
	//     description: success
	//   default:
	//     description: internal error
	//     schema:
	//       "$ref": "#/definitions/ErrorResponse"

	container, err := a.getContainer(r)
	if err != nil {
		a.noContainerErrorResponse(w, r.URL.Path, err)
		return
	}

	file, handle, err := r.FormFile(UploadFormFileKey)
	if err != nil {
		fmt.Fprintf(w, "%v", err)
		return
	}
	defer file.Close()

	auditRec := a.makeAuditRecord(r, "import", audit.Fail)
	defer a.audit.LogRecord(audit.LevelModify, auditRec)
	auditRec.AddMeta("filename", handle.Filename)
	auditRec.AddMeta("size", handle.Size)

	opt := model.ImportArchiveOptions{
		WorkspaceID: container.WorkspaceID,
	}

	if err := a.app.ImportArchive(file, opt); err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	/*
		stampModificationMetadata(r, blocks, auditRec)
	*/

	jsonStringResponse(w, http.StatusOK, "{}")

	auditRec.Success()
}
