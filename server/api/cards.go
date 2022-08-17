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

func (a *API) registerCardsRoutes(r *mux.Router) {
	// Cards APIs
	r.HandleFunc("/boards/{boardID}/cards", a.sessionRequired(a.handleCreateCard)).Methods("POST")
}

func (a *API) handleCreateCard(w http.ResponseWriter, r *http.Request) {
	// swagger:operation POST /boards/{boardID}/cards createCard
	//
	// Creates a new card for the specified board.
	//
	// ---
	// produces:
	// - application/json
	// parameters:
	// - name: Body
	//   in: body
	//   description: the card to create
	//   required: true
	//   schema:
	//     "$ref": "#/definitions/Card"
	// - name: disable_notify
	//   in: query
	//   description: Disables notifications (for bulk data inserting)
	//   required: false
	//   type: bool
	//  security:
	// - BearerAuth: []
	// responses:
	//   '200':
	//     description: success
	//     schema:
	//       $ref: '#/definitions/Card'
	//   default:
	//     description: internal error
	//     schema:
	//       "$ref": "#/definitions/ErrorResponse"

	userID := getUserID(r)
	boardID := mux.Vars(r)["boardID"]

	val := r.URL.Query().Get("disable_notify")
	disableNotify := val == True

	requestBody, err := ioutil.ReadAll(r.Body)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	var newCard *model.Card
	if err = json.Unmarshal(requestBody, &newCard); err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusBadRequest, "", err)
		return
	}

	if !a.permissions.HasPermissionToBoard(userID, boardID, model.PermissionManageBoardCards) {
		a.errorResponse(w, r.URL.Path, http.StatusForbidden, "", PermissionError{"access denied to create card"})
		return
	}

	newCard.Populate()
	if err = newCard.CheckValid(); err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusBadRequest, err.Error(), err)
		return
	}

	auditRec := a.makeAuditRecord(r, "createCard", audit.Fail)
	defer a.audit.LogRecord(audit.LevelModify, auditRec)
	auditRec.AddMeta("boardID", boardID)

	// create card
	card, err := a.app.CreateCard(newCard, boardID, userID, disableNotify)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	a.logger.Debug("CreateCard",
		mlog.String("boardID", boardID),
		mlog.String("cardID", card.ID),
		mlog.String("userID", userID),
	)

	data, err := json.Marshal(card)
	if err != nil {
		a.errorResponse(w, r.URL.Path, http.StatusInternalServerError, "", err)
		return
	}

	// response
	jsonBytesResponse(w, http.StatusOK, data)

	auditRec.Success()
}
