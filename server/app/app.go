package app

import (
	"github.com/mattermost/mattermost-octo-tasks/server/services/config"
	"github.com/mattermost/mattermost-octo-tasks/server/services/store"
	"github.com/mattermost/mattermost-octo-tasks/server/ws"
	"github.com/mattermost/mattermost-server/v5/services/filesstore"
)

type App struct {
	config       *config.Configuration
	store        store.Store
	wsServer     *ws.Server
	filesBackend filesstore.FileBackend
}

func New(config *config.Configuration, store store.Store, wsServer *ws.Server, filesBackend filesstore.FileBackend) *App {
	return &App{config: config, store: store, wsServer: wsServer, filesBackend: filesBackend}
}
