// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package product

import (
	"errors"
	"fmt"

	"github.com/mattermost/focalboard/mattermost-plugin/server/boards"
	"github.com/mattermost/focalboard/server/model"

	mm_model "github.com/mattermost/mattermost-server/v6/model"
	"github.com/mattermost/mattermost-server/v6/plugin"
	"github.com/mattermost/mattermost-server/v6/product"
	"github.com/mattermost/mattermost-server/v6/shared/mlog"
)

const (
	boardsProductName = "boards"
	boardsProductID   = "com.mattermost.boards"
)

var errServiceTypeAssert = errors.New("type assertion failed")

func init() {
	product.RegisterProduct(boardsProductName, product.Manifest{
		Initializer: newBoardsProduct,
		Dependencies: map[product.ServiceKey]struct{}{
			product.TeamKey:          {},
			product.ChannelKey:       {},
			product.UserKey:          {},
			product.PostKey:          {},
			product.BotKey:           {},
			product.ClusterKey:       {},
			product.ConfigKey:        {},
			product.LogKey:           {},
			product.LicenseKey:       {},
			product.FilestoreKey:     {},
			product.FileInfoStoreKey: {},
			product.RouterKey:        {},
			product.CloudKey:         {},
			product.KVStoreKey:       {},
			product.StoreKey:         {},
			product.SystemKey:        {},
			product.PreferencesKey:   {},
		},
	})
}

type boardsProduct struct {
	teamService          product.TeamService
	channelService       product.ChannelService
	userService          product.UserService
	postService          product.PostService
	permissionsService   product.PermissionService
	botService           product.BotService
	clusterService       product.ClusterService
	configService        product.ConfigService
	logger               mlog.LoggerIFace
	licenseService       product.LicenseService
	filestoreService     product.FilestoreService
	fileInfoStoreService product.FileInfoStoreService
	routerService        product.RouterService
	cloudService         product.CloudService
	kvStoreService       product.KVStoreService
	storeService         product.StoreService
	systemService        product.SystemService
	preferencesService   product.PreferencesService
	hooksService         product.HooksService

	boardsApp *boards.BoardsApp
}

func newBoardsProduct(services map[product.ServiceKey]interface{}) (product.Product, error) {
	boards := &boardsProduct{}

	for key, service := range services {
		switch key {
		case product.TeamKey:
			teamService, ok := service.(product.TeamService)
			if !ok {
				return nil, fmt.Errorf("invalid service key '%s': %w", key, errServiceTypeAssert)
			}
			boards.teamService = teamService
		case product.ChannelKey:
			channelService, ok := service.(product.ChannelService)
			if !ok {
				return nil, fmt.Errorf("invalid service key '%s': %w", key, errServiceTypeAssert)
			}
			boards.channelService = channelService
		case product.UserKey:
			userService, ok := service.(product.UserService)
			if !ok {
				return nil, fmt.Errorf("invalid service key '%s': %w", key, errServiceTypeAssert)
			}
			boards.userService = userService
		case product.PostKey:
			postService, ok := service.(product.PostService)
			if !ok {
				return nil, fmt.Errorf("invalid service key '%s': %w", key, errServiceTypeAssert)
			}
			boards.postService = postService
		case product.PermissionsKey:
			permissionsService, ok := service.(product.PermissionService)
			if !ok {
				return nil, fmt.Errorf("invalid service key '%s': %w", key, errServiceTypeAssert)
			}
			boards.permissionsService = permissionsService
		case product.BotKey:
			botService, ok := service.(product.BotService)
			if !ok {
				return nil, fmt.Errorf("invalid service key '%s': %w", key, errServiceTypeAssert)
			}
			boards.botService = botService
		case product.ClusterKey:
			clusterService, ok := service.(product.ClusterService)
			if !ok {
				return nil, fmt.Errorf("invalid service key '%s': %w", key, errServiceTypeAssert)
			}
			boards.clusterService = clusterService
		case product.ConfigKey:
			configService, ok := service.(product.ConfigService)
			if !ok {
				return nil, fmt.Errorf("invalid service key '%s': %w", key, errServiceTypeAssert)
			}
			boards.configService = configService
		case product.LogKey:
			logger, ok := service.(mlog.LoggerIFace)
			if !ok {
				return nil, fmt.Errorf("invalid service key '%s': %w", key, errServiceTypeAssert)
			}
			boards.logger = logger.With(mlog.String("product", boardsProductName))
		case product.LicenseKey:
			licenseService, ok := service.(product.LicenseService)
			if !ok {
				return nil, fmt.Errorf("invalid service key '%s': %w", key, errServiceTypeAssert)
			}
			boards.licenseService = licenseService
		case product.FilestoreKey:
			filestoreService, ok := service.(product.FilestoreService)
			if !ok {
				return nil, fmt.Errorf("invalid service key '%s': %w", key, errServiceTypeAssert)
			}
			boards.filestoreService = filestoreService
		case product.FileInfoStoreKey:
			fileInfoStoreService, ok := service.(product.FileInfoStoreService)
			if !ok {
				return nil, fmt.Errorf("invalid service key '%s': %w", key, errServiceTypeAssert)
			}
			boards.fileInfoStoreService = fileInfoStoreService
		case product.RouterKey:
			routerService, ok := service.(product.RouterService)
			if !ok {
				return nil, fmt.Errorf("invalid service key '%s': %w", key, errServiceTypeAssert)
			}
			boards.routerService = routerService
		case product.CloudKey:
			cloudService, ok := service.(product.CloudService)
			if !ok {
				return nil, fmt.Errorf("invalid service key '%s': %w", key, errServiceTypeAssert)
			}
			boards.cloudService = cloudService
		case product.KVStoreKey:
			kvStoreService, ok := service.(product.KVStoreService)
			if !ok {
				return nil, fmt.Errorf("invalid service key '%s': %w", key, errServiceTypeAssert)
			}
			boards.kvStoreService = kvStoreService
		case product.StoreKey:
			storeService, ok := service.(product.StoreService)
			if !ok {
				return nil, fmt.Errorf("invalid service key '%s': %w", key, errServiceTypeAssert)
			}
			boards.storeService = storeService
		case product.SystemKey:
			systemService, ok := service.(product.SystemService)
			if !ok {
				return nil, fmt.Errorf("invalid service key '%s': %w", key, errServiceTypeAssert)
			}
			boards.systemService = systemService
		case product.PreferencesKey:
			preferencesService, ok := service.(product.PreferencesService)
			if !ok {
				return nil, fmt.Errorf("invalid service key '%s': %w", key, errServiceTypeAssert)
			}
			boards.preferencesService = preferencesService
		case product.HooksKey:
			hooksService, ok := service.(product.HooksService)
			if !ok {
				return nil, fmt.Errorf("invalid service key '%s': %w", key, errServiceTypeAssert)
			}
			boards.hooksService = hooksService
		}
	}
	return boards, nil
}

func (bp *boardsProduct) Start() error {
	if !bp.configService.Config().FeatureFlags.BoardsProduct {
		bp.logger.Info("Boards product disabled via feature flag")
		return nil
	}

	bp.logger.Info("Starting boards service")

	adapter := newServiceAPIAdapter(bp)
	boardsApp, err := boards.NewBoardsApp(adapter)
	if err != nil {
		return fmt.Errorf("failed to create Boards service: %w", err)
	}

	model.LogServerInfo(bp.logger)

	if err := bp.hooksService.RegisterHooks(boardsProductName, bp); err != nil {
		return fmt.Errorf("failed to register hooks: %w", err)
	}

	bp.boardsApp = boardsApp
	if err := bp.boardsApp.Start(); err != nil {
		return fmt.Errorf("failed to start Boards service: %w", err)
	}

	return nil
}

func (bp *boardsProduct) Stop() error {
	bp.logger.Info("Stopping boards service")

	if bp.boardsApp == nil {
		return nil
	}

	if err := bp.boardsApp.Stop(); err != nil {
		return fmt.Errorf("error while stopping Boards service: %w", err)
	}

	return nil
}

//
// These callbacks are called by the suite automatically
//

func (bp *boardsProduct) OnConfigurationChange() error {
	if bp.boardsApp == nil {
		return nil
	}
	return bp.boardsApp.OnConfigurationChange()
}

func (bp *boardsProduct) OnWebSocketConnect(webConnID, userID string) {
	if bp.boardsApp == nil {
		return
	}
	bp.boardsApp.OnWebSocketConnect(webConnID, userID)
}

func (bp *boardsProduct) OnWebSocketDisconnect(webConnID, userID string) {
	if bp.boardsApp == nil {
		return
	}
	bp.boardsApp.OnWebSocketDisconnect(webConnID, userID)
}

func (bp *boardsProduct) WebSocketMessageHasBeenPosted(webConnID, userID string, req *mm_model.WebSocketRequest) {
	if bp.boardsApp == nil {
		return
	}
	bp.boardsApp.WebSocketMessageHasBeenPosted(webConnID, userID, req)
}

func (bp *boardsProduct) OnPluginClusterEvent(ctx *plugin.Context, ev mm_model.PluginClusterEvent) {
	if bp.boardsApp == nil {
		return
	}
	bp.boardsApp.OnPluginClusterEvent(ctx, ev)
}

func (bp *boardsProduct) MessageWillBePosted(ctx *plugin.Context, post *mm_model.Post) (*mm_model.Post, string) {
	if bp.boardsApp == nil {
		return post, ""
	}
	return bp.boardsApp.MessageWillBePosted(ctx, post)
}

func (bp *boardsProduct) MessageWillBeUpdated(ctx *plugin.Context, newPost, oldPost *mm_model.Post) (*mm_model.Post, string) {
	if bp.boardsApp == nil {
		return newPost, ""
	}
	return bp.boardsApp.MessageWillBeUpdated(ctx, newPost, oldPost)
}

func (bp *boardsProduct) OnCloudLimitsUpdated(limits *mm_model.ProductLimits) {
	if bp.boardsApp == nil {
		return
	}
	bp.boardsApp.OnCloudLimitsUpdated(limits)
}

func (bp *boardsProduct) RunDataRetention(nowTime, batchSize int64) (int64, error) {
	if bp.boardsApp == nil {
		return 0, nil
	}
	return bp.boardsApp.RunDataRetention(nowTime, batchSize)
}
