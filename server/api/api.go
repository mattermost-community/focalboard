package api

import (
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/gorilla/mux"
	"github.com/mattermost/mattermost-octo-tasks/server/app"
	"github.com/mattermost/mattermost-octo-tasks/server/model"
)

// ----------------------------------------------------------------------------------------------------
// REST APIs

type API struct {
	appBuilder func() *app.App
	singleUser bool
}

func NewAPI(appBuilder func() *app.App, singleUser bool) *API {
	return &API{appBuilder: appBuilder, singleUser: singleUser}
}

func (a *API) app() *app.App {
	return a.appBuilder()
}

func (a *API) RegisterRoutes(r *mux.Router) {
	r.HandleFunc("/api/v1/blocks", a.sessionRequired(a.handleGetBlocks)).Methods("GET")
	r.HandleFunc("/api/v1/blocks", a.handlePostBlocks).Methods("POST")
	r.HandleFunc("/api/v1/blocks/{blockID}", a.handleDeleteBlock).Methods("DELETE")
	r.HandleFunc("/api/v1/blocks/{blockID}/subtree", a.handleGetSubTree).Methods("GET")

	r.HandleFunc("/api/v1/login", a.handleLogin).Methods("POST")
	r.HandleFunc("/api/v1/register", a.handleRegister).Methods("POST")

	r.HandleFunc("/api/v1/files", a.handleUploadFile).Methods("POST")
	r.HandleFunc("/files/{filename}", a.handleServeFile).Methods("GET")

	r.HandleFunc("/api/v1/blocks/export", a.handleExport).Methods("GET")
	r.HandleFunc("/api/v1/blocks/import", a.handleImport).Methods("POST")
}

func (a *API) handleGetBlocks(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query()
	parentID := query.Get("parent_id")
	blockType := query.Get("type")

	blocks, err := a.app().GetBlocks(parentID, blockType)
	if err != nil {
		log.Printf(`ERROR GetBlocks: %v`, r)
		errorResponse(w, http.StatusInternalServerError, nil)

		return
	}

	log.Printf("GetBlocks parentID: %s, type: %s, %d result(s)", parentID, blockType, len(blocks))

	json, err := json.Marshal(blocks)
	if err != nil {
		log.Printf(`ERROR json.Marshal: %v`, r)
		errorResponse(w, http.StatusInternalServerError, nil)

		return
	}

	jsonBytesResponse(w, http.StatusOK, json)
}

func (a *API) handlePostBlocks(w http.ResponseWriter, r *http.Request) {
	requestBody, err := ioutil.ReadAll(r.Body)
	if err != nil {
		errorResponse(w, http.StatusInternalServerError, nil)

		return
	}

	// Catch panics from parse errors, etc.
	defer func() {
		if r := recover(); r != nil {
			log.Printf(`ERROR: %v`, r)
			errorResponse(w, http.StatusInternalServerError, nil)

			return
		}
	}()

	var blocks []model.Block

	err = json.Unmarshal(requestBody, &blocks)
	if err != nil {
		errorResponse(w, http.StatusInternalServerError, nil)

		return
	}

	for _, block := range blocks {
		// Error checking
		if len(block.Type) < 1 {
			errorData := map[string]string{"description": "missing type", "id": block.ID}
			errorResponse(w, http.StatusBadRequest, errorData)

			return
		}

		if block.CreateAt < 1 {
			errorData := map[string]string{"description": "invalid createAt", "id": block.ID}
			errorResponse(w, http.StatusBadRequest, errorData)

			return
		}

		if block.UpdateAt < 1 {
			errorData := map[string]string{"description": "invalid UpdateAt", "id": block.ID}
			errorResponse(w, http.StatusBadRequest, errorData)

			return
		}
	}

	err = a.app().InsertBlocks(blocks)
	if err != nil {
		log.Printf(`ERROR: %v`, r)
		errorResponse(w, http.StatusInternalServerError, nil)

		return
	}

	log.Printf("POST Blocks %d block(s)", len(blocks))
	jsonStringResponse(w, http.StatusOK, "{}")
}

func (a *API) handleDeleteBlock(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	blockID := vars["blockID"]

	err := a.app().DeleteBlock(blockID)
	if err != nil {
		log.Printf(`ERROR: %v`, r)
		errorResponse(w, http.StatusInternalServerError, nil)

		return
	}

	log.Printf("DELETE Block %s", blockID)
	jsonStringResponse(w, http.StatusOK, "{}")
}

func (a *API) handleGetSubTree(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	blockID := vars["blockID"]

	query := r.URL.Query()
	levels, err := strconv.ParseInt(query.Get("l"), 10, 32)
	if err != nil {
		levels = 2
	}

	if levels != 2 && levels != 3 {
		log.Printf(`ERROR Invalid levels: %d`, levels)
		errorData := map[string]string{"description": "invalid levels"}
		errorResponse(w, http.StatusInternalServerError, errorData)

		return
	}

	blocks, err := a.app().GetSubTree(blockID, int(levels))
	if err != nil {
		log.Printf(`ERROR: %v`, r)
		errorResponse(w, http.StatusInternalServerError, nil)

		return
	}

	log.Printf("GetSubTree (%v) blockID: %s, %d result(s)", levels, blockID, len(blocks))
	json, err := json.Marshal(blocks)
	if err != nil {
		log.Printf(`ERROR json.Marshal: %v`, r)
		errorResponse(w, http.StatusInternalServerError, nil)

		return
	}

	jsonBytesResponse(w, http.StatusOK, json)
}

func (a *API) handleExport(w http.ResponseWriter, r *http.Request) {
	blocks, err := a.app().GetAllBlocks()
	if err != nil {
		log.Printf(`ERROR: %v`, r)
		errorResponse(w, http.StatusInternalServerError, nil)

		return
	}

	log.Printf("EXPORT Blocks, %d result(s)", len(blocks))

	json, err := json.Marshal(blocks)
	if err != nil {
		log.Printf(`ERROR json.Marshal: %v`, r)
		errorResponse(w, http.StatusInternalServerError, nil)

		return
	}

	jsonBytesResponse(w, http.StatusOK, json)
}

func (a *API) handleImport(w http.ResponseWriter, r *http.Request) {
	requestBody, err := ioutil.ReadAll(r.Body)
	if err != nil {
		errorResponse(w, http.StatusInternalServerError, nil)

		return
	}

	// Catch panics from parse errors, etc.
	defer func() {
		if r := recover(); r != nil {
			log.Printf(`ERROR: %v`, r)
			errorResponse(w, http.StatusInternalServerError, nil)

			return
		}
	}()

	var blocks []model.Block

	err = json.Unmarshal(requestBody, &blocks)
	if err != nil {
		errorResponse(w, http.StatusInternalServerError, nil)

		return
	}

	err = a.app().InsertBlocks(blocks)
	if err != nil {
		log.Printf(`ERROR: %v`, r)
		errorResponse(w, http.StatusInternalServerError, nil)

		return
	}

	log.Printf("IMPORT Blocks %d block(s)", len(blocks))
	jsonStringResponse(w, http.StatusOK, "{}")
}

// File upload

func (a *API) handleServeFile(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	filename := vars["filename"]

	contentType := "image/jpg"

	fileExtension := strings.ToLower(filepath.Ext(filename))
	if fileExtension == "png" {
		contentType = "image/png"
	}

	w.Header().Set("Content-Type", contentType)

	filePath := a.app().GetFilePath(filename)
	http.ServeFile(w, r, filePath)
}

func (a *API) handleUploadFile(w http.ResponseWriter, r *http.Request) {
	fmt.Println(`handleUploadFile`)

	file, handle, err := r.FormFile("file")
	if err != nil {
		fmt.Fprintf(w, "%v", err)

		return
	}
	defer file.Close()

	log.Printf(`handleUploadFile, filename: %s`, handle.Filename)

	url, err := a.app().SaveFile(file, handle.Filename)
	if err != nil {
		jsonStringResponse(w, http.StatusInternalServerError, `{}`)

		return
	}

	log.Printf(`saveFile, url: %s`, url)
	json := fmt.Sprintf(`{ "url": "%s" }`, url)
	jsonStringResponse(w, http.StatusOK, json)
}

// Response helpers

func jsonStringResponse(w http.ResponseWriter, code int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	fmt.Fprint(w, message)
}

func jsonBytesResponse(w http.ResponseWriter, code int, json []byte) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	w.Write(json)
}

func errorResponse(w http.ResponseWriter, code int, message map[string]string) {
	log.Printf("%d ERROR", code)
	w.Header().Set("Content-Type", "application/json")
	data, err := json.Marshal(message)
	if err != nil {
		data = []byte("{}")
	}
	w.WriteHeader(code)
	w.Write(data)
}

func addUserID(rw http.ResponseWriter, req *http.Request, next http.Handler) {
	ctx := context.WithValue(req.Context(), "userid", req.Header.Get("userid"))
	req = req.WithContext(ctx)
	next.ServeHTTP(rw, req)
}
