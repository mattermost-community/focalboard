// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package app

import (
	"errors"
	"fmt"

	"github.com/mattermost/focalboard/server/model"
)

var ErrNilPluginAPI = errors.New("server not running in plugin mode")

func (a *App) GetBoardsCloudLimits() (*model.BoardsCloudLimits, error) {
	if a.pluginAPI == nil {
		return nil, ErrNilPluginAPI
	}

	productLimits, err := a.pluginAPI.GetCloudLimits()
	if err != nil {
		return nil, err
	}

	boardsCloudLimits := &model.BoardsCloudLimits{}
	if productLimits != nil && productLimits.Boards != nil {
		boardsCloudLimits.Cards = *productLimits.Boards.Cards
		boardsCloudLimits.Views = *productLimits.Boards.Views
	}

	return boardsCloudLimits, nil
}

func (a *App) NotifyPortalAdminsUpgradeRequest(workspaceID string) error {
	team, err := a.store.GetWorkspaceTeam(workspaceID)
	if err != nil {
		return err
	}

	message := fmt.Sprintf("A member of %s has notified you to upgrade this workspace before the trial ends.", team.DisplayName)
	receipt, err := a.store.GetPortalAdmin()
	if err != nil {
		return err
	}

	return a.store.SendMessage(message, []string{receipt.Id})
}
