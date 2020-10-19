package web

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"path"
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

	return ws
}

func (ws *WebServer) AddRoutes(rs RoutedService) {
	rs.RegisterRoutes(ws.router)
}

func (ws *WebServer) registerRoutes() {
	ws.router.PathPrefix("/static").Handler(http.StripPrefix("/static/", http.FileServer(http.Dir(filepath.Join(ws.rootPath, "static")))))
	ws.router.PathPrefix("/").HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		http.ServeFile(w, r, path.Join(ws.rootPath, "index.html"))
	})
}

func (ws *WebServer) Start() error {
	ws.registerRoutes()
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

// FileExists returns true if a file exists at the path
func fileExists(path string) bool {
	_, err := os.Stat(path)
	if os.IsNotExist(err) {
		return false
	}
	return err == nil
}
