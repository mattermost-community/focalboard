// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package telemetry

import (
	"log"
	"os"
	"strings"
	"time"

	"github.com/mattermost/focalboard/server/services/scheduler"
	rudder "github.com/rudderlabs/analytics-go"
)

const (
	rudderKey                  = "placeholder_rudder_key"
	rudderDataplaneURL         = "placeholder_rudder_dataplane_url"
	timeBetweenTelemetryChecks = 10 * time.Minute
)

type Tracker func() map[string]interface{}

type Service struct {
	trackers                   map[string]Tracker
	log                        *log.Logger
	rudderClient               rudder.Client
	telemetryID                string
	timestampLastTelemetrySent time.Time
}

type RudderConfig struct {
	RudderKey    string
	DataplaneURL string
}

func New(telemetryID string, log *log.Logger) *Service {
	service := &Service{
		log:         log,
		telemetryID: telemetryID,
		trackers:    map[string]Tracker{},
	}

	return service
}

func (ts *Service) RegisterTracker(name string, tracker Tracker) {
	ts.trackers[name] = tracker
}

func (ts *Service) getRudderConfig() RudderConfig {
	if !strings.Contains(rudderKey, "placeholder") && !strings.Contains(rudderDataplaneURL, "placeholder") {
		return RudderConfig{rudderKey, rudderDataplaneURL}
	} else if os.Getenv("RUDDER_KEY") != "" && os.Getenv("RUDDER_DATAPLANE_URL") != "" {
		return RudderConfig{os.Getenv("RUDDER_KEY"), os.Getenv("RUDDER_DATAPLANE_URL")}
	} else {
		return RudderConfig{}
	}
}

func (ts *Service) sendDailyTelemetry(override bool) {
	config := ts.getRudderConfig()
	if (config.DataplaneURL != "" && config.RudderKey != "") || override {
		ts.initRudder(config.DataplaneURL, config.RudderKey)

		for name, tracker := range ts.trackers {
			ts.sendTelemetry(name, tracker())
		}
	}
}

func (ts *Service) sendTelemetry(event string, properties map[string]interface{}) {
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

func (ts *Service) initRudder(endpoint string, rudderKey string) {
	if ts.rudderClient == nil {
		config := rudder.Config{}
		config.Logger = rudder.StdLogger(ts.log)
		config.Endpoint = endpoint
		// For testing
		if endpoint != rudderDataplaneURL {
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

func (ts *Service) doTelemetryIfNeeded(firstRun time.Time) {
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

func (ts *Service) RunTelemetryJob(firstRun int64) {
	// Send on boot
	ts.doTelemetry()
	scheduler.CreateRecurringTask("Telemetry", func() {
		ts.doTelemetryIfNeeded(time.Unix(0, firstRun*int64(time.Millisecond)))
	}, timeBetweenTelemetryChecks)
}

func (ts *Service) doTelemetry() {
	ts.timestampLastTelemetrySent = time.Now()
	ts.sendDailyTelemetry(false)
}

// Shutdown closes the telemetry client.
func (ts *Service) Shutdown() error {
	if ts.rudderClient != nil {
		return ts.rudderClient.Close()
	}

	return nil
}
