package prometheus

import (
	"net/http"

	"github.com/pkg/errors"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

// Service prometheus to run the server
type Service struct {
	*http.Server
}

// New Factory method to create a new prometheus server
func New(address string) *Service {
	return &Service{
		&http.Server{
			Addr:    address,
			Handler: promhttp.Handler(),
		},
	}
}

// Run will start the prometheus server
func (h *Service) Run() error {
	return errors.Wrap(h.Server.ListenAndServe(), "prometheus ListenAndServe")
}

// Shutdown will shutdown the prometheus server
func (h *Service) Shutdown() error {
	return errors.Wrap(h.Server.Close(), "prometheus Close")
}
