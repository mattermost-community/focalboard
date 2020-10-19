// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package telemetry

import (
	"log"
	"os"
	"strings"
	"time"

	"github.com/mattermost/mattermost-octo-tasks/server/services/scheduler"
	rudder "github.com/rudderlabs/analytics-go"
)

const (
	DAY_MILLISECONDS   = 24 * 60 * 60 * 1000
	MONTH_MILLISECONDS = 31 * DAY_MILLISECONDS

	RUDDER_KEY           = "placeholder_rudder_key"
	RUDDER_DATAPLANE_URL = "placeholder_rudder_dataplane_url"

	TRACK_CONFIG = "config"
)

type telemetryTracker func() map[string]interface{}

type TelemetryService struct {
	trackers                   map[string]telemetryTracker
	log                        *log.Logger
	rudderClient               rudder.Client
	telemetryID                string
	timestampLastTelemetrySent time.Time
}

type RudderConfig struct {
	RudderKey    string
	DataplaneUrl string
}

func New(telemetryID string, log *log.Logger) *TelemetryService {
	service := &TelemetryService{
		log:         log,
		telemetryID: telemetryID,
		trackers:    map[string]telemetryTracker{},
	}
	return service
}

func (ts *TelemetryService) RegisterTracker(name string, tracker telemetryTracker) {
	ts.trackers[name] = tracker
}

func (ts *TelemetryService) getRudderConfig() RudderConfig {
	if !strings.Contains(RUDDER_KEY, "placeholder") && !strings.Contains(RUDDER_DATAPLANE_URL, "placeholder") {
		return RudderConfig{RUDDER_KEY, RUDDER_DATAPLANE_URL}
	} else if os.Getenv("RUDDER_KEY") != "" && os.Getenv("RUDDER_DATAPLANE_URL") != "" {
		return RudderConfig{os.Getenv("RUDDER_KEY"), os.Getenv("RUDDER_DATAPLANE_URL")}
	} else {
		return RudderConfig{}
	}
}

func (ts *TelemetryService) sendDailyTelemetry(override bool) {
	config := ts.getRudderConfig()
	if (config.DataplaneUrl != "" && config.RudderKey != "") || override {
		ts.initRudder(config.DataplaneUrl, config.RudderKey)
		for name, tracker := range ts.trackers {
			ts.sendTelemetry(name, tracker())
		}
	}
}

func (ts *TelemetryService) sendTelemetry(event string, properties map[string]interface{}) {
	if ts.rudderClient != nil {
		var context *rudder.Context
		ts.rudderClient.Enqueue(rudder.Track{
			Event:      event,
			UserId:     ts.telemetryID,
			Properties: properties,
			Context:    context,
		})
	}
}

func (ts *TelemetryService) initRudder(endpoint string, rudderKey string) {
	if ts.rudderClient == nil {
		config := rudder.Config{}
		config.Logger = rudder.StdLogger(ts.log)
		config.Endpoint = endpoint
		// For testing
		if endpoint != RUDDER_DATAPLANE_URL {
			config.Verbose = true
			config.BatchSize = 1
		}
		client, err := rudder.NewWithConfig(rudderKey, endpoint, config)
		if err != nil {
			ts.log.Fatal("Failed to create Rudder instance")
			return
		}
		client.Enqueue(rudder.Identify{
			UserId: ts.telemetryID,
		})

		ts.rudderClient = client
	}
}

func (ts *TelemetryService) doTelemetryIfNeeded(firstRun time.Time) {
	hoursSinceFirstServerRun := time.Since(firstRun).Hours()
	// Send once every 10 minutes for the first hour
	// Send once every hour thereafter for the first 12 hours
	// Send at the 24 hour mark and every 24 hours after
	if hoursSinceFirstServerRun < 1 {
		ts.doTelemetry()
	} else if hoursSinceFirstServerRun <= 12 && time.Since(ts.timestampLastTelemetrySent) >= time.Hour {
		ts.doTelemetry()
	} else if hoursSinceFirstServerRun > 12 && time.Since(ts.timestampLastTelemetrySent) >= 24*time.Hour {
		ts.doTelemetry()
	}
}

func (ts *TelemetryService) RunTelemetryJob(firstRun int64) {
	// Send on boot
	ts.doTelemetry()
	scheduler.CreateRecurringTask("Telemetry", func() {
		ts.doTelemetryIfNeeded(time.Unix(0, firstRun*int64(time.Millisecond)))
	}, time.Minute*10)
}

func (ts *TelemetryService) doTelemetry() {
	ts.timestampLastTelemetrySent = time.Now()
	ts.sendDailyTelemetry(false)
}

// Shutdown closes the telemetry client.
func (ts *TelemetryService) Shutdown() error {
	if ts.rudderClient != nil {
		return ts.rudderClient.Close()
	}
	return nil
}
