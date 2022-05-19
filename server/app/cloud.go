// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package app

import (
	"errors"
	"fmt"

	"github.com/mattermost/focalboard/server/utils"

	"github.com/mattermost/mattermost-server/v6/shared/mlog"

	"github.com/mattermost/focalboard/server/model"
	mmModel "github.com/mattermost/mattermost-server/v6/model"
)

var ErrNilPluginAPI = errors.New("server not running in plugin mode")

func (a *App) GetBoardsCloudLimits() (*model.BoardsCloudLimits, error) {
	if a.pluginAPI == nil {
		return nil, ErrNilPluginAPI
	}

	if !utils.IsCloudLicense(a.store.GetLicense()) {
		return &model.BoardsCloudLimits{}, nil
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
	if a.pluginAPI == nil {
		return ErrNilPluginAPI
	}

	team, err := a.store.GetWorkspaceTeam(workspaceID)
	if err != nil {
		return err
	}

	var ofWhat string
	if team == nil {
		ofWhat = "your organization"
	} else {
		ofWhat = team.DisplayName
	}

	message := fmt.Sprintf("A member of %s has notified you to upgrade this workspace before the trial ends.", ofWhat)

	page := 0
	getUsersOptions := &mmModel.UserGetOptions{
		Active:  true,
		Role:    mmModel.SystemAdminRoleId,
		PerPage: 50,
		Page:    page,
	}

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

		receiptUserIDs := []string{}
		for _, systemAdmin := range systemAdmins {
			receiptUserIDs = append(receiptUserIDs, systemAdmin.Id)
		}

		if err := a.store.SendMessage(message, "custom_cloud_upgrade_nudge", receiptUserIDs); err != nil {
			return err
		}
	}

	return nil
}
