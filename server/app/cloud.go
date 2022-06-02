// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package app

import (
	"errors"
	"fmt"

	mmModel "github.com/mattermost/mattermost-server/v6/model"
	"github.com/mattermost/mattermost-server/v6/shared/mlog"

	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/services/store"
	"github.com/mattermost/focalboard/server/utils"
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
		if productLimits.Boards.Cards != nil {
			boardsCloudLimits.Cards = *productLimits.Boards.Cards
		}
		if productLimits.Boards.Views != nil {
			boardsCloudLimits.Views = *productLimits.Boards.Views
		}
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
	return a.CardLimit() != 0 && a.IsCloud()
}

// SetCloudLimits sets the limits of the server.
func (a *App) SetCloudLimits(limits *mmModel.ProductLimits) error {
	oldCardLimit := a.CardLimit()

	// if the limit object doesn't come complete, we assume limits are
	// being disabled
	cardLimit := 0
	if limits != nil && limits.Boards != nil && limits.Boards.Cards != nil {
		cardLimit = *limits.Boards.Cards
	}

	if oldCardLimit != cardLimit {
		a.SetCardLimit(cardLimit)
		return a.doUpdateCardLimitTimestamp()
	}

	return nil
}

// doUpdateCardLimitTimestamp performs the update without running any
// checks.
func (a *App) doUpdateCardLimitTimestamp() error {
	cardLimitTimestamp, err := a.store.UpdateCardLimitTimestamp(a.CardLimit())
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

// getTemplateMapForBlocks gets all board ids for the blocks, directly
// from the list if the boards are present or fetching them if
// necessary, and builds a map with the board IDs as the key and their
// isTemplate field as the value.
func (a *App) getTemplateMapForBlocks(c store.Container, blocks []model.Block) (map[string]bool, error) {
	boards := []model.Block{}
	boardIDMap := map[string]bool{}
	for _, block := range blocks {
		if block.Type == model.TypeBoard {
			boards = append(boards, block)
		} else {
			boardIDMap[block.RootID] = true
		}
	}

	boardIDs := []string{}
	// if the board is already part of the block set, we don't need to
	// fetch it from the database
	for boardID := range boardIDMap {
		alreadyPresent := false
		for _, board := range boards {
			if board.ID == boardID {
				alreadyPresent = true
				break
			}
		}

		if !alreadyPresent {
			boardIDs = append(boardIDs, boardID)
		}
	}

	if len(boardIDs) != 0 {
		fetchedBoards, err := a.store.GetBlocksByIDs(c, boardIDs)
		if err != nil {
			return nil, err
		}
		boards = append(boards, fetchedBoards...)
	}

	templateMap := map[string]bool{}
	for _, board := range boards {
		if isTemplateStr, ok := board.Fields["isTemplate"]; ok {
			isTemplate, ok := isTemplateStr.(bool)
			if !ok {
				return nil, newErrInvalidIsTemplate(board.ID)
			}
			templateMap[board.ID] = isTemplate
		} else {
			templateMap[board.ID] = false
		}
	}

	return templateMap, nil
}

// ApplyCloudLimits takes a set of blocks and, if the server is cloud
// limited, limits those that are outside of the card limit and don't
// belong to a template.
func (a *App) ApplyCloudLimits(c store.Container, blocks []model.Block) ([]model.Block, error) {
	// if there is no limit currently being applied, return
	if !a.IsCloudLimited() {
		return blocks, nil
	}

	cardLimitTimestamp, err := a.store.GetCardLimitTimestamp()
	if err != nil {
		return nil, err
	}

	templateMap, err := a.getTemplateMapForBlocks(c, blocks)
	if err != nil {
		return nil, err
	}

	limitedBlocks := make([]model.Block, len(blocks))
	for i, block := range blocks {
		// boards are never limited
		if block.Type == model.TypeBoard {
			limitedBlocks[i] = block
			continue
		}

		isTemplate, ok := templateMap[block.RootID]
		if !ok {
			return nil, newErrBoardNotFoundInTemplateMap(block.RootID)
		}

		// if the block belongs to a template, it will never be
		// limited
		if isTemplate {
			limitedBlocks[i] = block
			continue
		}

		if block.ShouldBeLimited(cardLimitTimestamp) {
			limitedBlocks[i] = block.GetLimited()
		} else {
			limitedBlocks[i] = block
		}
	}

	return limitedBlocks, nil
}

// ContainsLimitedBlocks checks if a list of block IDs contain any
// block that references a limited card.
func (a *App) ContainsLimitedBlocks(c store.Container, blocks []model.Block) (bool, error) {
	cardLimitTimestamp, err := a.store.GetCardLimitTimestamp()
	if err != nil {
		return false, err
	}

	if cardLimitTimestamp == 0 {
		return false, nil
	}

	cards := []model.Block{}
	cardIDMap := map[string]bool{}
	for _, block := range blocks {
		switch block.Type {
		case model.TypeBoard:
		case model.TypeCard:
			cards = append(cards, block)
		default:
			cardIDMap[block.ParentID] = true
		}
	}

	cardIDs := []string{}
	// if the card is already present on the set, we don't need to
	// fetch it from the database
	for cardID := range cardIDMap {
		alreadyPresent := false
		for _, card := range cards {
			if card.ID == cardID {
				alreadyPresent = true
				break
			}
		}

		if !alreadyPresent {
			cardIDs = append(cardIDs, cardID)
		}
	}

	if len(cardIDs) > 0 {
		fetchedCards, fErr := a.store.GetBlocksByIDs(c, cardIDs)
		if fErr != nil {
			return false, fErr
		}
		cards = append(cards, fetchedCards...)
	}

	templateMap, err := a.getTemplateMapForBlocks(c, blocks)
	if err != nil {
		return false, err
	}

	for _, card := range cards {
		isTemplate, ok := templateMap[card.RootID]
		if !ok {
			return false, newErrBoardNotFoundInTemplateMap(card.RootID)
		}

		// if the block belongs to a template, it will never be
		// limited
		if isTemplate {
			continue
		}

		if card.ShouldBeLimited(cardLimitTimestamp) {
			return true, nil
		}
	}

	return false, nil
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

type errInvalidIsTemplate struct {
	id string
}

func newErrInvalidIsTemplate(id string) *errInvalidIsTemplate {
	return &errInvalidIsTemplate{id}
}

func (ei *errInvalidIsTemplate) Error() string {
	return fmt.Sprintf("invalid isTemplate field value for board %q", ei.id)
}

type errBoardNotFoundInTemplateMap struct {
	id string
}

func newErrBoardNotFoundInTemplateMap(id string) *errBoardNotFoundInTemplateMap {
	return &errBoardNotFoundInTemplateMap{id}
}

func (eb *errBoardNotFoundInTemplateMap) Error() string {
	return fmt.Sprintf("board %q not found in template map", eb.id)
}
