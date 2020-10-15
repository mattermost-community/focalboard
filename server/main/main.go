package main

import (
	"encoding/json"
	"flag"
	"io/ioutil"
	"mime/multipart"
	"path/filepath"
	"strings"
	"syscall"
	"time"

	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"

	"github.com/gorilla/mux"
)

var config *Configuration
var wsServer *WSServer
var store *SQLStore

// ----------------------------------------------------------------------------------------------------
// HTTP handlers

func serveWebFile(w http.ResponseWriter, r *http.Request, relativeFilePath string) {
	folderPath := config.WebPath
	filePath := filepath.Join(folderPath, relativeFilePath)
	http.ServeFile(w, r, filePath)
}

func handleStaticFile(r *mux.Router, requestPath string, filePath string, contentType string) {
	r.HandleFunc(requestPath, func(w http.ResponseWriter, r *http.Request) {
		log.Printf("handleStaticFile: %s", requestPath)
		w.Header().Set("Content-Type", contentType)
		serveWebFile(w, r, filePath)
	})
}

func handleDefault(r *mux.Router, requestPath string) {
	r.HandleFunc(requestPath, func(w http.ResponseWriter, r *http.Request) {
		log.Printf("handleDefault")
		http.Redirect(w, r, "/board", http.StatusFound)
	})
}

// ----------------------------------------------------------------------------------------------------
// REST APIs

func handleGetBlocks(w http.ResponseWriter, r *http.Request) {
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

func handlePostBlocks(w http.ResponseWriter, r *http.Request) {
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

func handleDeleteBlock(w http.ResponseWriter, r *http.Request) {
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

func handleGetSubTree(w http.ResponseWriter, r *http.Request) {
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

func handleExport(w http.ResponseWriter, r *http.Request) {
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

func handleImport(w http.ResponseWriter, r *http.Request) {
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

func handleServeFile(w http.ResponseWriter, r *http.Request) {
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

func handleUploadFile(w http.ResponseWriter, r *http.Request) {
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

// ----------------------------------------------------------------------------------------------------
// WebSocket OnChange listener

func isProcessRunning(pid int) bool {
	process, err := os.FindProcess(pid)
	if err != nil {
		return false
	}

	err = process.Signal(syscall.Signal(0))
	if err != nil {
		return false
	}

	return true
}

func monitorPid(pid int) {
	log.Printf("Monitoring PID: %d", pid)
	go func() {
		for {
			if !isProcessRunning(pid) {
				log.Printf("Monitored process not found, exiting.")
				os.Exit(1)
			}
			time.Sleep(2 * time.Second)
		}
	}()
}

func main() {
	// config.json file
	var err error
	config, err = readConfigFile()
	if err != nil {
		log.Fatal("Unable to read the config file: ", err)
		return
	}

	// Command line args
	pMonitorPid := flag.Int("monitorpid", -1, "a process ID")
	pPort := flag.Int("port", config.Port, "the port number")
	flag.Parse()

	if pMonitorPid != nil && *pMonitorPid > 0 {
		monitorPid(*pMonitorPid)
	}

	if pPort != nil && *pPort > 0 && *pPort != config.Port {
		// Override port
		log.Printf("Port from commandline: %d", *pPort)
		config.Port = *pPort
	}

	wsServer = NewWSServer()

	r := mux.NewRouter()

	// Static files
	handleDefault(r, "/")

	handleStaticFile(r, "/login", "index.html", "text/html; charset=utf-8")
	handleStaticFile(r, "/board", "index.html", "text/html; charset=utf-8")
	handleStaticFile(r, "/main.js", "main.js", "text/javascript; charset=utf-8")
	handleStaticFile(r, "/boardPage.js", "boardPage.js", "text/javascript; charset=utf-8")

	handleStaticFile(r, "/favicon.ico", "static/favicon.svg", "image/svg+xml; charset=utf-8")

	handleStaticFile(r, "/easymde.min.css", "static/easymde.min.css", "text/css")
	handleStaticFile(r, "/main.css", "static/main.css", "text/css")
	handleStaticFile(r, "/colors.css", "static/colors.css", "text/css")
	handleStaticFile(r, "/images.css", "static/images.css", "text/css")

	// APIs
	r.HandleFunc("/api/v1/blocks", handleGetBlocks).Methods("GET")
	r.HandleFunc("/api/v1/blocks", handlePostBlocks).Methods("POST")
	r.HandleFunc("/api/v1/blocks/{blockID}", handleDeleteBlock).Methods("DELETE")
	r.HandleFunc("/api/v1/blocks/{blockID}/subtree", handleGetSubTree).Methods("GET")

	r.HandleFunc("/api/v1/files", handleUploadFile).Methods("POST")

	r.HandleFunc("/api/v1/blocks/export", handleExport).Methods("GET")
	r.HandleFunc("/api/v1/blocks/import", handleImport).Methods("POST")

	// WebSocket
	r.HandleFunc("/ws/onchange", wsServer.handleWebSocketOnChange)

	// Files
	r.HandleFunc("/files/{filename}", handleServeFile).Methods("GET")

	http.Handle("/", r)

	store, err = NewSQLStore(config.DBType, config.DBConfigString)
	if err != nil {
		log.Fatal("Unable to start the database", err)
		panic(err)
	}

	// Ctrl+C handling
	handler := make(chan os.Signal, 1)
	signal.Notify(handler, os.Interrupt)
	go func() {
		for sig := range handler {
			// sig is a ^C, handle it
			if sig == os.Interrupt {
				os.Exit(1)
				break
			}
		}
	}()

	// Start the server, with SSL if the certs exist
	urlPort := fmt.Sprintf(`:%d`, config.Port)
	var isSSL = config.UseSSL && fileExists("./cert/cert.pem") && fileExists("./cert/key.pem")
	if isSSL {
		log.Println("https server started on ", urlPort)
		err := http.ListenAndServeTLS(urlPort, "./cert/cert.pem", "./cert/key.pem", nil)
		if err != nil {
			log.Fatal("ListenAndServeTLS: ", err)
		}
	} else {
		log.Println("http server started on ", urlPort)
		err := http.ListenAndServe(urlPort, nil)
		if err != nil {
			log.Fatal("ListenAndServe: ", err)
		}
	}
}
