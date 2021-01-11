package server

import (
	"errors"
	"log"
	"os"
	"os/signal"
	"runtime"
	"time"

	"github.com/google/uuid"
	"go.uber.org/zap"

	"github.com/mattermost/mattermost-octo-tasks/server/api"
	"github.com/mattermost/mattermost-octo-tasks/server/app"
	"github.com/mattermost/mattermost-octo-tasks/server/services/config"
	"github.com/mattermost/mattermost-octo-tasks/server/services/scheduler"
	"github.com/mattermost/mattermost-octo-tasks/server/services/store"
	"github.com/mattermost/mattermost-octo-tasks/server/services/store/sqlstore"
	"github.com/mattermost/mattermost-octo-tasks/server/services/telemetry"
	"github.com/mattermost/mattermost-octo-tasks/server/services/webhook"
	"github.com/mattermost/mattermost-octo-tasks/server/web"
	"github.com/mattermost/mattermost-octo-tasks/server/ws"
	"github.com/mattermost/mattermost-server/v5/model"
	"github.com/mattermost/mattermost-server/v5/services/filesstore"
)

const currentVersion = "0.0.1"

type Server struct {
	config              *config.Configuration
	wsServer            *ws.Server
	webServer           *web.Server
	store               store.Store
	filesBackend        filesstore.FileBackend
	telemetry           *telemetry.Service
	logger              *zap.Logger
	cleanUpSessionsTask *scheduler.ScheduledTask
}

func New(cfg *config.Configuration, singleUser bool) (*Server, error) {
	logger, err := zap.NewProduction()
	if err != nil {
		return nil, err
	}

	store, err := sqlstore.New(cfg.DBType, cfg.DBConfigString)
	if err != nil {
		log.Fatal("Unable to start the database", err)

		return nil, err
	}

	wsServer := ws.NewServer()

	filesBackendSettings := model.FileSettings{}
	filesBackendSettings.SetDefaults(false)
	filesBackendSettings.Directory = &cfg.FilesPath
	filesBackend, appErr := filesstore.NewFileBackend(&filesBackendSettings, false)
	if appErr != nil {
		log.Fatal("Unable to initialize the files storage")

		return nil, errors.New("unable to initialize the files storage")
	}

	webhookClient := webhook.NewClient(cfg)

	appBuilder := func() *app.App { return app.New(cfg, store, wsServer, filesBackend, webhookClient) }
	api := api.NewAPI(appBuilder, singleUser)

	webServer := web.NewServer(cfg.WebPath, cfg.Port, cfg.UseSSL)
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

	// Init telemetry
	settings, err := store.GetSystemSettings()
	if err != nil {
		return nil, err
	}

	telemetryID := settings["TelemetryID"]
	if len(telemetryID) == 0 {
		telemetryID = uuid.New().String()
		err := store.SetSystemSetting("TelemetryID", uuid.New().String())
		if err != nil {
			return nil, err
		}
	}

	telemetryService := telemetry.New(telemetryID, zap.NewStdLog(logger))
	telemetryService.RegisterTracker("server", func() map[string]interface{} {
		return map[string]interface{}{
			"version":          currentVersion,
			"operating_system": runtime.GOOS,
		}
	})
	telemetryService.RegisterTracker("config", func() map[string]interface{} {
		return map[string]interface{}{
			"serverRoot": cfg.ServerRoot == config.DefaultServerRoot,
			"port":       cfg.Port == config.DefaultPort,
			"useSSL":     cfg.UseSSL,
			"dbType":     cfg.DBType,
		}
	})

	return &Server{
		config:       cfg,
		wsServer:     wsServer,
		webServer:    webServer,
		store:        store,
		filesBackend: filesBackend,
		telemetry:    telemetryService,
		logger:       logger,
	}, nil
}

func (s *Server) Start() error {
	if err := s.webServer.Start(); err != nil {
		return err
	}
	s.cleanUpSessionsTask = scheduler.CreateRecurringTask("cleanUpSessions", func() {
		if err := s.store.CleanUpSessions(s.config.SessionExpireTime); err != nil {
			s.logger.Error("Unable to clean up the sessions", zap.Error(err))
		}
	}, 10*time.Minute)

	return nil
}

func (s *Server) Shutdown() error {
	if err := s.webServer.Shutdown(); err != nil {
		return err
	}

	if s.cleanUpSessionsTask != nil {
		s.cleanUpSessionsTask.Cancel()
	}

	return s.store.Shutdown()
}

func (s *Server) Config() *config.Configuration {
	return s.config
}
