// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package product

import (
	"errors"
	"fmt"

	"github.com/mattermost/mattermost-server/v6/app"
	"github.com/mattermost/mattermost-server/v6/product"
)

var errServiceTypeAssert = errors.New("type assertion failed")

func init() {
	app.RegisterProduct("boards", app.ProductManifest{
		Initializer:  newBoards,
		Dependencies: map[app.ServiceKey]struct{}{},
	})
}

type Boards struct {
	teamService    product.TeamService
	channelService product.ChannelService
	userService    product.UserService
	postService    product.PostService
	botService     product.BotService
	clusterService product.ClusterService
	// configService  product.ConfigService
	logService     product.LogService
	licenseService product.LicenseService
	// filestoreService product.FilestoreService
	routerService product.RouterService
}

func newBoards(mmServer *app.Server, services map[app.ServiceKey]interface{}) (app.Product, error) {
	boards := &Boards{}

	for key, service := range services {
		switch key {
		case app.TeamKey:
			teamService, ok := service.(product.TeamService)
			if !ok {
				return nil, fmt.Errorf("invalid service key '%s': %w", key, errServiceTypeAssert)
			}
			boards.teamService = teamService
		case app.ChannelKey:
			channelService, ok := service.(product.ChannelService)
			if !ok {
				return nil, fmt.Errorf("invalid service key '%s': %w", key, errServiceTypeAssert)
			}
			boards.channelService = channelService
		case app.UserKey:
			userService, ok := service.(product.UserService)
			if !ok {
				return nil, fmt.Errorf("invalid service key '%s': %w", key, errServiceTypeAssert)
			}
			boards.userService = userService
		case app.PostKey:
			postService, ok := service.(product.PostService)
			if !ok {
				return nil, fmt.Errorf("invalid service key '%s': %w", key, errServiceTypeAssert)
			}
			boards.postService = postService
		case app.BotKey:
			botService, ok := service.(product.BotService)
			if !ok {
				return nil, fmt.Errorf("invalid service key '%s': %w", key, errServiceTypeAssert)
			}
			boards.botService = botService
		case app.ClusterKey:
			clusterService, ok := service.(product.ClusterService)
			if !ok {
				return nil, fmt.Errorf("invalid service key '%s': %w", key, errServiceTypeAssert)
			}
			boards.clusterService = clusterService
		case app.ConfigKey:
			// TODO
		case app.LogKey:
			logService, ok := service.(product.LogService)
			if !ok {
				return nil, fmt.Errorf("invalid service key '%s': %w", key, errServiceTypeAssert)
			}
			boards.logService = logService
		case app.LicenseKey:
			licenseService, ok := service.(product.LicenseService)
			if !ok {
				return nil, fmt.Errorf("invalid service key '%s': %w", key, errServiceTypeAssert)
			}
			boards.licenseService = licenseService
		case app.FilestoreKey:
			// TODO
		case app.RouterKey:
			routerService, ok := service.(product.RouterService)
			if !ok {
				return nil, fmt.Errorf("invalid service key '%s': %w", key, errServiceTypeAssert)
			}
			boards.routerService = routerService
		case app.HooksKey, app.PermissionsKey:
			// not needed
		}
	}
	return boards, nil
}

func (b *Boards) Start() error {
	return nil
}

func (b *Boards) Stop() error {
	return nil
}
