package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sync"

	"github.com/mattermost/focalboard/server/server"
	"github.com/mattermost/focalboard/server/services/config"
	"github.com/mattermost/focalboard/server/ws"
	"github.com/mattermost/mattermost-server/v5/model"
	"github.com/mattermost/mattermost-server/v5/plugin"
)

// Plugin implements the interface expected by the Mattermost server to communicate between the server and plugin processes.
type Plugin struct {
	plugin.MattermostPlugin

	// configurationLock synchronizes access to the configuration.
	configurationLock sync.RWMutex

	// configuration is the active plugin configuration. Consult getConfiguration and
	// setConfiguration for usage.
	configuration *configuration

	server *server.Server
}

func (p *Plugin) OnActivate() error {
	mmconfig := p.API.GetUnsanitizedConfig()
	server, err := server.New(&config.Configuration{
		ServerRoot:              *mmconfig.ServiceSettings.SiteURL + "/plugins/focalboard",
		Port:                    0,
		DBType:                  *mmconfig.SqlSettings.DriverName,
		DBConfigString:          *mmconfig.SqlSettings.DataSource,
		DBTablePrefix:           "focalboard_",
		UseSSL:                  false,
		SecureCookie:            true,
		WebPath:                 "./plugins/focalboard/pack",
		FilesPath:               "./focalboard_files",
		Telemetry:               true,
		WebhookUpdate:           []string{},
		SessionExpireTime:       2592000,
		SessionRefreshTime:      18000,
		LocalOnly:               false,
		EnableLocalMode:         false,
		LocalModeSocketLocation: "",
		AuthMode:                "mattermost",
	}, "")
	if err != nil {
		fmt.Println("ERROR INITIALIZING THE SERVER", err)
		return err
	}
	p.server = server
	p.server.PublishClusterEvent = func(msg ws.UpdateMsg) {
		data, err := json.Marshal(msg)
		if err != nil {
			return
		}

		p.API.PublishPluginClusterEvent(model.PluginClusterEvent{
			Id:   "websocket_event",
			Data: data,
		}, model.PluginClusterEventSendOptions{
			SendType: model.PluginClusterEventSendTypeReliable,
		})
	}
	return server.Start()
}

func (p *Plugin) OnPluginClusterEvent(c *plugin.Context, ev model.PluginClusterEvent) {
	if ev.Id == "websocket_event" {
		var msg ws.UpdateMsg
		json.Unmarshal(ev.Data, &msg)
	}
}

func (p *Plugin) OnDeactivate() error {
	return p.server.Shutdown()
}

// ServeHTTP demonstrates a plugin that handles HTTP requests by greeting the world.
func (p *Plugin) ServeHTTP(c *plugin.Context, w http.ResponseWriter, r *http.Request) {
	router := p.server.GetRootRouter()
	router.ServeHTTP(w, r)
}

// See https://developers.mattermost.com/extend/plugins/server/reference/
