package model

// ClientConfig is the client configuration
// swagger:model
type ClientConfig struct {
	// Is telemetry enabled
	// required: true
	Telemetry bool `json:"telemetry"`

	// The telemetry ID
	// required: true
	TelemetryID string `json:"telemetryid"`

	// Is public shared boards enabled
	// required: true
	EnablePublicSharedBoards bool `json:"enablePublicSharedBoards"`

	// The server feature flags
	// required: true
	FeatureFlags map[string]string `json:"featureFlags"`
}
