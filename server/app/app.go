package app

import (
	"github.com/mattermost/focalboard/server/auth"
	"github.com/mattermost/focalboard/server/services/config"
	"github.com/mattermost/focalboard/server/services/mlog"
	"github.com/mattermost/focalboard/server/services/store"
	"github.com/mattermost/focalboard/server/services/webhook"
	"github.com/mattermost/focalboard/server/ws"

	"github.com/mattermost/mattermost-server/v5/shared/filestore"
)

type App struct {
	config       *config.Configuration
	store        store.Store
	auth         *auth.Auth
	wsServer     *ws.Server
	filesBackend filestore.FileBackend
	webhook      *webhook.Client
	logger       *mlog.Logger
}

func New(
	config *config.Configuration,
	store store.Store,
	auth *auth.Auth,
	wsServer *ws.Server,
	filesBackend filestore.FileBackend,
	webhook *webhook.Client,
	logger *mlog.Logger,
) *App {
	return &App{
		config:       config,
		store:        store,
		auth:         auth,
		wsServer:     wsServer,
		filesBackend: filesBackend,
		webhook:      webhook,
		logger:       logger,
	}
}
