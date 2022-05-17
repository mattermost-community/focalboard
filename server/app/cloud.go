// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package app

import (
	"github.com/mattermost/focalboard/server/model"

	mmModel "github.com/mattermost/mattermost-server/v6/model"
)

// GetBoardsCloudLimits returns the limits of the server, and an empty
// limits struct if there are no limits set
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

	boardsCloudLimits := &model.BoardsCloudLimits{
		UsedCards: usedCards,
		CardLimitTimestamp: a.CardLimitTimestamp,
	}
	if productLimits != nil && productLimits.Boards != nil {
		boardsCloudLimits.Cards = *productLimits.Boards.Cards
		boardsCloudLimits.Views = *productLimits.Boards.Views
	}

	return boardsCloudLimits, nil
}

// IsCloud returns true if the server is running as a plugin in a
// cloud licensed server
func (a *App) IsCloud() bool {
	license := a.store.GetLicense()
	if license == nil {
		return false
	}
	return *license.Features.Cloud
}

// IsCloudLimited returns true if the server is running in cloud mode
// and the card limit has been set
func (a *App) IsCloudLimited() bool {
	return a.IsCloud() && a.CardLimit != 0
}

// SetCloudLimits sets the limits of the server
func (a *App) SetCloudLimits(limits *mmModel.ProductLimits) error {
	// if the limit object doesn't come complete, we assume limits are
	// being disabled
	cardLimit := 0
	if limits != nil && limits.Boards != nil {
		cardLimit = *limits.Boards.Cards
	}

	a.CardLimit = cardLimit
	return a.UpdateCardLimitTimestamp()
}

// ToDo: test
func (a *App) UpdateCardLimitTimestamp() error {
	if !a.IsCloudLimited() {
		return nil
	}

	cardLimitTimestamp, err := a.store.GetCardLimitTimestamp(a.CardLimit)
	if err != nil {
		return err
	}
	a.CardLimitTimestamp = cardLimitTimestamp

	a.wsAdapter.BroadcastCardLimitTimestampChange(a.CardLimitTimestamp)

	return nil
}

// ToDo: test
func (a *App) ApplyCloudLimits(blocks []model.Block) []model.Block {
	// if there is no limit currently being applied, return
	if !a.IsCloudLimited() {
		return blocks
	}

	// ToDo:
	// 1-get limited cards only on a map
	// 2-iterate through all the blocks, limiting those that either
	// are limited cards or are linked to them

	limitedBlocks := make([]model.Block, len(blocks))
	for i, block := range blocks {
		if block.Type != model.TypeBoard &&
			block.Type != model.TypeView &&
			block.UpdateAt < a.CardLimitTimestamp {
			limitedBlocks[i] = block.GetLimited()
		} else {
			limitedBlocks[i] = block
		}
	}

	return limitedBlocks
}
