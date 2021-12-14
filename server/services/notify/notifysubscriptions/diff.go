// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package notifysubscriptions

import (
	"fmt"
	"sort"

	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/services/store"

	"github.com/mattermost/mattermost-server/v6/shared/mlog"
)

// Diff represents a difference between two versions of a block.
type Diff struct {
	Board    *model.Block
	Card     *model.Block
	Username string

	BlockType model.BlockType
	OldBlock  *model.Block
	NewBlock  *model.Block

	UpdateAt int64 // the UpdateAt of the latest version of the block

	schemaDiffs []SchemaDiff
	PropDiffs   []PropDiff

	Diffs []*Diff // Diffs for child blocks
}

type PropDiff struct {
	ID       string // property id
	Index    int
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
	board     *model.Block
	card      *model.Block

	store        Store
	hint         *model.NotificationHint
	lastNotifyAt int64
	logger       *mlog.Logger
}

func (dg *diffGenerator) generateDiffs() ([]*Diff, error) {
	// use block_history to fetch blocks in case they were deleted and no longer exist in blocks table.
	opts := model.QueryBlockHistoryOptions{
		Limit:      1,
		Descending: true,
	}
	blocks, err := dg.store.GetBlockHistory(dg.container, dg.hint.BlockID, opts)
	if err != nil {
		return nil, fmt.Errorf("could not get block for notification: %w", err)
	}
	if len(blocks) == 0 {
		return nil, fmt.Errorf("block not found for notification: %w", err)
	}
	block := &blocks[0]

	if dg.board == nil || dg.card == nil {
		return nil, fmt.Errorf("cannot generate diff for block %s; must have a valid board and card: %w", dg.hint.BlockID, err)
	}

	user, err := dg.store.GetUserByID(dg.hint.ModifiedByID)
	if err != nil {
		return nil, fmt.Errorf("could not lookup user %s: %w", dg.hint.ModifiedByID, err)
	}
	if user != nil {
		dg.hint.Username = user.Username
	} else {
		dg.hint.Username = "unknown user" // TODO: localize this when server gets i18n
	}

	// parse board's property schema here so it only happens once.
	schema, err := model.ParsePropertySchema(dg.board)
	if err != nil {
		return nil, fmt.Errorf("could not parse property schema for board %s: %w", dg.board.ID, err)
	}

	switch block.Type {
	case model.TypeBoard:
		return dg.generateDiffsForBoard(block, schema)
	case model.TypeCard:
		diff, err := dg.generateDiffsForCard(block, schema)
		if err != nil || diff == nil {
			return nil, err
		}
		return []*Diff{diff}, nil
	default:
		diff, err := dg.generateDiffForBlock(block, schema)
		if err != nil || diff == nil {
			return nil, err
		}
		return []*Diff{diff}, nil
	}
}

func (dg *diffGenerator) generateDiffsForBoard(board *model.Block, schema model.PropSchema) ([]*Diff, error) {
	opts := model.QuerySubtreeOptions{
		AfterUpdateAt: dg.lastNotifyAt,
	}

	// find all child blocks of the board that updated since last notify.
	blocks, err := dg.store.GetSubTree2(dg.container, board.ID, opts)
	if err != nil {
		return nil, fmt.Errorf("could not get subtree for board %s: %w", board.ID, err)
	}

	var diffs []*Diff

	// generate diff for board title change or description
	boardDiff, err := dg.generateDiffForBlock(board, schema)
	if err != nil {
		return nil, fmt.Errorf("could not generate diff for board %s: %w", board.ID, err)
	}

	if boardDiff != nil {
		// TODO: phase 2 feature (generate schema diffs and add to board diff) goes here.
		diffs = append(diffs, boardDiff)
	}

	for _, b := range blocks {
		block := b
		if block.Type == model.TypeCard {
			cardDiffs, err := dg.generateDiffsForCard(&block, schema)
			if err != nil {
				return nil, err
			}
			diffs = append(diffs, cardDiffs)
		}
	}
	return diffs, nil
}

func (dg *diffGenerator) generateDiffsForCard(card *model.Block, schema model.PropSchema) (*Diff, error) {
	// generate diff for card title change and properties.
	cardDiff, err := dg.generateDiffForBlock(card, schema)
	if err != nil {
		return nil, fmt.Errorf("could not generate diff for card %s: %w", card.ID, err)
	}

	// fetch all card content blocks that were updated after last notify
	opts := model.QuerySubtreeOptions{
		AfterUpdateAt: dg.lastNotifyAt,
	}
	blocks, err := dg.store.GetSubTree2(dg.container, card.ID, opts)
	if err != nil {
		return nil, fmt.Errorf("could not get subtree for card %s: %w", card.ID, err)
	}

	// walk child blocks
	var childDiffs []*Diff
	for i := range blocks {
		if blocks[i].ID == card.ID {
			continue
		}

		blockDiff, err := dg.generateDiffForBlock(&blocks[i], schema)
		if err != nil {
			return nil, fmt.Errorf("could not generate diff for block %s: %w", blocks[i].ID, err)
		}
		if blockDiff != nil {
			childDiffs = append(childDiffs, blockDiff)
		}
	}

	dg.logger.Debug("generateDiffsForCard",
		mlog.Int("subtree", len(blocks)),
		mlog.Int("child_diffs", len(childDiffs)),
	)

	if len(childDiffs) != 0 {
		if cardDiff == nil { // will be nil if the card has no other changes besides child diffs
			cardDiff = &Diff{
				Board:       dg.board,
				Card:        card,
				Username:    dg.hint.Username,
				BlockType:   card.Type,
				OldBlock:    card,
				NewBlock:    card,
				UpdateAt:    card.UpdateAt,
				PropDiffs:   nil,
				schemaDiffs: nil,
			}
		}
		cardDiff.Diffs = childDiffs
	}
	return cardDiff, nil
}

func (dg *diffGenerator) generateDiffForBlock(newBlock *model.Block, schema model.PropSchema) (*Diff, error) {
	// find the version of the block as it was at the time of last notify.
	opts := model.QueryBlockHistoryOptions{
		BeforeUpdateAt: dg.lastNotifyAt,
		Limit:          1,
		Descending:     true,
	}
	history, err := dg.store.GetBlockHistory(dg.container, newBlock.ID, opts)
	if err != nil {
		return nil, fmt.Errorf("could not get block history for block %s: %w", newBlock.ID, err)
	}

	var oldBlock *model.Block
	if len(history) != 0 {
		oldBlock = &history[0]
	}

	propDiffs := dg.generatePropDiffs(oldBlock, newBlock, schema)

	dg.logger.Debug("generateDiffForBlock - results",
		mlog.String("block_id", newBlock.ID),
		mlog.Int64("before_update_at", opts.BeforeUpdateAt),
		mlog.Int("history_count", len(history)),
		mlog.Int("prop_diff_count", len(propDiffs)),
	)

	diff := &Diff{
		Board:       dg.board,
		Card:        dg.card,
		Username:    dg.hint.Username,
		BlockType:   newBlock.Type,
		OldBlock:    oldBlock,
		NewBlock:    newBlock,
		UpdateAt:    newBlock.UpdateAt,
		PropDiffs:   propDiffs,
		schemaDiffs: nil,
	}
	return diff, nil
}

func (dg *diffGenerator) generatePropDiffs(oldBlock, newBlock *model.Block, schema model.PropSchema) []PropDiff {
	var propDiffs []PropDiff

	oldProps, err := model.ParseProperties(oldBlock, schema)
	if err != nil {
		dg.logger.Error("Cannot parse properties for old block",
			mlog.String("block_id", oldBlock.ID),
			mlog.Err(err),
		)
	}

	newProps, err := model.ParseProperties(newBlock, schema)
	if err != nil {
		dg.logger.Error("Cannot parse properties for new block",
			mlog.String("block_id", oldBlock.ID),
			mlog.Err(err),
		)
	}

	// look for new or changed properties.
	for k, prop := range newProps {
		oldP, ok := oldProps[k]
		if ok {
			// prop changed
			if prop.Value != oldP.Value {
				propDiffs = append(propDiffs, PropDiff{
					ID:       prop.ID,
					Index:    prop.Index,
					Name:     prop.Name,
					NewValue: prop.Value,
					OldValue: oldP.Value,
				})
			}
		} else {
			// prop added
			propDiffs = append(propDiffs, PropDiff{
				ID:       prop.ID,
				Index:    prop.Index,
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
				Index:    prop.Index,
				Name:     prop.Name,
				NewValue: "",
				OldValue: prop.Value,
			})
		}
	}
	return sortPropDiffs(propDiffs)
}

func sortPropDiffs(propDiffs []PropDiff) []PropDiff {
	if len(propDiffs) == 0 {
		return propDiffs
	}

	sort.Slice(propDiffs, func(i, j int) bool {
		return propDiffs[i].Index < propDiffs[j].Index
	})
	return propDiffs
}
