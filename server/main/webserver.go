package main

import (
	"fmt"
	"log"
	"net/http"
	"path/filepath"

	"github.com/gorilla/mux"
)

type RoutedService interface {
	RegisterRoutes(*mux.Router)
}

type WebServer struct {
	router   *mux.Router
	rootPath string
	port     int
	ssl      bool
}

func NewWebServer(rootPath string, port int, ssl bool) *WebServer {
	r := mux.NewRouter()

	ws := &WebServer{
		router:   r,
		rootPath: rootPath,
		port:     port,
		ssl:      ssl,
	}

	// Static files
	ws.handleDefault(r, "/")
	ws.handleStaticFile(r, "/login", "index.html", "text/html; charset=utf-8")
	ws.handleStaticFile(r, "/board", "index.html", "text/html; charset=utf-8")
	ws.handleStaticFile(r, "/main.js", "main.js", "text/javascript; charset=utf-8")
	ws.handleStaticFile(r, "/boardPage.js", "boardPage.js", "text/javascript; charset=utf-8")
	ws.handleStaticFile(r, "/favicon.ico", "static/favicon.svg", "image/svg+xml; charset=utf-8")
	ws.handleStaticFile(r, "/easymde.min.css", "static/easymde.min.css", "text/css")
	ws.handleStaticFile(r, "/main.css", "static/main.css", "text/css")
	ws.handleStaticFile(r, "/colors.css", "static/colors.css", "text/css")
	ws.handleStaticFile(r, "/images.css", "static/images.css", "text/css")
	return ws
}

func (ws *WebServer) AddRoutes(rs RoutedService) {
	rs.RegisterRoutes(ws.router)
}

func (ws *WebServer) Start() error {
	http.Handle("/", ws.router)

	urlPort := fmt.Sprintf(`:%d`, ws.port)
	var isSSL = ws.ssl && fileExists("./cert/cert.pem") && fileExists("./cert/key.pem")
	if isSSL {
		log.Println("https server started on ", urlPort)
		err := http.ListenAndServeTLS(urlPort, "./cert/cert.pem", "./cert/key.pem", nil)
		if err != nil {
			return err
		}
		return nil
	}
	log.Println("http server started on ", urlPort)
	err := http.ListenAndServe(urlPort, nil)
	if err != nil {
		return err
	}
	return nil
}

// ----------------------------------------------------------------------------------------------------
// HTTP handlers

func (ws *WebServer) serveWebFile(w http.ResponseWriter, r *http.Request, relativeFilePath string) {
	folderPath := ws.rootPath
	filePath := filepath.Join(folderPath, relativeFilePath)
	http.ServeFile(w, r, filePath)
}

func (ws *WebServer) handleStaticFile(r *mux.Router, requestPath string, filePath string, contentType string) {
	r.HandleFunc(requestPath, func(w http.ResponseWriter, r *http.Request) {
		log.Printf("handleStaticFile: %s", requestPath)
		w.Header().Set("Content-Type", contentType)
		ws.serveWebFile(w, r, filePath)
	})
}

func (ws *WebServer) handleDefault(r *mux.Router, requestPath string) {
	r.HandleFunc(requestPath, func(w http.ResponseWriter, r *http.Request) {
		log.Printf("handleDefault")
		http.Redirect(w, r, "/board", http.StatusFound)
	})
}
