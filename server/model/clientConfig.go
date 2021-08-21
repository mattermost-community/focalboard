package model

type ClientConfig struct {
	Telemetry   bool   `json:"telemetry"`
	TelemetryId string `json:"telemetryid"`
}
