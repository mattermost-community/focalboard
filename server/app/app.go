package app

import (
	"github.com/mattermost/focalboard/server/auth"
	"github.com/mattermost/focalboard/server/services/config"
	"github.com/mattermost/focalboard/server/services/metrics"
	"github.com/mattermost/focalboard/server/services/notify"
	"github.com/mattermost/focalboard/server/services/store"
	"github.com/mattermost/focalboard/server/services/webhook"
	"github.com/mattermost/focalboard/server/ws"

	"github.com/mattermost/mattermost-server/v6/shared/mlog"

	"github.com/mattermost/mattermost-server/v6/shared/filestore"
)

type Services struct {
	Auth             *auth.Auth
	Store            store.Store
	FilesBackend     filestore.FileBackend
	Webhook          *webhook.Client
	Metrics          *metrics.Metrics
	Notifications    *notify.Service
	Logger           *mlog.Logger
	SkipTemplateInit bool
}

type App struct {
	config        *config.Configuration
	store         store.Store
	auth          *auth.Auth
	wsAdapter     ws.Adapter
	filesBackend  filestore.FileBackend
	webhook       *webhook.Client
	metrics       *metrics.Metrics
	notifications *notify.Service
	logger        *mlog.Logger
}

func (a *App) SetConfig(config *config.Configuration) {
	a.config = config
}

func New(config *config.Configuration, wsAdapter ws.Adapter, services Services) *App {
	app := &App{
		config:        config,
		store:         services.Store,
		auth:          services.Auth,
		wsAdapter:     wsAdapter,
		filesBackend:  services.FilesBackend,
		webhook:       services.Webhook,
		metrics:       services.Metrics,
		notifications: services.Notifications,
		logger:        services.Logger,
	}
	app.initialize(services.SkipTemplateInit)
	return app
}
