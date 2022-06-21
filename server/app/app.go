package app

import (
	"sync"
	"time"

	"github.com/mattermost/focalboard/server/auth"
	"github.com/mattermost/focalboard/server/services/config"
	"github.com/mattermost/focalboard/server/services/metrics"
	"github.com/mattermost/focalboard/server/services/notify"
	"github.com/mattermost/focalboard/server/services/permissions"
	"github.com/mattermost/focalboard/server/services/store"
	"github.com/mattermost/focalboard/server/services/webhook"
	"github.com/mattermost/focalboard/server/utils"
	"github.com/mattermost/focalboard/server/ws"

	mmModel "github.com/mattermost/mattermost-server/v6/model"

	"github.com/mattermost/mattermost-server/v6/shared/filestore"
	"github.com/mattermost/mattermost-server/v6/shared/mlog"
)

const (
	blockChangeNotifierQueueSize       = 1000
	blockChangeNotifierPoolSize        = 10
	blockChangeNotifierShutdownTimeout = time.Second * 10
)

type pluginAPI interface {
	GetUsers(options *mmModel.UserGetOptions) ([]*mmModel.User, *mmModel.AppError)
}

type Services struct {
	Auth             *auth.Auth
	Store            store.Store
	FilesBackend     filestore.FileBackend
	Webhook          *webhook.Client
	Metrics          *metrics.Metrics
	Notifications    *notify.Service
	Logger           *mlog.Logger
	Permissions      permissions.PermissionsService
	SkipTemplateInit bool
	PluginAPI        pluginAPI
}

type App struct {
	config              *config.Configuration
	store               store.Store
	auth                *auth.Auth
	wsAdapter           ws.Adapter
	filesBackend        filestore.FileBackend
	webhook             *webhook.Client
	metrics             *metrics.Metrics
	notifications       *notify.Service
	logger              *mlog.Logger
	blockChangeNotifier *utils.CallbackQueue
	pluginAPI           pluginAPI

	cardLimitMux sync.RWMutex
	cardLimit    int
}

func (a *App) SetConfig(config *config.Configuration) {
	a.config = config
}

func (a *App) GetConfig() *config.Configuration {
	return a.config
}

func New(config *config.Configuration, wsAdapter ws.Adapter, services Services) *App {
	app := &App{
		config:              config,
		store:               services.Store,
		auth:                services.Auth,
		wsAdapter:           wsAdapter,
		filesBackend:        services.FilesBackend,
		webhook:             services.Webhook,
		metrics:             services.Metrics,
		notifications:       services.Notifications,
		logger:              services.Logger,
		blockChangeNotifier: utils.NewCallbackQueue("blockChangeNotifier", blockChangeNotifierQueueSize, blockChangeNotifierPoolSize, services.Logger),
		pluginAPI:           services.PluginAPI,
	}
	app.initialize(services.SkipTemplateInit)
	return app
}

func (a *App) CardLimit() int {
	a.cardLimitMux.RLock()
	defer a.cardLimitMux.RUnlock()
	return a.cardLimit
}

func (a *App) SetCardLimit(cardLimit int) {
	a.cardLimitMux.Lock()
	defer a.cardLimitMux.Unlock()
	a.cardLimit = cardLimit
}
