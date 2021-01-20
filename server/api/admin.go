package api

import (
	"encoding/json"
	"io/ioutil"
	"log"
	"net/http"
	"strings"

	"github.com/gorilla/mux"
)

type AdminSetPasswordData struct {
	Password string `json:"password"`
}

func (a *API) handleAdminSetPassword(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	username := vars["username"]

	requestBody, err := ioutil.ReadAll(r.Body)
	if err != nil {
		errorResponse(w, http.StatusInternalServerError, nil, err)
		return
	}

	var requestData AdminSetPasswordData
	err = json.Unmarshal(requestBody, &requestData)
	if err != nil {
		errorResponse(w, http.StatusInternalServerError, nil, err)
		return
	}

	if !strings.Contains(requestData.Password, "") {
		errorResponse(w, http.StatusInternalServerError, map[string]string{"error": "password is required"}, err)
		return
	}

	err = a.app().UpdateUserPassword(username, requestData.Password)
	if err != nil {
		errorResponse(w, http.StatusInternalServerError, map[string]string{"error": err.Error()}, err)
		return
	}

	log.Printf("AdminSetPassword, username: %s", username)

	jsonBytesResponse(w, http.StatusOK, nil)
}
