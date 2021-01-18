package web

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"path"
	"path/filepath"
	"sync"

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
	http.Server

	rootPath string
	port     int
	ssl      bool
}

// NewServer creates a new instance of the webserver.
func NewServer(rootPath string, port int, ssl bool) *Server {
	r := mux.NewRouter()

	ws := &Server{
		Server: http.Server{
			Addr:    fmt.Sprintf(`:%d`, port),
			Handler: r,
		},
		rootPath: rootPath,
		port:     port,
		ssl:      ssl,
	}

	return ws
}

func (ws *Server) Router() *mux.Router {
	return ws.Server.Handler.(*mux.Router)
}

// AddRoutes allows services to register themself in the webserver router and provide new endpoints.
func (ws *Server) AddRoutes(rs RoutedService) {
	rs.RegisterRoutes(ws.Router())
}

func (ws *Server) registerRoutes() {
	ws.Router().PathPrefix("/static").Handler(http.StripPrefix("/static/", http.FileServer(http.Dir(filepath.Join(ws.rootPath, "static")))))
	ws.Router().PathPrefix("/").HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		http.ServeFile(w, r, path.Join(ws.rootPath, "index.html"))
	})
}

// Start runs the web server and start listening for charsetnnections.
func (ws *Server) Start(wg *sync.WaitGroup) {
	ws.registerRoutes()

	isSSL := ws.ssl && fileExists("./cert/cert.pem") && fileExists("./cert/key.pem")
	if isSSL {
		log.Printf("https server started on :%d\n", ws.port)
		go func() {
			defer wg.Done()
			if err := ws.ListenAndServeTLS("./cert/cert.pem", "./cert/key.pem"); err != nil {
				log.Fatalf("ListenAndServeTLS: %v", err)
			}
		}()

		return
	}

	log.Printf("http server started on :%d\n", ws.port)
	go func() {
		defer wg.Done()
		if err := ws.ListenAndServe(); err != http.ErrServerClosed {
			log.Fatalf("ListenAndServe: %v", err)
		}
	}()
}

func (ws *Server) Shutdown() error {
	return ws.Close()
}

// fileExists returns true if a file exists at the path.
func fileExists(path string) bool {
	_, err := os.Stat(path)
	if os.IsNotExist(err) {
		return false
	}

	return err == nil
}
