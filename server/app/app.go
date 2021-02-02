package app

import (
	"github.com/mattermost/focalboard/server/auth"
	"github.com/mattermost/focalboard/server/services/config"
	"github.com/mattermost/focalboard/server/services/store"
	"github.com/mattermost/focalboard/server/services/webhook"
	"github.com/mattermost/focalboard/server/ws"
	"github.com/mattermost/mattermost-server/v5/services/filesstore"
)

type App struct {
	config       *config.Configuration
	store        store.Store
	auth         *auth.Auth
	wsServer     *ws.Server
	filesBackend filesstore.FileBackend
	webhook      *webhook.Client
}

func New(
	config *config.Configuration,
	store store.Store,
	auth *auth.Auth,
	wsServer *ws.Server,
	filesBackend filesstore.FileBackend,
	webhook *webhook.Client,
) *App {
	return &App{
		config:       config,
		store:        store,
		auth:         auth,
		wsServer:     wsServer,
		filesBackend: filesBackend,
		webhook:      webhook,
	}
}
