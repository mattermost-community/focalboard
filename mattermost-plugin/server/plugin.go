// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package main

import (
	"fmt"
	"net/http"

	"github.com/mattermost/focalboard/mattermost-plugin/server/boards"

	pluginapi "github.com/mattermost/mattermost-plugin-api"

	mmModel "github.com/mattermost/mattermost-server/v6/model"
	"github.com/mattermost/mattermost-server/v6/plugin"
	"github.com/mattermost/mattermost-server/v6/shared/mlog"
)

// Plugin implements the interface expected by the Mattermost server to communicate between the server and plugin processes.
type Plugin struct {
	plugin.MattermostPlugin

	boardsApp *boards.BoardsApp
}

func (p *Plugin) OnActivate() error {
	client := pluginapi.NewClient(p.API, p.Driver)

	logger, _ := mlog.NewLogger()
	pluginTargetFactory := newPluginTargetFactory(&client.Log)
	factories := &mlog.Factories{
		TargetFactory: pluginTargetFactory.createTarget,
	}
	cfgJSON := defaultLoggingConfig()
	err := logger.Configure("", cfgJSON, factories)
	if err != nil {
		return err
	}

	adapter := newServiceAPIAdapter(p.API, client.Store, logger)

	boardsApp, err := boards.NewBoardsApp(adapter)
	if err != nil {
		return fmt.Errorf("Cannot activate plugin: %w", err)
	}

	p.boardsApp = boardsApp
	return nil
}

// OnConfigurationChange is invoked when configuration changes may have been made.
func (p *Plugin) OnConfigurationChange() error {
	return p.boardsApp.OnConfigurationChange()
}

func (p *Plugin) OnWebSocketConnect(webConnID, userID string) {
	p.boardsApp.OnWebSocketConnect(webConnID, userID)
}

func (p *Plugin) OnWebSocketDisconnect(webConnID, userID string) {
	p.boardsApp.OnWebSocketDisconnect(webConnID, userID)
}

func (p *Plugin) WebSocketMessageHasBeenPosted(webConnID, userID string, req *mmModel.WebSocketRequest) {
	p.boardsApp.WebSocketMessageHasBeenPosted(webConnID, userID, req)
}

func (p *Plugin) OnDeactivate() error {
	return p.boardsApp.OnDeactivate()
}

func (p *Plugin) OnPluginClusterEvent(ctx *plugin.Context, ev mmModel.PluginClusterEvent) {
	p.boardsApp.OnPluginClusterEvent(ctx, ev)
}

func (p *Plugin) MessageWillBePosted(ctx *plugin.Context, post *mmModel.Post) (*mmModel.Post, string) {
	return p.boardsApp.MessageWillBePosted(ctx, post)
}

func (p *Plugin) MessageWillBeUpdated(ctx *plugin.Context, newPost, oldPost *mmModel.Post) (*mmModel.Post, string) {
	return p.boardsApp.MessageWillBeUpdated(ctx, newPost, oldPost)
}

func (p *Plugin) OnCloudLimitsUpdated(limits *mmModel.ProductLimits) {
	p.boardsApp.OnCloudLimitsUpdated(limits)
}

func (p *Plugin) RunDataRetention(nowTime, batchSize int64) (int64, error) {
	return p.boardsApp.RunDataRetention(nowTime, batchSize)
}

// ServeHTTP demonstrates a plugin that handles HTTP requests by greeting the world.
func (p *Plugin) ServeHTTP(ctx *plugin.Context, w http.ResponseWriter, r *http.Request) {
	p.boardsApp.ServeHTTP(ctx, w, r)
}

func defaultLoggingConfig() string {
	return `
	{
		"def": {
			"type": "focalboard_plugin_adapter",
			"options": {},
			"format": "plain",
			"format_options": {
				"delim": " ",
				"min_level_len": 0,
				"min_msg_len": 0,
				"enable_color": false,
				"enable_caller": true
			},
			"levels": [
				{"id": 5, "name": "debug"},
				{"id": 4, "name": "info", "color": 36},
				{"id": 3, "name": "warn"},
				{"id": 2, "name": "error", "color": 31},
				{"id": 1, "name": "fatal", "stacktrace": true},
				{"id": 0, "name": "panic", "stacktrace": true}
			]
		},
		"errors_file": {
			"Type": "file",
			"Format": "plain",
			"Levels": [
				{"ID": 2, "Name": "error", "Stacktrace": true}
			],
			"Options": {
				"Compress": true,
				"Filename": "focalboard_errors.log",
				"MaxAgeDays": 0,
				"MaxBackups": 5,
				"MaxSizeMB": 10
			},
			"MaxQueueSize": 1000
		}
	}`
}
