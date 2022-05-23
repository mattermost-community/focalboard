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

// GetBoardsCloudLimits returns the limits of the server, and an empty
// limits struct if there are no limits set.
func (a *App) GetBoardsCloudLimits() (*model.BoardsCloudLimits, error) {
	if !a.IsCloud() {
		return &model.BoardsCloudLimits{}, nil
	}

	productLimits, err := a.store.GetCloudLimits()
	if err != nil {
		return nil, err
	}

	usedCards, err := a.store.GetUsedCardsCount()
	if err != nil {
		return nil, err
	}

	cardLimitTimestamp, err := a.store.GetCardLimitTimestamp()
	if err != nil {
		return nil, err
	}

	boardsCloudLimits := &model.BoardsCloudLimits{
		UsedCards:          usedCards,
		CardLimitTimestamp: cardLimitTimestamp,
	}
	if productLimits != nil && productLimits.Boards != nil {
		boardsCloudLimits.Cards = *productLimits.Boards.Cards
		boardsCloudLimits.Views = *productLimits.Boards.Views
	}

	return boardsCloudLimits, nil
}

// IsCloud returns true if the server is running as a plugin in a
// cloud licensed server.
func (a *App) IsCloud() bool {
	return utils.IsCloudLicense(a.store.GetLicense())
}

// IsCloudLimited returns true if the server is running in cloud mode
// and the card limit has been set.
func (a *App) IsCloudLimited() bool {
	return a.CardLimit != 0 && a.IsCloud()
}

// SetCloudLimits sets the limits of the server.
func (a *App) SetCloudLimits(limits *mmModel.ProductLimits) error {
	oldCardLimit := a.CardLimit

	// if the limit object doesn't come complete, we assume limits are
	// being disabled
	cardLimit := 0
	if limits != nil && limits.Boards != nil {
		cardLimit = *limits.Boards.Cards
	}
	a.CardLimit = cardLimit

	if oldCardLimit != cardLimit {
		return a.doUpdateCardLimitTimestamp()
	}

	return nil
}

// doUpdateCardLimitTimestamp performs the update without running any
// checks.
func (a *App) doUpdateCardLimitTimestamp() error {
	cardLimitTimestamp, err := a.store.UpdateCardLimitTimestamp(a.CardLimit)
	if err != nil {
		return err
	}

	a.wsAdapter.BroadcastCardLimitTimestampChange(cardLimitTimestamp)

	return nil
}

// UpdateCardLimitTimestamp checks if the server is a cloud instance
// with limits applied, and if that's true, recalculates the card
// limit timestamp and propagates the new one to the connected
// clients.
func (a *App) UpdateCardLimitTimestamp() error {
	if !a.IsCloudLimited() {
		return nil
	}

	return a.doUpdateCardLimitTimestamp()
}

func (a *App) ApplyCloudLimits(blocks []model.Block) ([]model.Block, error) {
	// if there is no limit currently being applied, return
	if !a.IsCloudLimited() {
		return blocks, nil
	}

	cardLimitTimestamp, err := a.store.GetCardLimitTimestamp()
	if err != nil {
		return nil, err
	}

	// ToDo:
	// 1-get limited cards only on a map
	// 2-iterate through all the blocks, limiting those that either
	// are limited cards or are linked to them

	limitedBlocks := make([]model.Block, len(blocks))
	for i, block := range blocks {
		if block.Type != model.TypeBoard &&
			block.Type != model.TypeView &&
			block.UpdateAt < cardLimitTimestamp {
			limitedBlocks[i] = block.GetLimited()
		} else {
			limitedBlocks[i] = block
		}
	}

	return limitedBlocks, nil
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
