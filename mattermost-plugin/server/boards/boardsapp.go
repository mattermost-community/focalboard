// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package boards

import (
	"fmt"
	"net/http"
	"sync"

	"github.com/mattermost/focalboard/server/auth"
	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/server"
	"github.com/mattermost/focalboard/server/services/notify"
	"github.com/mattermost/focalboard/server/services/permissions/mmpermissions"
	"github.com/mattermost/focalboard/server/services/store"
	"github.com/mattermost/focalboard/server/services/store/mattermostauthlayer"
	"github.com/mattermost/focalboard/server/services/store/sqlstore"
	"github.com/mattermost/focalboard/server/ws"

	mm_model "github.com/mattermost/mattermost-server/v6/model"
	"github.com/mattermost/mattermost-server/v6/plugin"
	"github.com/mattermost/mattermost-server/v6/shared/mlog"

	"github.com/mattermost/mattermost-plugin-api/cluster"
)

const (
	boardsFeatureFlagName = "BoardsFeatureFlags"
	PluginName            = "focalboard"
	SharedBoardsName      = "enablepublicsharedboards"

	notifyFreqCardSecondsKey  = "notify_freq_card_seconds"
	notifyFreqBoardSecondsKey = "notify_freq_board_seconds"
)

type BoardsEmbed struct {
	OriginalPath string `json:"originalPath"`
	TeamID       string `json:"teamID"`
	ViewID       string `json:"viewID"`
	BoardID      string `json:"boardID"`
	CardID       string `json:"cardID"`
	ReadToken    string `json:"readToken,omitempty"`
}

type BoardsApp struct {
	// configurationLock synchronizes access to the configuration.
	configurationLock sync.RWMutex

	// configuration is the active plugin configuration. Consult getConfiguration and
	// setConfiguration for usage.
	configuration *configuration

	server          *server.Server
	wsPluginAdapter ws.PluginAdapterInterface

	servicesAPI model.ServicesAPI
	logger      mlog.LoggerIFace
}

func NewBoardsApp(api model.ServicesAPI) (*BoardsApp, error) {
	mmconfig := api.GetConfig()
	logger := api.GetLogger()

	baseURL := ""
	if mmconfig.ServiceSettings.SiteURL != nil {
		baseURL = *mmconfig.ServiceSettings.SiteURL
	}
	serverID := api.GetDiagnosticID()
	cfg := createBoardsConfig(*mmconfig, baseURL, serverID)
	sqlDB, err := api.GetMasterDB()
	if err != nil {
		return nil, fmt.Errorf("cannot access database while initializing Boards: %w", err)
	}

	storeParams := sqlstore.Params{
		DBType:           cfg.DBType,
		ConnectionString: cfg.DBConfigString,
		TablePrefix:      cfg.DBTablePrefix,
		Logger:           logger,
		DB:               sqlDB,
		IsPlugin:         true,
		NewMutexFn: func(name string) (*cluster.Mutex, error) {
			return cluster.NewMutex(&mutexAPIAdapter{api: api}, name)
		},
		ServicesAPI: api,
		ConfigFn:    api.GetConfig,
	}

	var db store.Store
	db, err = sqlstore.New(storeParams)
	if err != nil {
		return nil, fmt.Errorf("error initializing the DB: %w", err)
	}
	if cfg.AuthMode == server.MattermostAuthMod {
		layeredStore, err2 := mattermostauthlayer.New(cfg.DBType, sqlDB, db, logger, api, storeParams.TablePrefix)
		if err2 != nil {
			return nil, fmt.Errorf("error initializing the DB: %w", err2)
		}
		db = layeredStore
	}

	permissionsService := mmpermissions.New(db, api, logger)

	wsPluginAdapter := ws.NewPluginAdapter(api, auth.New(cfg, db, permissionsService), db, logger)

	backendParams := notifyBackendParams{
		cfg:         cfg,
		servicesAPI: api,
		appAPI:      &appAPI{store: db},
		permissions: permissionsService,
		serverRoot:  baseURL + "/boards",
		logger:      logger,
	}

	var notifyBackends []notify.Backend

	mentionsBackend, err := createMentionsNotifyBackend(backendParams)
	if err != nil {
		return nil, fmt.Errorf("error creating mention notifications backend: %w", err)
	}
	notifyBackends = append(notifyBackends, mentionsBackend)

	subscriptionsBackend, err2 := createSubscriptionsNotifyBackend(backendParams)
	if err2 != nil {
		return nil, fmt.Errorf("error creating subscription notifications backend: %w", err2)
	}
	notifyBackends = append(notifyBackends, subscriptionsBackend)
	mentionsBackend.AddListener(subscriptionsBackend)

	params := server.Params{
		Cfg:                cfg,
		SingleUserToken:    "",
		DBStore:            db,
		Logger:             logger,
		ServerID:           serverID,
		WSAdapter:          wsPluginAdapter,
		NotifyBackends:     notifyBackends,
		PermissionsService: permissionsService,
		IsPlugin:           true,
	}

	server, err := server.New(params)
	if err != nil {
		return nil, fmt.Errorf("error initializing the server: %w", err)
	}

	backendParams.appAPI.init(db, server.App())

	// ToDo: Cloud Limits have been disabled by design. We should
	// revisit the decision and update the related code accordingly
	/*
		if utils.IsCloudLicense(api.GetLicense()) {
			limits, err := api.GetCloudLimits()
			if err != nil {
				return nil, fmt.Errorf("error fetching cloud limits when starting Boards: %w", err)
			}

			if err := server.App().SetCloudLimits(limits); err != nil {
				return nil, fmt.Errorf("error setting cloud limits when starting Boards: %w", err)
			}
		}
	*/

	return &BoardsApp{
		server:          server,
		wsPluginAdapter: wsPluginAdapter,
		servicesAPI:     api,
		logger:          logger,
	}, nil
}

func (b *BoardsApp) Start() error {
	if err := b.server.Start(); err != nil {
		return fmt.Errorf("error starting Boards server: %w", err)
	}

	b.servicesAPI.RegisterRouter(b.server.GetRootRouter())

	b.logger.Info("Boards product successfully started.")

	return nil
}

func (b *BoardsApp) Stop() error {
	return b.server.Shutdown()
}

//
// These callbacks are called automatically by the suite server.
//

func (b *BoardsApp) MessageWillBePosted(_ *plugin.Context, post *mm_model.Post) (*mm_model.Post, string) {
	return postWithBoardsEmbed(post), ""
}

func (b *BoardsApp) MessageWillBeUpdated(_ *plugin.Context, newPost, _ *mm_model.Post) (*mm_model.Post, string) {
	return postWithBoardsEmbed(newPost), ""
}

func (b *BoardsApp) OnWebSocketConnect(webConnID, userID string) {
	b.wsPluginAdapter.OnWebSocketConnect(webConnID, userID)
}

func (b *BoardsApp) OnWebSocketDisconnect(webConnID, userID string) {
	b.wsPluginAdapter.OnWebSocketDisconnect(webConnID, userID)
}

func (b *BoardsApp) WebSocketMessageHasBeenPosted(webConnID, userID string, req *mm_model.WebSocketRequest) {
	b.wsPluginAdapter.WebSocketMessageHasBeenPosted(webConnID, userID, req)
}

func (b *BoardsApp) OnPluginClusterEvent(_ *plugin.Context, ev mm_model.PluginClusterEvent) {
	b.wsPluginAdapter.HandleClusterEvent(ev)
}

func (b *BoardsApp) OnCloudLimitsUpdated(limits *mm_model.ProductLimits) {
	if err := b.server.App().SetCloudLimits(limits); err != nil {
		b.logger.Error("Error setting the cloud limits for Boards", mlog.Err(err))
	}
}

// ServeHTTP demonstrates a plugin that handles HTTP requests by greeting the world.
func (b *BoardsApp) ServeHTTP(_ *plugin.Context, w http.ResponseWriter, r *http.Request) {
	router := b.server.GetRootRouter()
	router.ServeHTTP(w, r)
}
