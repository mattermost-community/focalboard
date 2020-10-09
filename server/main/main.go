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
	"github.com/gorilla/websocket"
)

var config Configuration

// WebsocketMsg is send on block changes
type WebsocketMsg struct {
	Action  string `json:"action"`
	BlockID string `json:"blockId"`
}

// A single session for now
var session = new(ListenerSession)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

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

// ----------------------------------------------------------------------------------------------------
// REST APIs

func handleGetBlocks(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query()
	parentID := query.Get("parent_id")
	blockType := query.Get("type")

	var blocks []string
	if len(blockType) > 0 {
		blocks = getBlocksWithParentAndType(parentID, blockType)
	} else {
		blocks = getBlocksWithParent(parentID)
	}
	log.Printf("GetBlocks parentID: %s, %d result(s)", parentID, len(blocks))
	response := `[` + strings.Join(blocks[:], ",") + `]`
	jsonResponse(w, 200, response)
}

func handlePostBlocks(w http.ResponseWriter, r *http.Request) {
	requestBody, err := ioutil.ReadAll(r.Body)
	if err != nil {
		errorResponse(w, 500, `{}`)
		return
	}

	// Catch panics from parse errors, etc.
	defer func() {
		if r := recover(); r != nil {
			log.Printf(`ERROR: %v`, r)
			errorResponse(w, 500, `{}`)
			return
		}
	}()

	var blockMaps []map[string]interface{}
	err = json.Unmarshal([]byte(requestBody), &blockMaps)
	if err != nil {
		errorResponse(w, 500, ``)
		return
	}

	var blockIDsToNotify = []string{}
	uniqueBlockIDs := make(map[string]bool)

	for _, blockMap := range blockMaps {
		jsonBytes, err := json.Marshal(blockMap)
		if err != nil {
			errorResponse(w, 500, `{}`)
			return
		}

		block := blockFromMap(blockMap)

		// Error checking
		if len(block.Type) < 1 {
			errorResponse(w, 500, fmt.Sprintf(`{"description": "missing type", "id": "%s"}`, block.ID))
			return
		}
		if block.CreateAt < 1 {
			errorResponse(w, 500, fmt.Sprintf(`{"description": "invalid createAt", "id": "%s"}`, block.ID))
			return
		}
		if block.UpdateAt < 1 {
			errorResponse(w, 500, fmt.Sprintf(`{"description": "invalid updateAt", "id": "%s"}`, block.ID))
			return
		}

		if !uniqueBlockIDs[block.ID] {
			blockIDsToNotify = append(blockIDsToNotify, block.ID)
		}
		if len(block.ParentID) > 0 && !uniqueBlockIDs[block.ParentID] {
			blockIDsToNotify = append(blockIDsToNotify, block.ParentID)
		}

		insertBlock(block, string(jsonBytes))
	}

	broadcastBlockChangeToWebsocketClients(blockIDsToNotify)

	log.Printf("POST Blocks %d block(s)", len(blockMaps))
	jsonResponse(w, 200, "{}")
}

func handleDeleteBlock(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	blockID := vars["blockID"]

	var blockIDsToNotify = []string{blockID}

	parentID := getParentID(blockID)

	if len(parentID) > 0 {
		blockIDsToNotify = append(blockIDsToNotify, parentID)
	}

	deleteBlock(blockID)

	broadcastBlockChangeToWebsocketClients(blockIDsToNotify)

	log.Printf("DELETE Block %s", blockID)
	jsonResponse(w, 200, "{}")
}

func handleGetSubTree(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	blockID := vars["blockID"]

	blocks := getSubTree(blockID)

	log.Printf("GetSubTree blockID: %s, %d result(s)", blockID, len(blocks))
	response := `[` + strings.Join(blocks[:], ",") + `]`
	jsonResponse(w, 200, response)
}

func handleExport(w http.ResponseWriter, r *http.Request) {
	blocks := getAllBlocks()

	log.Printf("EXPORT Blocks, %d result(s)", len(blocks))
	response := `[` + strings.Join(blocks[:], ",") + `]`
	jsonResponse(w, 200, response)
}

func handleImport(w http.ResponseWriter, r *http.Request) {
	requestBody, err := ioutil.ReadAll(r.Body)
	if err != nil {
		errorResponse(w, 500, `{}`)
		return
	}

	// Catch panics from parse errors, etc.
	defer func() {
		if r := recover(); r != nil {
			log.Printf(`ERROR: %v`, r)
			errorResponse(w, 500, `{}`)
			return
		}
	}()

	var blockMaps []map[string]interface{}
	err = json.Unmarshal([]byte(requestBody), &blockMaps)
	if err != nil {
		errorResponse(w, 500, ``)
		return
	}

	for _, blockMap := range blockMaps {
		jsonBytes, err := json.Marshal(blockMap)
		if err != nil {
			errorResponse(w, 500, `{}`)
			return
		}

		block := blockFromMap(blockMap)
		insertBlock(block, string(jsonBytes))
	}

	log.Printf("IMPORT Blocks %d block(s)", len(blockMaps))
	jsonResponse(w, 200, "{}")
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
		jsonResponse(w, http.StatusInternalServerError, `{}`)
		return
	}
	url := fmt.Sprintf(`%s/files/%s`, config.ServerRoot, filename)
	log.Printf(`saveFile, url: %s`, url)
	json := fmt.Sprintf(`{ "url": "%s" }`, url)
	jsonResponse(w, http.StatusOK, json)
}

// Response helpers

func jsonResponse(w http.ResponseWriter, code int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	fmt.Fprint(w, message)
}

func errorResponse(w http.ResponseWriter, code int, message string) {
	log.Printf("%d ERROR", code)
	w.WriteHeader(code)
	fmt.Fprint(w, message)
}

// ----------------------------------------------------------------------------------------------------
// WebSocket OnChange listener

func handleWebSocketOnChange(w http.ResponseWriter, r *http.Request) {
	// Upgrade initial GET request to a websocket
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Fatal(err)
	}

	// TODO: Auth

	query := r.URL.Query()
	blockID := query.Get("id")
	log.Printf("CONNECT WebSocket onChange, blockID: %s, client: %s", blockID, ws.RemoteAddr())

	// Make sure we close the connection when the function returns
	defer func() {
		log.Printf("DISCONNECT WebSocket onChange, blockID: %s, client: %s", blockID, ws.RemoteAddr())

		// Remove client from listeners
		session.RemoveListener(ws)

		ws.Close()
	}()

	// Register our new client
	session.AddListener(ws, blockID)

	// TODO: Implement WebSocket message pump
	// Simple message handling loop
	for {
		_, _, err := ws.ReadMessage()
		if err != nil {
			log.Printf("ERROR WebSocket onChange, blockID: %s, client: %s, err: %v", blockID, ws.RemoteAddr(), err)
			session.RemoveListener(ws)
			break
		}
	}
}

func broadcastBlockChangeToWebsocketClients(blockIDs []string) {
	for _, blockID := range blockIDs {
		listeners := session.GetListeners(blockID)
		log.Printf("%d listener(s) for blockID: %s", len(listeners), blockID)

		if listeners != nil {
			var message = WebsocketMsg{
				Action:  "UPDATE_BLOCK",
				BlockID: blockID,
			}
			for _, listener := range listeners {
				log.Printf("Broadcast change, blockID: %s, remoteAddr: %s", blockID, listener.RemoteAddr())
				err := listener.WriteJSON(message)
				if err != nil {
					log.Printf("broadcast error: %v", err)
					listener.Close()
				}
			}
		}
	}
}

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
	config = readConfigFile()

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

	r := mux.NewRouter()

	// Static files
	handleStaticFile(r, "/", "index.html", "text/html; charset=utf-8")
	handleStaticFile(r, "/login", "index.html", "text/html; charset=utf-8")
	handleStaticFile(r, "/boards", "index.html", "text/html; charset=utf-8")
	handleStaticFile(r, "/board", "index.html", "text/html; charset=utf-8")

	handleStaticFile(r, "/main.js", "main.js", "text/javascript; charset=utf-8")
	handleStaticFile(r, "/boardPage.js", "boardPage.js", "text/javascript; charset=utf-8")
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
	r.HandleFunc("/ws/onchange", handleWebSocketOnChange)

	// Files
	r.HandleFunc("/files/{filename}", handleServeFile).Methods("GET")

	http.Handle("/", r)

	connectDatabase(config.DBType, config.DBConfigString)

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
