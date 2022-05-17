// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package app

import (
	"errors"
	"fmt"
	"github.com/mattermost/mattermost-server/v6/shared/mlog"

	"github.com/mattermost/focalboard/server/model"
	mmModel "github.com/mattermost/mattermost-server/v6/model"
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

	if a.pluginAPI == nil {
		return ErrNilPluginAPI
	}

	message := fmt.Sprintf("A member of %s has notified you to upgrade this workspace before the trial ends.", team.DisplayName)

	page := 0
	getUsersOptions := &mmModel.UserGetOptions{
		Active:  true,
		Role:    mmModel.SystemAdminRoleId,
		PerPage: 50,
		Page:    page,
	}

	receiptUserIDs := []string{}

	for ; true; page++ {
		getUsersOptions.Page = page
		systemAdmins, appErr := a.pluginAPI.GetUsers(getUsersOptions)
		if appErr != nil {
			a.logger.Error("failed to fetch system admins", mlog.Int("page_size", getUsersOptions.PerPage), mlog.Int("page", page), mlog.Err(appErr))
			return appErr
		}

		if len(systemAdmins) == 0 {
			break
		}

		for _, systemAdmin := range systemAdmins {
			receiptUserIDs = append(receiptUserIDs, systemAdmin.Id)
		}
	}

	return a.store.SendMessage(message, receiptUserIDs)
}
