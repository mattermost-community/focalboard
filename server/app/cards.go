// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package app

import (
	"errors"
	"fmt"

	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/utils"
)

var ErrNotCardBlock = errors.New("not a card block")

type ErrInvalidFieldType struct {
	field string
}

func (e ErrInvalidFieldType) Error() string {
	return fmt.Sprintf("invalid type for field '%s'", e.field)
}

// card2Block converts a card to block using a shallow copy. Not needed once cards are first class entities.
func card2Block(card *model.Card) *model.Block {
	fields := make(map[string]interface{})

	fields["contentOrder"] = card.ContentOrder
	fields["icon"] = card.Icon
	fields["isTemplate"] = card.IsTemplate
	fields["properties"] = card.Properties

	return &model.Block{
		ID:         card.ID,
		ParentID:   card.BoardID,
		CreatedBy:  card.CreatedBy,
		ModifiedBy: card.ModifiedBy,
		Schema:     1,
		Type:       model.TypeCard,
		Title:      card.Title,
		Fields:     fields,
		CreateAt:   card.CreateAt,
		UpdateAt:   card.UpdateAt,
		DeleteAt:   card.DeleteAt,
		BoardID:    card.BoardID,
	}
}

// block2Card converts a block to a card. Not needed once cards are first class entities.
func block2Card(block *model.Block) (*model.Card, error) {
	if block.Type != model.TypeCard {
		return nil, fmt.Errorf("cannot convert block to card: %w", ErrNotCardBlock)
	}

	contentOrder := make([]string, 0)
	icon := ""
	isTemplate := false
	properties := make(map[string]any)

	if co, ok := block.Fields["contentOrder"]; ok {
		if arr, ok := co.([]any); ok {
			for _, str := range arr {
				if id, ok := str.(string); ok {
					contentOrder = append(contentOrder, id)
				} else {
					return nil, ErrInvalidFieldType{"contentOrder"}
				}
			}
		} else {
			return nil, ErrInvalidFieldType{"contentOrder"}
		}
	}

	if iconAny, ok := block.Fields["icon"]; ok {
		if id, ok := iconAny.(string); ok {
			icon = id
		} else {
			return nil, ErrInvalidFieldType{"icon"}
		}
	}

	if isTemplateAny, ok := block.Fields["isTemplate"]; ok {
		if b, ok := isTemplateAny.(bool); ok {
			isTemplate = b
		} else {
			return nil, ErrInvalidFieldType{"isTemplate"}
		}
	}

	if props, ok := block.Fields["properties"]; ok {
		if propMap, ok := props.(map[string]any); ok {
			for k, v := range propMap {
				properties[k] = v
			}
		} else {
			return nil, ErrInvalidFieldType{"properties"}
		}
	}

	return &model.Card{
		ID:           block.ID,
		BoardID:      block.BoardID,
		CreatedBy:    block.CreatedBy,
		ModifiedBy:   block.ModifiedBy,
		Title:        block.Title,
		ContentOrder: contentOrder,
		Icon:         icon,
		IsTemplate:   isTemplate,
		Properties:   properties,
		CreateAt:     block.CreateAt,
		UpdateAt:     block.UpdateAt,
		DeleteAt:     block.DeleteAt,
	}, nil
}

func (a *App) CreateCard(card *model.Card, boardID string, userID string, disableNotifications bool) (*model.Card, error) {
	// Convert the card struct to a block and insert the block.
	now := utils.GetMillis()

	card.BoardID = boardID
	card.CreatedBy = userID
	card.ModifiedBy = userID
	card.CreateAt = now
	card.UpdateAt = now
	card.DeleteAt = 0

	block := card2Block(card)

	newBlocks, err := a.InsertBlocks([]model.Block{*block}, userID, !disableNotifications)
	if err != nil {
		return nil, fmt.Errorf("cannot create card: %w", err)
	}

	newCard, err := block2Card(&newBlocks[0])
	if err != nil {
		return nil, err
	}

	return newCard, nil
}
