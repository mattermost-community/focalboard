package main

import (
	"encoding/json"
	"fmt"
	"math"
	"net/http"
	"net/url"
	"path"
	"strings"
	"sync"

	"github.com/mattermost/focalboard/server/auth"
	"github.com/mattermost/focalboard/server/server"
	"github.com/mattermost/focalboard/server/services/config"
	"github.com/mattermost/focalboard/server/services/notify"
	"github.com/mattermost/focalboard/server/services/permissions/mmpermissions"
	"github.com/mattermost/focalboard/server/services/store"
	"github.com/mattermost/focalboard/server/services/store/mattermostauthlayer"
	"github.com/mattermost/focalboard/server/services/store/sqlstore"
	"github.com/mattermost/focalboard/server/ws"

	pluginapi "github.com/mattermost/mattermost-plugin-api"
	"github.com/mattermost/mattermost-plugin-api/cluster"

	mmModel "github.com/mattermost/mattermost-server/v6/model"
	"github.com/mattermost/mattermost-server/v6/plugin"
	"github.com/mattermost/mattermost-server/v6/shared/markdown"
	"github.com/mattermost/mattermost-server/v6/shared/mlog"
)

const (
	boardsFeatureFlagName = "BoardsFeatureFlags"
	pluginName            = "focalboard"
	sharedBoardsName      = "enablepublicsharedboards"

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

// Plugin implements the interface expected by the Mattermost server to communicate between the server and plugin processes.
type Plugin struct {
	plugin.MattermostPlugin

	// configurationLock synchronizes access to the configuration.
	configurationLock sync.RWMutex

	// configuration is the active plugin configuration. Consult getConfiguration and
	// setConfiguration for usage.
	configuration *configuration

	server          *server.Server
	wsPluginAdapter ws.PluginAdapterInterface
}

func (p *Plugin) OnActivate() error {
	mmconfig := p.API.GetUnsanitizedConfig()

	client := pluginapi.NewClient(p.API, p.Driver)
	sqlDB, err := client.Store.GetMasterDB()
	if err != nil {
		return fmt.Errorf("error initializing the DB: %w", err)
	}

	logger, _ := mlog.NewLogger()
	pluginTargetFactory := newPluginTargetFactory(&client.Log)
	factories := &mlog.Factories{
		TargetFactory: pluginTargetFactory.createTarget,
	}
	cfgJSON := defaultLoggingConfig()
	err = logger.Configure("", cfgJSON, factories)
	if err != nil {
		return err
	}

	baseURL := ""
	if mmconfig.ServiceSettings.SiteURL != nil {
		baseURL = *mmconfig.ServiceSettings.SiteURL
	}
	serverID := client.System.GetDiagnosticID()
	cfg := p.createBoardsConfig(*mmconfig, baseURL, serverID)

	storeParams := sqlstore.Params{
		DBType:           cfg.DBType,
		ConnectionString: cfg.DBConfigString,
		TablePrefix:      cfg.DBTablePrefix,
		Logger:           logger,
		DB:               sqlDB,
		IsPlugin:         true,
		NewMutexFn: func(name string) (*cluster.Mutex, error) {
			return cluster.NewMutex(p.API, name)
		},
		PluginAPI: &p.API,
	}

	var db store.Store
	db, err = sqlstore.New(storeParams)
	if err != nil {
		return fmt.Errorf("error initializing the DB: %w", err)
	}
	if cfg.AuthMode == server.MattermostAuthMod {
		layeredStore, err2 := mattermostauthlayer.New(cfg.DBType, sqlDB, db, logger, p.API)
		if err2 != nil {
			return fmt.Errorf("error initializing the DB: %w", err2)
		}
		db = layeredStore
	}

	permissionsService := mmpermissions.New(db, p.API)

	p.wsPluginAdapter = ws.NewPluginAdapter(p.API, auth.New(cfg, db, permissionsService), db, logger)

	backendParams := notifyBackendParams{
		cfg:         cfg,
		client:      client,
		appAPI:      &appAPI{store: db},
		permissions: permissionsService,
		serverRoot:  baseURL + "/boards",
		logger:      logger,
	}

	var notifyBackends []notify.Backend

	mentionsBackend, err := createMentionsNotifyBackend(backendParams)
	if err != nil {
		return fmt.Errorf("error creating mention notifications backend: %w", err)
	}
	notifyBackends = append(notifyBackends, mentionsBackend)

	subscriptionsBackend, err2 := createSubscriptionsNotifyBackend(backendParams)
	if err2 != nil {
		return fmt.Errorf("error creating subscription notifications backend: %w", err2)
	}
	notifyBackends = append(notifyBackends, subscriptionsBackend)
	mentionsBackend.AddListener(subscriptionsBackend)

	params := server.Params{
		Cfg:                cfg,
		SingleUserToken:    "",
		DBStore:            db,
		Logger:             logger,
		ServerID:           serverID,
		WSAdapter:          p.wsPluginAdapter,
		NotifyBackends:     notifyBackends,
		PermissionsService: permissionsService,
	}

	server, err := server.New(params)
	if err != nil {
		fmt.Println("ERROR INITIALIZING THE SERVER", err)
		return err
	}

	backendParams.appAPI.init(db, server.App())

	p.server = server
	return server.Start()
}

func (p *Plugin) createBoardsConfig(mmconfig mmModel.Config, baseURL string, serverID string) *config.Configuration {
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

	enableTelemetry := false
	if mmconfig.LogSettings.EnableDiagnostics != nil {
		enableTelemetry = *mmconfig.LogSettings.EnableDiagnostics
	}

	enablePublicSharedBoards := false
	if mmconfig.PluginSettings.Plugins[pluginName][sharedBoardsName] == true {
		enablePublicSharedBoards = true
	}

	enableBoardsDeletion := false
	if mmconfig.DataRetentionSettings.EnableBoardsDeletion != nil {
		enableBoardsDeletion = true
	}

	featureFlags := parseFeatureFlags(mmconfig.FeatureFlags.ToMap())

	return &config.Configuration{
		ServerRoot:               baseURL + "/plugins/focalboard",
		Port:                     -1,
		DBType:                   *mmconfig.SqlSettings.DriverName,
		DBConfigString:           *mmconfig.SqlSettings.DataSource,
		DBTablePrefix:            "focalboard_",
		UseSSL:                   false,
		SecureCookie:             true,
		WebPath:                  path.Join(*mmconfig.PluginSettings.Directory, "focalboard", "pack"),
		FilesDriver:              *mmconfig.FileSettings.DriverName,
		FilesPath:                *mmconfig.FileSettings.Directory,
		FilesS3Config:            filesS3Config,
		MaxFileSize:              *mmconfig.FileSettings.MaxFileSize,
		Telemetry:                enableTelemetry,
		TelemetryID:              serverID,
		WebhookUpdate:            []string{},
		SessionExpireTime:        2592000,
		SessionRefreshTime:       18000,
		LocalOnly:                false,
		EnableLocalMode:          false,
		LocalModeSocketLocation:  "",
		AuthMode:                 "mattermost",
		EnablePublicSharedBoards: enablePublicSharedBoards,
		FeatureFlags:             featureFlags,
		NotifyFreqCardSeconds:    getPluginSettingInt(mmconfig, notifyFreqCardSecondsKey, 120),
		NotifyFreqBoardSeconds:   getPluginSettingInt(mmconfig, notifyFreqBoardSecondsKey, 86400),
		EnableDataRetention:      enableBoardsDeletion,
		DataRetentionDays:        *mmconfig.DataRetentionSettings.BoardsRetentionDays,
	}
}

func getPluginSetting(mmConfig mmModel.Config, key string) (interface{}, bool) {
	plugin, ok := mmConfig.PluginSettings.Plugins[pluginName]
	if !ok {
		return nil, false
	}

	val, ok := plugin[key]
	if !ok {
		return nil, false
	}
	return val, true
}

func getPluginSettingInt(mmConfig mmModel.Config, key string, def int) int {
	val, ok := getPluginSetting(mmConfig, key)
	if !ok {
		return def
	}
	valFloat, ok := val.(float64)
	if !ok {
		return def
	}
	return int(math.Round(valFloat))
}

func parseFeatureFlags(configFeatureFlags map[string]string) map[string]string {
	featureFlags := make(map[string]string)
	for key, value := range configFeatureFlags {
		// Break out FeatureFlags and pass remaining
		if key == boardsFeatureFlagName {
			for _, flag := range strings.Split(value, "-") {
				featureFlags[flag] = "true"
			}
		} else {
			featureFlags[key] = value
		}
	}
	return featureFlags
}

func (p *Plugin) OnWebSocketConnect(webConnID, userID string) {
	p.wsPluginAdapter.OnWebSocketConnect(webConnID, userID)
}

func (p *Plugin) OnWebSocketDisconnect(webConnID, userID string) {
	p.wsPluginAdapter.OnWebSocketDisconnect(webConnID, userID)
}

func (p *Plugin) WebSocketMessageHasBeenPosted(webConnID, userID string, req *mmModel.WebSocketRequest) {
	p.wsPluginAdapter.WebSocketMessageHasBeenPosted(webConnID, userID, req)
}

func (p *Plugin) OnDeactivate() error {
	return p.server.Shutdown()
}

func (p *Plugin) OnPluginClusterEvent(_ *plugin.Context, ev mmModel.PluginClusterEvent) {
	p.wsPluginAdapter.HandleClusterEvent(ev)
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
			"type": "focalboard_plugin_adapter",
			"options": {},
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
		},
		"errors_file": {
			"Type": "file",
			"Format": "plain",
			"Levels": [
				{"ID": 2, "Name": "error", "Stacktrace": true}
			],
			"Options": {
				"Compress": true,
				"Filename": "focalboard_errors.log",
				"MaxAgeDays": 0,
				"MaxBackups": 5,
				"MaxSizeMB": 10
			},
			"MaxQueueSize": 1000
		}
	}`
}

func (p *Plugin) MessageWillBePosted(_ *plugin.Context, post *mmModel.Post) (*mmModel.Post, string) {
	return postWithBoardsEmbed(post), ""
}

func (p *Plugin) MessageWillBeUpdated(_ *plugin.Context, newPost, _ *mmModel.Post) (*mmModel.Post, string) {
	return postWithBoardsEmbed(newPost), ""
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

func getFirstLinkAndShortenAllBoardsLink(postMessage string) (firstLink, newPostMessage string) {
	newPostMessage = postMessage
	seenLinks := make(map[string]bool)
	markdown.Inspect(postMessage, func(blockOrInline interface{}) bool {
		if autoLink, ok := blockOrInline.(*markdown.Autolink); ok {
			link := autoLink.Destination()

			if firstLink == "" {
				firstLink = link
			}

			if seen := seenLinks[link]; !seen && isBoardsLink(link) {
				// TODO: Make sure that <Jump To Card> is Internationalized and translated to the Users Language preference
				markdownFormattedLink := fmt.Sprintf("[%s](%s)", "<Jump To Card>", link)
				newPostMessage = strings.ReplaceAll(newPostMessage, link, markdownFormattedLink)
				seenLinks[link] = true
			}
		}
		if inlineLink, ok := blockOrInline.(*markdown.InlineLink); ok {
			if link := inlineLink.Destination(); firstLink == "" {
				firstLink = link
			}
		}
		return true
	})

	return firstLink, newPostMessage
}

func returnBoardsParams(pathArray []string) (teamID, boardID, viewID, cardID string) {
	// The reason we are doing this search for the first instance of boards or plugins is to take into account URL subpaths
	index := -1
	for i := 0; i < len(pathArray); i++ {
		if pathArray[i] == "boards" || pathArray[i] == "plugins" {
			index = i
			break
		}
	}

	if index == -1 {
		return teamID, boardID, viewID, cardID
	}

	// If at index, the parameter in the path is boards,
	// then we've copied this directly as logged in user of that board

	// If at index, the parameter in the path is plugins,
	// then we've copied this from a shared board

	// For card links copied on a non-shared board, the path looks like {...Mattermost Url}.../boards/team/teamID/boardID/viewID/cardID

	// For card links copied on a shared board, the path looks like
	// {...Mattermost Url}.../plugins/focalboard/team/teamID/shared/boardID/viewID/cardID?r=read_token

	// This is a non-shared board card link
	if len(pathArray)-index == 6 && pathArray[index] == "boards" && pathArray[index+1] == "team" {
		teamID = pathArray[index+2]
		boardID = pathArray[index+3]
		viewID = pathArray[index+4]
		cardID = pathArray[index+5]
	} else if len(pathArray)-index == 8 && pathArray[index] == "plugins" &&
		pathArray[index+1] == "focalboard" &&
		pathArray[index+2] == "team" &&
		pathArray[index+4] == "shared" { // This is a shared board card link
		teamID = pathArray[index+3]
		boardID = pathArray[index+5]
		viewID = pathArray[index+6]
		cardID = pathArray[index+7]
	}
	return teamID, boardID, viewID, cardID
}

func isBoardsLink(link string) bool {
	u, err := url.Parse(link)

	if err != nil {
		return false
	}

	urlPath := u.Path
	urlPath = strings.TrimPrefix(urlPath, "/")
	urlPath = strings.TrimSuffix(urlPath, "/")
	pathSplit := strings.Split(strings.ToLower(urlPath), "/")

	if len(pathSplit) == 0 {
		return false
	}

	teamID, boardID, viewID, cardID := returnBoardsParams(pathSplit)
	return teamID != "" && boardID != "" && viewID != "" && cardID != ""
}
