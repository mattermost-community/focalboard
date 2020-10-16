package server

import (
	"errors"
	"log"
	"os"
	"os/signal"

	"github.com/mattermost/mattermost-octo-tasks/server/api"
	"github.com/mattermost/mattermost-octo-tasks/server/app"
	"github.com/mattermost/mattermost-octo-tasks/server/services/config"
	"github.com/mattermost/mattermost-octo-tasks/server/services/store"
	"github.com/mattermost/mattermost-octo-tasks/server/services/store/sqlstore"
	"github.com/mattermost/mattermost-octo-tasks/server/web"
	"github.com/mattermost/mattermost-octo-tasks/server/ws"
	"github.com/mattermost/mattermost-server/v5/model"
	"github.com/mattermost/mattermost-server/v5/services/filesstore"
)

type Server struct {
	config       *config.Configuration
	wsServer     *ws.WSServer
	webServer    *web.WebServer
	store        store.Store
	filesBackend filesstore.FileBackend
}

func New(config *config.Configuration) (*Server, error) {
	store, err := sqlstore.NewSQLStore(config.DBType, config.DBConfigString)
	if err != nil {
		log.Fatal("Unable to start the database", err)
		return nil, err
	}

	wsServer := ws.NewWSServer()

	filesBackendSettings := model.FileSettings{}
	filesBackendSettings.SetDefaults(false)
	filesBackendSettings.Directory = &config.FilesPath
	filesBackend, appErr := filesstore.NewFileBackend(&filesBackendSettings, false)
	if appErr != nil {
		log.Fatal("Unable to initialize the files storage")
		return nil, errors.New("unable to initialize the files storage")
	}

	appBuilder := func() *app.App { return app.New(config, store, wsServer, filesBackend) }

	webServer := web.NewWebServer(config.WebPath, config.Port, config.UseSSL)
	api := api.NewAPI(appBuilder)
	webServer.AddRoutes(wsServer)
	webServer.AddRoutes(api)

	// Ctrl+C handling
	handler := make(chan os.Signal, 1)
	signal.Notify(handler, os.Interrupt)
	go func() {
		for sig := range handler {
			// sig is a ^C, handle it
			if sig == os.Interrupt {
				os.Exit(1)
				break
			}
		}
	}()

	return &Server{
		config:    config,
		wsServer:  wsServer,
		webServer: webServer,
		store:     store,
	}, nil
}

func (s *Server) Start() error {
	if err := s.webServer.Start(); err != nil {
		return err
	}
	return nil
}
