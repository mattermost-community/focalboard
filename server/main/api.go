package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/gorilla/mux"
)

// ----------------------------------------------------------------------------------------------------
// REST APIs

type API struct{}

func NewAPI() *API {
	return &API{}
}

func (a *API) RegisterRoutes(r *mux.Router) {
	r.HandleFunc("/api/v1/blocks", a.handleGetBlocks).Methods("GET")
	r.HandleFunc("/api/v1/blocks", a.handlePostBlocks).Methods("POST")
	r.HandleFunc("/api/v1/blocks/{blockID}", a.handleDeleteBlock).Methods("DELETE")
	r.HandleFunc("/api/v1/blocks/{blockID}/subtree", a.handleGetSubTree).Methods("GET")

	r.HandleFunc("/api/v1/files", a.handleUploadFile).Methods("POST")
	r.HandleFunc("/files/{filename}", a.handleServeFile).Methods("GET")

	r.HandleFunc("/api/v1/blocks/export", a.handleExport).Methods("GET")
	r.HandleFunc("/api/v1/blocks/import", a.handleImport).Methods("POST")
}

func (a *API) handleGetBlocks(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query()
	parentID := query.Get("parent_id")
	blockType := query.Get("type")

	var blocks []Block
	if len(blockType) > 0 && len(parentID) > 0 {
		blocks = store.getBlocksWithParentAndType(parentID, blockType)
	} else if len(blockType) > 0 {
		blocks = store.getBlocksWithType(blockType)
	} else {
		blocks = store.getBlocksWithParent(parentID)
	}

	log.Printf("GetBlocks parentID: %s, type: %s, %d result(s)", parentID, blockType, len(blocks))
	json, err := json.Marshal(blocks)
	if err != nil {
		log.Printf(`ERROR json.Marshal: %v`, r)
		errorResponse(w, http.StatusInternalServerError, `{}`)
		return
	}

	jsonBytesResponse(w, http.StatusOK, json)
}

func (a *API) handlePostBlocks(w http.ResponseWriter, r *http.Request) {
	requestBody, err := ioutil.ReadAll(r.Body)
	if err != nil {
		errorResponse(w, http.StatusInternalServerError, `{}`)
		return
	}

	// Catch panics from parse errors, etc.
	defer func() {
		if r := recover(); r != nil {
			log.Printf(`ERROR: %v`, r)
			errorResponse(w, http.StatusInternalServerError, `{}`)
			return
		}
	}()

	var blocks []Block
	err = json.Unmarshal([]byte(requestBody), &blocks)
	if err != nil {
		errorResponse(w, http.StatusInternalServerError, ``)
		return
	}

	var blockIDsToNotify = []string{}
	uniqueBlockIDs := make(map[string]bool)

	for _, block := range blocks {
		// Error checking
		if len(block.Type) < 1 {
			errorResponse(w, http.StatusInternalServerError, fmt.Sprintf(`{"description": "missing type", "id": "%s"}`, block.ID))
			return
		}
		if block.CreateAt < 1 {
			errorResponse(w, http.StatusInternalServerError, fmt.Sprintf(`{"description": "invalid createAt", "id": "%s"}`, block.ID))
			return
		}
		if block.UpdateAt < 1 {
			errorResponse(w, http.StatusInternalServerError, fmt.Sprintf(`{"description": "invalid updateAt", "id": "%s"}`, block.ID))
			return
		}

		if !uniqueBlockIDs[block.ID] {
			blockIDsToNotify = append(blockIDsToNotify, block.ID)
		}
		if len(block.ParentID) > 0 && !uniqueBlockIDs[block.ParentID] {
			blockIDsToNotify = append(blockIDsToNotify, block.ParentID)
		}

		store.insertBlock(block)
	}

	wsServer.broadcastBlockChangeToWebsocketClients(blockIDsToNotify)

	log.Printf("POST Blocks %d block(s)", len(blocks))
	jsonStringResponse(w, http.StatusOK, "{}")
}

func (a *API) handleDeleteBlock(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	blockID := vars["blockID"]

	var blockIDsToNotify = []string{blockID}

	parentID := store.getParentID(blockID)

	if len(parentID) > 0 {
		blockIDsToNotify = append(blockIDsToNotify, parentID)
	}

	store.deleteBlock(blockID)

	wsServer.broadcastBlockChangeToWebsocketClients(blockIDsToNotify)

	log.Printf("DELETE Block %s", blockID)
	jsonStringResponse(w, http.StatusOK, "{}")
}

func (a *API) handleGetSubTree(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	blockID := vars["blockID"]

	blocks := store.getSubTree(blockID)

	log.Printf("GetSubTree blockID: %s, %d result(s)", blockID, len(blocks))
	json, err := json.Marshal(blocks)
	if err != nil {
		log.Printf(`ERROR json.Marshal: %v`, r)
		errorResponse(w, http.StatusInternalServerError, `{}`)
		return
	}

	jsonBytesResponse(w, http.StatusOK, json)
}

func (a *API) handleExport(w http.ResponseWriter, r *http.Request) {
	blocks := store.getAllBlocks()

	log.Printf("EXPORT Blocks, %d result(s)", len(blocks))
	json, err := json.Marshal(blocks)
	if err != nil {
		log.Printf(`ERROR json.Marshal: %v`, r)
		errorResponse(w, http.StatusInternalServerError, `{}`)
		return
	}

	jsonBytesResponse(w, http.StatusOK, json)
}

func (a *API) handleImport(w http.ResponseWriter, r *http.Request) {
	requestBody, err := ioutil.ReadAll(r.Body)
	if err != nil {
		errorResponse(w, http.StatusInternalServerError, `{}`)
		return
	}

	// Catch panics from parse errors, etc.
	defer func() {
		if r := recover(); r != nil {
			log.Printf(`ERROR: %v`, r)
			errorResponse(w, http.StatusInternalServerError, `{}`)
			return
		}
	}()

	var blocks []Block
	err = json.Unmarshal([]byte(requestBody), &blocks)
	if err != nil {
		errorResponse(w, http.StatusInternalServerError, ``)
		return
	}

	for _, block := range blocks {
		store.insertBlock(block)
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

	folderPath := config.FilesPath
	filePath := filepath.Join(folderPath, filename)
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

	saveFile(w, file, handle)
}

func saveFile(w http.ResponseWriter, file multipart.File, handle *multipart.FileHeader) {
	data, err := ioutil.ReadAll(file)
	if err != nil {
		fmt.Fprintf(w, "%v", err)
		return
	}

	// NOTE: File extension includes the dot
	fileExtension := strings.ToLower(filepath.Ext(handle.Filename))
	if fileExtension == ".jpeg" {
		fileExtension = ".jpg"
	}

	filename := fmt.Sprintf(`%s%s`, createGUID(), fileExtension)

	folderPath := config.FilesPath
	filePath := filepath.Join(folderPath, filename)
	os.MkdirAll(folderPath, os.ModePerm)
	err = ioutil.WriteFile(filePath, data, 0666)
	if err != nil {
		jsonStringResponse(w, http.StatusInternalServerError, `{}`)
		return
	}
	url := fmt.Sprintf(`%s/files/%s`, config.ServerRoot, filename)
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

func errorResponse(w http.ResponseWriter, code int, message string) {
	log.Printf("%d ERROR", code)
	w.WriteHeader(code)
	fmt.Fprint(w, message)
}
