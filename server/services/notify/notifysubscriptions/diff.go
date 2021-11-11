// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package notifysubscriptions

import (
	"fmt"

	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/services/store"
)

// Diff represents a difference between two versions of a block.
type Diff struct {
	Board    *model.Block
	Card     *model.Block
	Username string

	BlockType model.BlockType
	OldBlock  *model.Block
	NewBlock  *model.Block

	schemaDiffs []SchemaDiff
	PropDiffs   []PropDiff

	Diffs []*Diff // Diffs for child blocks
}

type PropDiff struct {
	ID       string // property id
	Name     string
	OldValue string
	NewValue string
}

type SchemaDiff struct {
	Board *model.Block

	OldPropDef *model.PropDef
	NewPropDef *model.PropDef
}

type diffGenerator struct {
	container    store.Container
	store        Store
	hint         *model.NotificationHint
	lastNotifyAt int64
}

func newDiffGenerator(container store.Container, store Store, hint *model.NotificationHint, lastNotifyAt int64) *diffGenerator {
	return &diffGenerator{
		container:    container,
		store:        store,
		hint:         hint,
		lastNotifyAt: lastNotifyAt,
	}
}

func (dg *diffGenerator) generateDiffs() ([]*Diff, error) {
	block, err := dg.store.GetBlock(dg.container, dg.hint.BlockID)
	if err != nil || block == nil {
		return nil, fmt.Errorf("could not get block for notification: %w", err)
	}

	board, card, err := dg.store.GetBoardAndCard(dg.container, block)
	if err != nil {
		return nil, fmt.Errorf("could not get block's board & card for notification: %w", err)
	}

	if board == nil || card == nil {
		return nil, fmt.Errorf("cannot generate diff for block %s; must have a valid board and card: %w", dg.hint.BlockID, err)
	}

	user, err := dg.store.GetUserByID(dg.hint.UserID)
	if err != nil {
		return nil, fmt.Errorf("could not lookup user %s: %w", dg.hint.UserID, err)
	}
	if user != nil {
		dg.hint.Username = user.Username
	} else {
		dg.hint.Username = "unknown user" // TODO: localize this when server gets i18n
	}

	// parse board's property schema here so it only happens once.
	schema, err := model.ParsePropertySchema(board)
	if err != nil {
		return nil, fmt.Errorf("could not parse property schema for board %s: %w", board.ID, err)
	}

	switch block.Type {
	case model.TypeBoard:
		return dg.generateDiffsForBoard(block, schema)
	case model.TypeCard:
		diff, err := dg.generateDiffsForCard(board, block, schema)
		if err != nil || diff == nil {
			return nil, err
		}
		return []*Diff{diff}, nil
	default:
		diff, err := dg.generateDiffForBlock(board, card, block, schema)
		if err != nil || diff == nil {
			return nil, err
		}
		return []*Diff{diff}, nil
	}
}

func (dg *diffGenerator) generateDiffsForBoard(board *model.Block, schema model.PropSchema) ([]*Diff, error) {
	opts := model.BlockQueryOptions{
		UseBlocksHistory: true,
		UpdateAfterAt:    dg.lastNotifyAt,
		OrderByInsertAt:  true,
	}

	blocks, err := dg.store.GetSubTree2(dg.container, board.ID, opts)
	if err != nil {
		return nil, fmt.Errorf("could not get subtree for board %s: %w", board.ID, err)
	}

	var diffs []*Diff

	boardDiff, err := dg.generateDiffForBlock(board, nil, board, schema)
	if err != nil {
		return nil, fmt.Errorf("could not generate diff for board %s: %w", board.ID, err)
	}

	if boardDiff != nil {
		// TODO: generate schema diffs and add to board diff
		diffs = append(diffs, boardDiff)
	}

	for _, b := range blocks {
		block := b
		if block.Type == model.TypeCard {
			cardDiffs, err := dg.generateDiffsForCard(board, &block, schema)
			if err != nil {
				return nil, err
			}
			diffs = append(diffs, cardDiffs)
		}
	}
	return diffs, nil
}

func (dg *diffGenerator) generateDiffsForCard(board, card *model.Block, schema model.PropSchema) (*Diff, error) {
	cardDiff, err := dg.generateDiffForBlock(board, card, card, schema)
	if err != nil {
		return nil, fmt.Errorf("could not generate diff for card %s: %w", card.ID, err)
	}

	opts := model.BlockQueryOptions{
		UseBlocksHistory: true,
		UpdateAfterAt:    dg.lastNotifyAt,
		OrderByInsertAt:  true,
	}
	blocks, err := dg.store.GetSubTree2(dg.container, card.ID, opts)
	if err != nil {
		return nil, fmt.Errorf("could not get subtree for card %s: %w", card.ID, err)
	}

	// walk child blocks
	var childDiffs []*Diff
	for i := range blocks {
		blockDiff, err := dg.generateDiffForBlock(board, card, &blocks[i], schema)
		if err != nil {
			return nil, fmt.Errorf("could not generate diff for block %s: %w", blocks[i].ID, err)
		}
		if blockDiff != nil {
			childDiffs = append(childDiffs, blockDiff)
		}
	}

	if len(childDiffs) != 0 {
		if cardDiff == nil { // will be nil if the card has no other changes
			cardDiff = &Diff{
				Board:       board,
				Card:        card,
				Username:    dg.hint.Username,
				BlockType:   card.Type,
				OldBlock:    card,
				NewBlock:    card,
				PropDiffs:   nil,
				schemaDiffs: nil,
			}
		}
		cardDiff.Diffs = childDiffs
	}
	return cardDiff, nil
}

func (dg *diffGenerator) generateDiffForBlock(board, card, block *model.Block, schema model.PropSchema) (*Diff, error) {
	// find the oldest block in blocks_history that is newer than the hint.NotifyAt.
	opts := model.BlockQueryOptions{
		UseBlocksHistory: true,
		UpdateAfterAt:    dg.lastNotifyAt,
		OrderByInsertAt:  true,
	}
	history, err := dg.store.GetBlockHistory(dg.container, block.ID, opts)
	if err != nil {
		return nil, fmt.Errorf("could not get block history for block %s: %w", block.ID, err)
	}

	if len(history) < 2 {
		// this block didn't change
		return nil, nil
	}

	oldBlock := history[0]
	newBlock := history[len(history)-1]

	propDiffs := dg.generatePropDiffs(&oldBlock, &newBlock, schema)

	diff := &Diff{
		Board:       board,
		Card:        card,
		Username:    dg.hint.Username,
		BlockType:   block.Type,
		OldBlock:    &oldBlock,
		NewBlock:    &newBlock,
		PropDiffs:   propDiffs,
		schemaDiffs: nil,
	}
	return diff, nil
}

func (dg *diffGenerator) generatePropDiffs(oldBlock, newBlock *model.Block, schema model.PropSchema) []PropDiff {
	var propDiffs []PropDiff

	oldProps := model.ParseProperties(oldBlock, schema)
	newProps := model.ParseProperties(newBlock, schema)

	// look for new or changed properties.
	for k, prop := range newProps {
		oldP, ok := oldProps[k]
		if !ok {
			// prop changed
			propDiffs = append(propDiffs, PropDiff{
				ID:       prop.ID,
				Name:     prop.Name,
				NewValue: prop.Value,
				OldValue: oldP.Value,
			})
		} else {
			// prop added
			propDiffs = append(propDiffs, PropDiff{
				ID:       prop.ID,
				Name:     prop.Name,
				NewValue: prop.Value,
				OldValue: "",
			})
		}
	}

	// look for deleted properties
	for k, prop := range oldProps {
		_, ok := newProps[k]
		if !ok {
			// prop deleted
			propDiffs = append(propDiffs, PropDiff{
				ID:       prop.ID,
				Name:     prop.Name,
				NewValue: "",
				OldValue: prop.Value,
			})
		}
	}
	return propDiffs
}
