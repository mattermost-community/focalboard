package prometheus

import (
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
)

// Instrumentor used to instrumentate metrics in prometheus
type Instrumentor struct {
	Version string
}

// NewInstrumentor Factory method to create a new instrumentator
func NewInstrumentor(version string) *Instrumentor {
	return &Instrumentor{
		Version: version,
	}
}

// ExposeBuildInfo exposes a gauge in prometheus for build info
func (i *Instrumentor) ExposeBuildInfo() {
	promauto.NewGaugeVec(prometheus.GaugeOpts{
		Name: "focalboard_build_info",
		Help: "Build information of Focalboard",
	}, []string{"Version"},
	).WithLabelValues(i.Version).Set(1)
}
