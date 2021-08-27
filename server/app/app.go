package app

import (
	"github.com/mattermost/focalboard/server/auth"
	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/services/config"
	"github.com/mattermost/focalboard/server/services/metrics"
	"github.com/mattermost/focalboard/server/services/notify"
	"github.com/mattermost/focalboard/server/services/store"
	"github.com/mattermost/focalboard/server/services/webhook"

	"github.com/mattermost/mattermost-server/v6/shared/mlog"

	"github.com/mattermost/mattermost-server/v6/shared/filestore"
)

type WebsocketServer interface {
	BroadcastBlockChange(workspaceID string, block model.Block)
	BroadcastBlockDelete(workspaceID, blockID, parentID string)
}

type Services struct {
	Auth          *auth.Auth
	Store         store.Store
	FilesBackend  filestore.FileBackend
	Webhook       *webhook.Client
	Metrics       *metrics.Metrics
	Notifications *notify.Service
	Logger        *mlog.Logger
}

type App struct {
	config        *config.Configuration
	store         store.Store
	auth          *auth.Auth
	wsServer      WebsocketServer
	filesBackend  filestore.FileBackend
	webhook       *webhook.Client
	metrics       *metrics.Metrics
	notifications *notify.Service
	logger        *mlog.Logger
}

func New(config *config.Configuration, wsServer WebsocketServer, services Services) *App {
	return &App{
		config:        config,
		store:         services.Store,
		auth:          services.Auth,
		wsServer:      wsServer,
		filesBackend:  services.FilesBackend,
		webhook:       services.Webhook,
		metrics:       services.Metrics,
		notifications: services.Notifications,
		logger:        services.Logger,
	}
}
