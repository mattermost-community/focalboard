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

	BlockType string
	OldBlock  *model.Block
	NewBlock  *model.Block

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
	case "board":
		return dg.generateDiffsForBoard(block, schema, hint)
	case "card":
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
	for _, b := range blocks {
		block := b
		if block.Type == "card" {
			cardDiffs, err := dg.generateDiffsForCard(board, &block, schema, hint)
			if err != nil {
				return nil, err
			}
			diffs = append(diffs, cardDiffs)
		}
	}

	return nil, fmt.Errorf("not implemented yet")
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

	diff := &Diff{
		Board:     board,
		Card:      card,
		Username:  hint.Username,
		BlockType: block.Type,
		OldBlock:  &oldBlock,
		NewBlock:  &newBlock,
	}
	return diff, nil
}

/*
func generatePropDiffs(board, oldBlock, newBlock *model.Block) []PropDiff {
	var propDiffs []PropDiff

	boardProps, ok := board.Fields["cardProperties"]
	oldProps, ok2 := oldBlock.Fields["properties"]
	newProps, ok3 := newBlock.Fields["properties"]

	if !ok || !ok2 || !ok3 {
		return propDiffs
	}

	for k, v := range newProps {

	}

}
*/
