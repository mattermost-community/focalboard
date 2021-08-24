package main

import (
	"fmt"
	"net/http"
	"path"
	"sync"

	"github.com/mattermost/focalboard/server/server"
	"github.com/mattermost/focalboard/server/services/config"
	"github.com/mattermost/focalboard/server/services/store"
	"github.com/mattermost/focalboard/server/services/store/mattermostauthlayer"
	"github.com/mattermost/focalboard/server/services/store/sqlstore"

	pluginapi "github.com/mattermost/mattermost-plugin-api"

	"github.com/mattermost/mattermost-server/v6/model"
	"github.com/mattermost/mattermost-server/v6/plugin"
	"github.com/mattermost/mattermost-server/v6/shared/mlog"
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
	err := h.API.PublishPluginClusterEvent(model.PluginClusterEvent{
		Id:   "websocket_event",
		Data: data,
	}, model.PluginClusterEventSendOptions{
		SendType: model.PluginClusterEventSendTypeReliable,
	})

	if err != nil {
		h.API.LogError("Error sending websocket message", map[string]interface{}{"err": err})
	}
}

func (h *WSHub) SetReceiveWSMessage(handler func(data []byte)) {
	h.handleWSMessage = handler
}

func (p *Plugin) OnActivate() error {
	mmconfig := p.API.GetUnsanitizedConfig()
	filesS3Config := config.AmazonS3Config{}
	if mmconfig.FileSettings.AmazonS3AccessKeyId != nil {
		filesS3Config.AccessKeyID = *mmconfig.FileSettings.AmazonS3AccessKeyId
	}
	if mmconfig.FileSettings.AmazonS3SecretAccessKey != nil {
		filesS3Config.SecretAccessKey = *mmconfig.FileSettings.AmazonS3SecretAccessKey
	}
	if mmconfig.FileSettings.AmazonS3Bucket != nil {
		filesS3Config.Bucket = *mmconfig.FileSettings.AmazonS3Bucket
	}
	if mmconfig.FileSettings.AmazonS3PathPrefix != nil {
		filesS3Config.PathPrefix = *mmconfig.FileSettings.AmazonS3PathPrefix
	}
	if mmconfig.FileSettings.AmazonS3Region != nil {
		filesS3Config.Region = *mmconfig.FileSettings.AmazonS3Region
	}
	if mmconfig.FileSettings.AmazonS3Endpoint != nil {
		filesS3Config.Endpoint = *mmconfig.FileSettings.AmazonS3Endpoint
	}
	if mmconfig.FileSettings.AmazonS3SSL != nil {
		filesS3Config.SSL = *mmconfig.FileSettings.AmazonS3SSL
	}
	if mmconfig.FileSettings.AmazonS3SignV2 != nil {
		filesS3Config.SignV2 = *mmconfig.FileSettings.AmazonS3SignV2
	}
	if mmconfig.FileSettings.AmazonS3SSE != nil {
		filesS3Config.SSE = *mmconfig.FileSettings.AmazonS3SSE
	}
	if mmconfig.FileSettings.AmazonS3Trace != nil {
		filesS3Config.Trace = *mmconfig.FileSettings.AmazonS3Trace
	}

	logger, _ := mlog.NewLogger()
	cfgJSON := defaultLoggingConfig()
	err := logger.Configure("", cfgJSON)
	if err != nil {
		return err
	}

	client := pluginapi.NewClient(p.API, p.Driver)
	sqlDB, err := client.Store.GetMasterDB()
	if err != nil {
		return fmt.Errorf("error initializing the DB: %w", err)
	}

	baseURL := ""
	if mmconfig.ServiceSettings.SiteURL != nil {
		baseURL = *mmconfig.ServiceSettings.SiteURL
	}

	cfg := &config.Configuration{
		ServerRoot:              baseURL + "/plugins/focalboard",
		Port:                    -1,
		DBType:                  *mmconfig.SqlSettings.DriverName,
		DBConfigString:          *mmconfig.SqlSettings.DataSource,
		DBTablePrefix:           "focalboard_",
		UseSSL:                  false,
		SecureCookie:            true,
		WebPath:                 path.Join(*mmconfig.PluginSettings.Directory, "focalboard", "pack"),
		FilesDriver:             *mmconfig.FileSettings.DriverName,
		FilesPath:               *mmconfig.FileSettings.Directory,
		FilesS3Config:           filesS3Config,
		Telemetry:               true,
		WebhookUpdate:           []string{},
		SessionExpireTime:       2592000,
		SessionRefreshTime:      18000,
		LocalOnly:               false,
		EnableLocalMode:         false,
		LocalModeSocketLocation: "",
		AuthMode:                "mattermost",
	}
	var db store.Store
	db, err = sqlstore.New(cfg.DBType, cfg.DBConfigString, cfg.DBTablePrefix, logger, sqlDB)
	if err != nil {
		return fmt.Errorf("error initializing the DB: %w", err)
	}
	if cfg.AuthMode == server.MattermostAuthMod {
		layeredStore, err2 := mattermostauthlayer.New(cfg.DBType, sqlDB, db, logger)
		if err2 != nil {
			return fmt.Errorf("error initializing the DB: %w", err2)
		}
		db = layeredStore
	}

	serverID := client.System.GetDiagnosticID()

	server, err := server.New(cfg, "", db, logger, serverID)
	if err != nil {
		fmt.Println("ERROR INITIALIZING THE SERVER", err)
		return err
	}

	p.wsHub = &WSHub{API: p.API}
	server.SetWSHub(p.wsHub)
	p.server = server
	return server.Start()
}

func (p *Plugin) OnPluginClusterEvent(_ *plugin.Context, ev model.PluginClusterEvent) {
	if ev.Id == "websocket_event" {
		p.wsHub.handleWSMessage(ev.Data)
	}
}

func (p *Plugin) OnDeactivate() error {
	return p.server.Shutdown()
}

// ServeHTTP demonstrates a plugin that handles HTTP requests by greeting the world.
func (p *Plugin) ServeHTTP(_ *plugin.Context, w http.ResponseWriter, r *http.Request) {
	router := p.server.GetRootRouter()
	router.ServeHTTP(w, r)
}

func defaultLoggingConfig() string {
	return `
	{
		"def": {
			"type": "console",
			"options": {
				"out": "stdout"
			},
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
		}
	}`
}
