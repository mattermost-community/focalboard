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

// RoutedService defines the interface that is needed for any service to
// register themself in the web server to provide new endpoints. (see
// AddRoutes).
type RoutedService interface {
	RegisterRoutes(*mux.Router)
}

// Server is the structure responsible for managing our http web server.
type Server struct {
	router   *mux.Router
	rootPath string
	port     int
	ssl      bool
}

// NewServer creates a new instance of the webserver.
func NewServer(rootPath string, port int, ssl bool) *Server {
	r := mux.NewRouter()

	ws := &Server{
		router:   r,
		rootPath: rootPath,
		port:     port,
		ssl:      ssl,
	}

	return ws
}

// AddRoutes allows services to register themself in the webserver router and provide new endpoints.
func (ws *Server) AddRoutes(rs RoutedService) {
	rs.RegisterRoutes(ws.router)
}

func (ws *Server) registerRoutes() {
	ws.router.PathPrefix("/static").Handler(http.StripPrefix("/static/", http.FileServer(http.Dir(filepath.Join(ws.rootPath, "static")))))
	ws.router.PathPrefix("/").HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		http.ServeFile(w, r, path.Join(ws.rootPath, "index.html"))
	})
}

// Start runs the web server and start listening for charsetnnections.
func (ws *Server) Start() error {
	ws.registerRoutes()
	http.Handle("/", ws.router)

	urlPort := fmt.Sprintf(`:%d`, ws.port)
	isSSL := ws.ssl && fileExists("./cert/cert.pem") && fileExists("./cert/key.pem")

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

// fileExists returns true if a file exists at the path.
func fileExists(path string) bool {
	_, err := os.Stat(path)
	if os.IsNotExist(err) {
		return false
	}

	return err == nil
}
