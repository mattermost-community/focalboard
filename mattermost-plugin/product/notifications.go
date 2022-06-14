// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package product

import (
	"fmt"

	"github.com/mattermost/focalboard/server/services/config"
	"github.com/mattermost/focalboard/server/services/notify/notifymentions"
	"github.com/mattermost/focalboard/server/services/notify/notifysubscriptions"
	"github.com/mattermost/focalboard/server/services/notify/plugindelivery"
	"github.com/mattermost/focalboard/server/services/permissions"
	"github.com/mattermost/focalboard/server/services/store"
	"github.com/mattermost/focalboard/server/ws"

	"github.com/mattermost/mattermost-server/v6/model"

	"github.com/mattermost/mattermost-server/v6/shared/mlog"
)

const (
	botUsername    = "boards"
	botDisplayname = "Boards"
	botDescription = "Created by Boards plugin."
)

type notifyBackendParams struct {
	cfg         *config.Configuration
	pluginAPI   *pluginDeliveriyAPIImpl
	permissions permissions.PermissionsService
	store       store.Store
	wsAdapter   ws.Adapter
	serverRoot  string
	logger      *mlog.Logger
}

func createMentionsNotifyBackend(params notifyBackendParams) (*notifymentions.Backend, error) {
	delivery, err := createDelivery(params.pluginAPI, params.serverRoot)
	if err != nil {
		return nil, err
	}

	backendParams := notifymentions.BackendParams{
		Store:       params.store,
		Permissions: params.permissions,
		Delivery:    delivery,
		WSAdapter:   params.wsAdapter,
		Logger:      params.logger,
	}

	backend := notifymentions.New(backendParams)

	return backend, nil
}

func createSubscriptionsNotifyBackend(params notifyBackendParams) (*notifysubscriptions.Backend, error) {
	delivery, err := createDelivery(params.pluginAPI, params.serverRoot)
	if err != nil {
		return nil, err
	}

	backendParams := notifysubscriptions.BackendParams{
		ServerRoot:             params.serverRoot,
		Store:                  params.store,
		Permissions:            params.permissions,
		Delivery:               delivery,
		WSAdapter:              params.wsAdapter,
		Logger:                 params.logger,
		NotifyFreqCardSeconds:  params.cfg.NotifyFreqCardSeconds,
		NotifyFreqBoardSeconds: params.cfg.NotifyFreqBoardSeconds,
	}
	backend := notifysubscriptions.New(backendParams)

	return backend, nil
}

func createDelivery(pd *pluginDeliveriyAPIImpl, serverRoot string) (*plugindelivery.PluginDelivery, error) {
	bot := &model.Bot{
		Username:    botUsername,
		DisplayName: botDisplayname,
		Description: botDescription,
	}
	botID, err := pd.EnsureBot(bot)
	if err != nil {
		return nil, fmt.Errorf("failed to ensure %s bot: %w", botDisplayname, err)
	}

	return plugindelivery.New(botID, serverRoot, pd), nil
}
