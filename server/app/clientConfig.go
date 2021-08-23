package app

import (
	"github.com/mattermost/focalboard/server/model"
)

func (a *App) GetClientConfig() *model.ClientConfig {
	return &model.ClientConfig{
		Telemetry:   a.config.Telemetry,
		TelemetryID: a.config.TelemetryID,
	}
}
