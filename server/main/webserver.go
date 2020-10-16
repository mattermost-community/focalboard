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
	router *mux.Router
	port   int
	ssl    bool
}

func NewWebServer(port int, ssl bool) *WebServer {
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
	return &WebServer{
		router: r,
		port:   port,
		ssl:    ssl,
	}
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
