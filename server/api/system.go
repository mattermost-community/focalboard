package api

import (
	"net/http"

	"github.com/gorilla/mux"
)

func (a *API) registerSystemRoutes(r *mux.Router) {
	// System APIs
	r.HandleFunc("/hello", a.handleHello).Methods("GET")
}

func (a *API) handleHello(w http.ResponseWriter, r *http.Request) {
	// swagger:operation GET /hello hello
	//
	// Responds with `Hello` if the web service is running.
	//
	// ---
	// produces:
	// - text/plain
	// responses:
	//   '200':
	//     description: success
	stringResponse(w, "Hello")
}
