// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package product

import (
	"encoding/json"
	"fmt"
	"net/url"
	"reflect"
	"strings"
	"sync"

	"github.com/mattermost/focalboard/server/auth"
	"github.com/mattermost/focalboard/server/server"
	"github.com/mattermost/focalboard/server/services/notify"
	"github.com/mattermost/focalboard/server/services/permissions/mmpermissions"
	"github.com/mattermost/focalboard/server/services/store"
	"github.com/mattermost/focalboard/server/services/store/mattermostauthlayer"
	"github.com/mattermost/focalboard/server/services/store/sqlstore"
	"github.com/mattermost/focalboard/server/ws"
	"github.com/mattermost/mattermost-plugin-api/cluster"

	"github.com/mattermost/mattermost-server/v6/app"
	"github.com/mattermost/mattermost-server/v6/app/request"
	mmModel "github.com/mattermost/mattermost-server/v6/model"
	"github.com/mattermost/mattermost-server/v6/plugin"
	"github.com/mattermost/mattermost-server/v6/product"
)

func init() {
	app.RegisterProduct("boards", app.ProductManifest{
		Initializer: NewBoards,
		Dependencies: map[app.ServiceKey]struct{}{
			app.PostKey:        {},
			app.PermissionsKey: {},
			app.UserKey:        {},
			app.LicenseKey:     {},
			app.ChannelKey:     {},
			app.HooksKey:       {},
			app.RouterKey:      {},
		},
	})
}

type Boards struct {
	configurationLock sync.RWMutex
	configuration     *configuration
	server            *server.Server
	ws                *ws.PluginAdapter
	mmConfig          func() *mmModel.Config
	hooksService      product.HooksService
}

// NewBoards creates the focalboard product ready to be started. The app.Server and Service map provides
// or should provied all the necessary interfaces adn functionalities to initialize the focalboard server
func NewBoards(mmServer *app.Server, services map[app.ServiceKey]interface{}) (app.Product, error) {
	// Get config
	mmConfig := mmServer.Config()

	sqlDB := mmServer.Store.GetInternalMasterDB()

	// init logger and configure
	logger := mmServer.Log

	baseURL := ""
	if mmConfig.ServiceSettings.SiteURL != nil {
		baseURL = *mmConfig.ServiceSettings.SiteURL
	}

	// TODO: add system service
	serverID := "test_diagnostic_id" //client.System.GetDiagnosticID()
	cfg := createBoardsConfig(*mmConfig, baseURL, serverID)

	// create boards store
	storeParams := sqlstore.Params{
		DBType:           cfg.DBType,
		ConnectionString: cfg.DBConfigString,
		TablePrefix:      cfg.DBTablePrefix,
		Logger:           logger,
		DB:               sqlDB,
		IsPlugin:         true,
		NewMutexFn: func(name string) (*cluster.Mutex, error) {
			return cluster.NewMutex(newMutexAPIImpl(services), name) // use services
		},
		PluginAPI: newStorePluginAPIImpl(services),
	}

	var db store.Store
	var err error
	db, err = sqlstore.New(storeParams)
	if err != nil {
		return nil, fmt.Errorf("error initializing the DB: %w", err)
	}
	if cfg.AuthMode == server.MattermostAuthMod {
		layeredStore, err2 := mattermostauthlayer.New(cfg.DBType, sqlDB, db, logger, newMattermostAuthLayerPluginAPIImpl(services))
		if err2 != nil {
			return nil, fmt.Errorf("error initializing the DB: %w", err2)
		}
		db = layeredStore
	}

	psAPI := newPermissionsPluginAPIImpl(services)
	permissionsService := mmpermissions.New(db, psAPI)
	wsAPI := newWSPluginAPIImpl(services)

	wsPluginAdapter := ws.NewPluginAdapter(wsAPI, auth.New(cfg, db, permissionsService), db, logger)

	// TODO: create actual request.Context()
	notifypluginAdapter := newPluginDeliveryAPIImpl(request.EmptyContext(), services)

	backendParams := notifyBackendParams{
		cfg:         cfg,
		pluginAPI:   notifypluginAdapter,
		store:       db,
		permissions: permissionsService,
		wsAdapter:   wsPluginAdapter,
		serverRoot:  baseURL + "/boards",
		logger:      logger,
	}

	var notifyBackends []notify.Backend

	// TODO: add utility function or import
	mentionsBackend, err := createMentionsNotifyBackend(backendParams)
	if err != nil {
		return nil, fmt.Errorf("error creating mention notifications backend: %w", err)
	}
	notifyBackends = append(notifyBackends, mentionsBackend)

	// TODO: add utility function or import
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
	}

	server, err := server.New(params)
	if err != nil {
		fmt.Println("ERROR INITIALIZING THE SERVER", err)
		return nil, err
	}

	routerService := services[app.RouterKey].(product.RouterService)
	routerService.RegisterRouter("focalboard", server.GetRootRouter())
	hooksService := services[app.HooksKey].(product.HooksService)

	b := &Boards{
		server:       server,
		ws:           wsPluginAdapter,
		mmConfig:     mmServer.Config,
		hooksService: hooksService,
	}

	return b, nil
}

func (b *Boards) Start() error {
	fmt.Printf("\n\n -------- STARTING BOARDS -------- \n\n\n")
	// We need to register hooks after start, because the plugin environment
	// starts after the channels product starts. And the boards product itself
	// implements product.Hooks interface, it can be replaced by any other struct
	// as this is just for demonstration purposes.
	if err := b.hooksService.RegisterHooks("focalboard", b); err != nil {
		return err
	}
	return b.server.Start()
}

func (b *Boards) Stop() error {
	fmt.Printf("\n\n -------- STOPPING BOARDS -------- \n\n\n")
	return b.server.Shutdown()
}

func (b *Boards) MessageWillBePosted(_ *plugin.Context, post *mmModel.Post) (*mmModel.Post, string) {
	fmt.Println("hook called")
	return postWithBoardsEmbed(post), ""
}

func (b *Boards) MessageWillBeUpdated(_ *plugin.Context, newPost, _ *mmModel.Post) (*mmModel.Post, string) {
	return postWithBoardsEmbed(newPost), ""
}

func (b *Boards) OnWebSocketConnect(webConnID, userID string) {
	b.ws.OnWebSocketConnect(webConnID, userID)
}

func (b *Boards) OnWebSocketDisconnect(webConnID, userID string) {
	b.ws.OnWebSocketDisconnect(webConnID, userID)
}

func (b *Boards) WebSocketMessageHasBeenPosted(webConnID, userID string, req *mmModel.WebSocketRequest) {
	b.ws.WebSocketMessageHasBeenPosted(webConnID, userID, req)
}

func (b *Boards) OnPluginClusterEvent(_ *plugin.Context, ev mmModel.PluginClusterEvent) {
	b.ws.HandleClusterEvent(ev)
}

func (b *Boards) OnConfigurationChange() error { //nolint
	// Have we been setup by OnActivate?
	if b.ws == nil {
		return nil
	}
	mmconfig := b.mmConfig()

	// handle plugin configuration settings
	enableShareBoards := false
	if mmconfig.PluginSettings.Plugins[pluginName][sharedBoardsName] == true {
		enableShareBoards = true
	}
	configuration := &configuration{
		EnablePublicSharedBoards: enableShareBoards,
	}
	b.setConfiguration(configuration)
	b.server.Config().EnablePublicSharedBoards = enableShareBoards

	// handle feature flags
	b.server.Config().FeatureFlags = parseFeatureFlags(mmconfig.FeatureFlags.ToMap())

	// handle Data Retention settings
	enableBoardsDeletion := false
	if mmconfig.DataRetentionSettings.EnableBoardsDeletion != nil {
		enableBoardsDeletion = true
	}
	b.server.Config().EnableDataRetention = enableBoardsDeletion
	b.server.Config().DataRetentionDays = *mmconfig.DataRetentionSettings.BoardsRetentionDays

	b.server.UpdateAppConfig()
	b.ws.BroadcastConfigChange(*b.server.App().GetClientConfig())
	return nil
}

type configuration struct {
	EnablePublicSharedBoards bool
}

func (b *Boards) setConfiguration(configuration *configuration) {
	b.configurationLock.Lock()
	defer b.configurationLock.Unlock()

	if configuration != nil && b.configuration == configuration {
		// Ignore assignment if the configuration struct is empty. Go will optimize the
		// allocation for same to point at the same memory address, breaking the check
		// above.
		if reflect.ValueOf(*configuration).NumField() == 0 {
			return
		}

		panic("setConfiguration called with the existing configuration")
	}

	b.configuration = configuration
}

func postWithBoardsEmbed(post *mmModel.Post) *mmModel.Post {
	if _, ok := post.GetProps()["boards"]; ok {
		post.AddProp("boards", nil)
	}

	firstLink, newPostMessage := getFirstLinkAndShortenAllBoardsLink(post.Message)
	post.Message = newPostMessage

	if firstLink == "" {
		return post
	}

	u, err := url.Parse(firstLink)

	if err != nil {
		return post
	}

	// Trim away the first / because otherwise after we split the string, the first element in the array is a empty element
	urlPath := u.Path
	urlPath = strings.TrimPrefix(urlPath, "/")
	urlPath = strings.TrimSuffix(urlPath, "/")
	pathSplit := strings.Split(strings.ToLower(urlPath), "/")
	queryParams := u.Query()

	if len(pathSplit) == 0 {
		return post
	}

	teamID, boardID, viewID, cardID := returnBoardsParams(pathSplit)

	if teamID != "" && boardID != "" && viewID != "" && cardID != "" {
		b, _ := json.Marshal(BoardsEmbed{
			TeamID:       teamID,
			BoardID:      boardID,
			ViewID:       viewID,
			CardID:       cardID,
			ReadToken:    queryParams.Get("r"),
			OriginalPath: u.RequestURI(),
		})

		BoardsPostEmbed := &mmModel.PostEmbed{
			Type: mmModel.PostEmbedBoards,
			Data: string(b),
		}

		if post.Metadata == nil {
			post.Metadata = &mmModel.PostMetadata{}
		}

		post.Metadata.Embeds = []*mmModel.PostEmbed{BoardsPostEmbed}
		post.AddProp("boards", string(b))
	}

	return post
}
