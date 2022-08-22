// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package app

import (
	"fmt"

	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/utils"
)

func (a *App) CreateCard(card *model.Card, boardID string, userID string, disableNotifications bool) (*model.Card, error) {
	// Convert the card struct to a block and insert the block.
	now := utils.GetMillis()

	card.ID = utils.NewID(utils.IDTypeCard)
	card.BoardID = boardID
	card.CreatedBy = userID
	card.ModifiedBy = userID
	card.CreateAt = now
	card.UpdateAt = now
	card.DeleteAt = 0

	block := model.Card2Block(card)

	newBlocks, err := a.InsertBlocks([]model.Block{*block}, userID, !disableNotifications)
	if err != nil {
		return nil, fmt.Errorf("cannot create card: %w", err)
	}

	newCard, err := model.Block2Card(&newBlocks[0])
	if err != nil {
		return nil, err
	}

	return newCard, nil
}

func (a *App) PatchCard(cardPatch *model.CardPatch, cardID string, userID string, disableNotifications bool) (*model.Card, error) {
	blockPatch, err := model.CardPatch2BlockPatch(cardPatch)
	if err != nil {
		return nil, err
	}

	newBlock, err := a.PatchBlock(cardID, blockPatch, userID, !disableNotifications)
	if err != nil {
		return nil, fmt.Errorf("cannot patch card %s: %w", cardID, err)
	}

	newCard, err := model.Block2Card(newBlock)
	if err != nil {
		return nil, err
	}

	return newCard, nil
}

func (a *App) GetCardByID(cardID string) (*model.Card, error) {
	cardBlock, err := a.GetBlockByID(cardID)
	if err != nil {
		return nil, err
	}

	card, err := model.Block2Card(cardBlock)
	if err != nil {
		return nil, err
	}

	return card, nil
}
