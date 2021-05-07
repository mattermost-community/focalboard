package main

import (
	"fmt"
	"net/http"
	"sync"

	"github.com/mattermost/focalboard/server/server"
	"github.com/mattermost/focalboard/server/services/config"
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
	wsHub  *WSHub
}

type WSHub struct {
	API             plugin.API
	handleWSMessage func(data []byte)
}

func (h *WSHub) SendWSMessage(data []byte) {
	h.API.PublishPluginClusterEvent(model.PluginClusterEvent{
		Id:   "websocket_event",
		Data: data,
	}, model.PluginClusterEventSendOptions{
		SendType: model.PluginClusterEventSendTypeReliable,
	})
}

func (h *WSHub) SetReceiveWSMessage(handler func(data []byte)) {
	h.handleWSMessage = handler
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

	p.wsHub = &WSHub{API: p.API}
	server.SetWSHub(p.wsHub)
	p.server = server
	return server.Start()
}

func (p *Plugin) OnPluginClusterEvent(c *plugin.Context, ev model.PluginClusterEvent) {
	if ev.Id == "websocket_event" {
		p.wsHub.handleWSMessage(ev.Data)
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
