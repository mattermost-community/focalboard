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
	container store.Container
	store     Store
}

func newDiffGenerator(container store.Container, store Store) *diffGenerator {
	return &diffGenerator{
		container: container,
		store:     store,
	}
}

func (dg *diffGenerator) generateDiffs(c store.Container, hint *model.NotificationHint) ([]*Diff, error) {
	block, err := dg.store.GetBlock(c, hint.BlockID)
	if err != nil {
		return nil, fmt.Errorf("could not get block for notification: %w", err)
	}

	board, card, err := dg.store.GetBoardAndCard(c, block)
	if err != nil {
		return nil, fmt.Errorf("could not get block's board & card for notification: %w", err)
	}

	if board == nil || card == nil {
		return nil, fmt.Errorf("cannot generate diff for block %s; must have a valid board and card: %w", hint.BlockID, err)
	}

	user, err := dg.store.GetUserByID(hint.UserID)
	if err != nil {
		return nil, fmt.Errorf("could not lookup user %s: %w", hint.UserID, err)
	}
	hint.Username = user.Username

	// parse board's property schema here so it only happens once.
	schema, err := model.ParsePropertySchema(board)
	if err != nil {
		return nil, fmt.Errorf("could not parse property schema for board %s: %w", board.ID, err)
	}

	switch block.Type {
	case model.TypeBoard:
		return dg.generateDiffsForBoard(block, schema, hint)
	case model.TypeCard:
		diff, err := dg.generateDiffsForCard(board, block, schema, hint)
		if err != nil {
			return nil, err
		}
		return []*Diff{diff}, nil
	default:
		diff, err := dg.generateDiffForBlock(board, card, block, schema, hint)
		if err != nil {
			return nil, err
		}
		return []*Diff{diff}, nil
	}
}

func (dg *diffGenerator) generateDiffsForBoard(board *model.Block, schema model.PropSchema, hint *model.NotificationHint) ([]*Diff, error) {
	opts := model.BlockQueryOptions{
		UseBlocksHistory: true,
		InsertAfterAt:    hint.NotifyAt,
		OrderByInsertAt:  true,
	}

	blocks, err := dg.store.GetSubTree2FromHistory(dg.container, board.ID, opts)
	if err != nil {
		return nil, fmt.Errorf("could not get subtree for board %s: %w", board.ID, err)
	}

	var diffs []*Diff

	boardDiff, err := dg.generateDiffForBlock(board, nil, board, schema, hint)
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
			cardDiffs, err := dg.generateDiffsForCard(board, &block, schema, hint)
			if err != nil {
				return nil, err
			}
			diffs = append(diffs, cardDiffs)
		}
	}
	return diffs, nil
}

func (dg *diffGenerator) generateDiffsForCard(board, card *model.Block, schema model.PropSchema, hint *model.NotificationHint) (*Diff, error) {
	cardDiff, err := dg.generateDiffForBlock(board, card, card, schema, hint)
	if err != nil {
		return nil, fmt.Errorf("could not generate diff for card %s: %w", card.ID, err)
	}

	// walk child blocks
	opts := model.BlockQueryOptions{
		UseBlocksHistory: true,
		InsertAfterAt:    hint.NotifyAt,
		OrderByInsertAt:  true,
	}
	blocks, err := dg.store.GetSubTree2FromHistory(dg.container, card.ID, opts)
	if err != nil {
		return nil, fmt.Errorf("could not get subtree for card %s: %w", card.ID, err)
	}

	for i := range blocks {
		blockDiff, err := dg.generateDiffForBlock(board, card, &blocks[i], schema, hint)
		if err != nil {
			return nil, fmt.Errorf("could not get subtree for card %s: %w", card.ID, err)
		}
		cardDiff.Diffs = append(cardDiff.Diffs, blockDiff)
	}
	return cardDiff, nil
}

func (dg *diffGenerator) generateDiffForBlock(board, card, block *model.Block, schema model.PropSchema, hint *model.NotificationHint) (*Diff, error) {
	// find the oldest block in blocks_history that is newer than the hint.NotifyAt.
	opts := model.BlockQueryOptions{
		UseBlocksHistory: true,
		InsertAfterAt:    hint.NotifyAt,
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
		Username:    hint.Username,
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
