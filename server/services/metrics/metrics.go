package metrics

import (
	"os"

	"github.com/prometheus/client_golang/prometheus"
)

const (
	MetricsNamespace           = "focalboard"
	MetricsSubsystemBlocks     = "blocks"
	MetricsSubsystemWorkspaces = "workspaces"
	MetricsSubsystemSystem     = "system"

	MetricsCloudInstallationLabel = "installationId"
)

type InstanceInfo struct {
	Version        string
	BuildNum       string
	Edition        string
	InstallationID string
}

// Metrics used to instrumentate metrics in prometheus
type Metrics struct {
	registry *prometheus.Registry

	instance  *prometheus.GaugeVec
	startTime prometheus.Gauge

	loginCount     prometheus.Counter
	loginFailCount prometheus.Counter

	blocksInsertedCount *prometheus.CounterVec
	blocksUpdatedCount  *prometheus.CounterVec
	blocksDeletedCount  *prometheus.CounterVec

	workspaceAdded   prometheus.Counter
	workspaceRemoved prometheus.Counter

	blockCount     *prometheus.GaugeVec
	workspaceCount prometheus.Gauge

	blockLastActivity *prometheus.GaugeVec
}

// NewMetrics Factory method to create a new instrumentator
func NewMetrics(info InstanceInfo) *Metrics {
	m := &Metrics{}

	m.registry = prometheus.NewRegistry()
	options := prometheus.ProcessCollectorOpts{
		Namespace: MetricsNamespace,
	}
	m.registry.MustRegister(prometheus.NewProcessCollector(options))
	m.registry.MustRegister(prometheus.NewGoCollector())

	additionalLabels := map[string]string{}
	if info.InstallationID != "" {
		additionalLabels[MetricsCloudInstallationLabel] = os.Getenv("MM_CLOUD_INSTALLATION_ID")
	}

	m.loginCount = prometheus.NewCounter(prometheus.CounterOpts{
		Namespace:   MetricsNamespace,
		Subsystem:   MetricsSubsystemSystem,
		Name:        "login_total",
		Help:        "Total number of logins.",
		ConstLabels: additionalLabels,
	})
	m.registry.MustRegister(m.loginCount)

	m.loginFailCount = prometheus.NewCounter(prometheus.CounterOpts{
		Namespace:   MetricsNamespace,
		Subsystem:   MetricsSubsystemSystem,
		Name:        "login_fail_total",
		Help:        "Total number of failed logins.",
		ConstLabels: additionalLabels,
	})
	m.registry.MustRegister(m.loginFailCount)

	m.instance = prometheus.NewGaugeVec(prometheus.GaugeOpts{
		Namespace:   MetricsNamespace,
		Subsystem:   MetricsSubsystemSystem,
		Name:        "focalboard_instance_info",
		Help:        "Instance information for Focalboard.",
		ConstLabels: additionalLabels,
	}, []string{"Version", "BuildNum", "Edition"})
	m.registry.MustRegister(m.instance)
	m.instance.WithLabelValues(info.Version, info.BuildNum, info.Edition).Set(1)

	m.startTime = prometheus.NewGauge(prometheus.GaugeOpts{
		Namespace:   MetricsNamespace,
		Subsystem:   MetricsSubsystemSystem,
		Name:        "server_start_time",
		Help:        "The time the server started.",
		ConstLabels: additionalLabels,
	})
	m.startTime.SetToCurrentTime()
	m.registry.MustRegister(m.startTime)

	m.blocksInsertedCount = prometheus.NewCounterVec(prometheus.CounterOpts{
		Namespace:   MetricsNamespace,
		Subsystem:   MetricsSubsystemBlocks,
		Name:        "block_inserted_total",
		Help:        "Total number of blocks inserted.",
		ConstLabels: additionalLabels,
	}, []string{"BlockType"})
	m.registry.MustRegister(m.blocksInsertedCount)

	m.blocksUpdatedCount = prometheus.NewCounterVec(prometheus.CounterOpts{
		Namespace:   MetricsNamespace,
		Subsystem:   MetricsSubsystemBlocks,
		Name:        "block_updated_total",
		Help:        "Total number of blocks updated.",
		ConstLabels: additionalLabels,
	}, []string{"BlockType"})
	m.registry.MustRegister(m.blocksUpdatedCount)

	m.blocksDeletedCount = prometheus.NewCounterVec(prometheus.CounterOpts{
		Namespace:   MetricsNamespace,
		Subsystem:   MetricsSubsystemBlocks,
		Name:        "block_deleted_total",
		Help:        "Total number of blocks deleted.",
		ConstLabels: additionalLabels,
	}, []string{"BlockType"})
	m.registry.MustRegister(m.blocksDeletedCount)

	m.workspaceAdded = prometheus.NewCounter(prometheus.CounterOpts{
		Namespace:   MetricsNamespace,
		Subsystem:   MetricsSubsystemWorkspaces,
		Name:        "workspace_added_total",
		Help:        "Total number of workspaces added.",
		ConstLabels: additionalLabels,
	})
	m.registry.MustRegister(m.workspaceAdded)

	m.workspaceRemoved = prometheus.NewCounter(prometheus.CounterOpts{
		Namespace:   MetricsNamespace,
		Subsystem:   MetricsSubsystemWorkspaces,
		Name:        "workspace_removed_total",
		Help:        "Total number of workspaces removed.",
		ConstLabels: additionalLabels,
	})
	m.registry.MustRegister(m.workspaceRemoved)

	m.blockCount = prometheus.NewGaugeVec(prometheus.GaugeOpts{
		Namespace:   MetricsNamespace,
		Subsystem:   MetricsSubsystemBlocks,
		Name:        "blocks_total",
		Help:        "Total number of blocks.",
		ConstLabels: additionalLabels,
	}, []string{"BlockType"})
	m.registry.MustRegister(m.blockCount)

	m.workspaceCount = prometheus.NewGauge(prometheus.GaugeOpts{
		Namespace:   MetricsNamespace,
		Subsystem:   MetricsSubsystemWorkspaces,
		Name:        "workspaces_total",
		Help:        "Total number of workspaces.",
		ConstLabels: additionalLabels,
	})
	m.registry.MustRegister(m.workspaceCount)

	m.blockLastActivity = prometheus.NewGaugeVec(prometheus.GaugeOpts{
		Namespace:   MetricsNamespace,
		Subsystem:   MetricsSubsystemBlocks,
		Name:        "blocks_last_activity",
		Help:        "Time of last block insert, update, delete.",
		ConstLabels: additionalLabels,
	}, []string{"BlockType"})
	m.registry.MustRegister(m.blockLastActivity)

	return m
}

func (m *Metrics) IncrementLoginCount(num int) {
	m.loginCount.Add(float64(num))
}

func (m *Metrics) IncrementLoginFailCount(num int) {
	m.loginFailCount.Add(float64(num))
}

func (m *Metrics) IncrementBlocksInserted(blockType string, num int) {
	m.blocksInsertedCount.WithLabelValues(blockType).Add(float64(num))
}

func (m *Metrics) IncrementBlocksUpdated(blockType string, num int) {
	m.blocksUpdatedCount.WithLabelValues(blockType).Add(float64(num))
}

func (m *Metrics) IncrementBlocksDeleted(blockType string, num int) {
	m.blocksDeletedCount.WithLabelValues(blockType).Add(float64(num))
}

func (m *Metrics) IncrementWorkspaceAdded(num int) {
	m.workspaceAdded.Add(float64(num))
}

func (m *Metrics) IncrementWorkspaceRemoved(num int) {
	m.workspaceRemoved.Add(float64(num))
}

func (m *Metrics) ObserveBlockCount(blockType string, count int64) {
	m.blockCount.WithLabelValues(blockType).Set(float64(count))
}

func (m *Metrics) ObserveWorkspaceCount(count int64) {
	m.workspaceCount.Set(float64(count))
}

func (m *Metrics) ObserveBlockActivity(blockType string, count int64) {
	m.blockLastActivity.WithLabelValues(blockType).SetToCurrentTime()
}
