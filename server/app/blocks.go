package app

import (
	"errors"

	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/services/notify"

	"github.com/mattermost/mattermost-server/v6/shared/mlog"
)

var BlocksFromMultipleBoardsErr = errors.New("the block set contain blocks from multiple boards")

func (a *App) GetBlocks(boardID, parentID string, blockType string) ([]model.Block, error) {
	if boardID == "" {
		return []model.Block{}, nil
	}

	if blockType != "" && parentID != "" {
		return a.store.GetBlocksWithParentAndType(boardID, parentID, blockType)
	}

	if blockType != "" {
		return a.store.GetBlocksWithType(boardID, blockType)
	}

	return a.store.GetBlocksWithParent(boardID, parentID)
}

func (a *App) GetBlockWithID(blockID string) (*model.Block, error) {
	return a.store.GetBlock(blockID)
}

func (a *App) GetBlocksWithRootID(boardID, rootID string) ([]model.Block, error) {
	return a.store.GetBlocksWithRootID(boardID, rootID)
}

func (a *App) PatchBlock(blockID string, blockPatch *model.BlockPatch, userID string) error {
	oldBlock, err := a.store.GetBlock(blockID)
	if err != nil {
		return nil
	}

	board, err := a.store.GetBoard(oldBlock.BoardID)
	if err != nil {
		return err
	}

	err = a.store.PatchBlock(blockID, blockPatch, userID)
	if err != nil {
		return err
	}

	a.metrics.IncrementBlocksPatched(1)
	block, err := a.store.GetBlock(blockID)
	if err != nil {
		return nil
	}
	go func() {
		// broadcast on websocket
		a.wsAdapter.BroadcastBlockChange(board.TeamID, *block)

		// broadcast on webhooks
		a.webhook.NotifyUpdate(*block)

		// send notifications
		a.notifyBlockChanged(notify.Update, block, oldBlock, userID)
	}()
	return nil
}

func (a *App) InsertBlock(block model.Block, userID string) error {
	board, err := a.store.GetBoard(block.BoardID)
	if err != nil {
		return err
	}

	if err := a.store.InsertBlock(&block, userID); err == nil {
		go func() {
			a.wsAdapter.BroadcastBlockChange(board.TeamID, block)
			a.metrics.IncrementBlocksInserted(1)
			a.webhook.NotifyUpdate(block)
			a.notifyBlockChanged(notify.Add, &block, nil, userID)
		}()
	}
	return err
}

func (a *App) InsertBlocks(blocks []model.Block, userID string, allowNotifications bool) ([]model.Block, error) {
	if len(blocks) == 0 {
		return []model.Block{}, nil
	}

	// all blocks must belong to the same board
	boardID := blocks[0].BoardID
	for _, block := range blocks {
		if block.BoardID != boardID {
			return nil, BlocksFromMultipleBoardsErr
		}
	}

	board, err := a.store.GetBoard(boardID)
	if err != nil {
		return nil, err
	}

	needsNotify := make([]model.Block, 0, len(blocks))
	for i := range blocks {
		if err := a.store.InsertBlock(&blocks[i], userID); err != nil {
			return nil, err
		}
		needsNotify = append(needsNotify, blocks[i])

		a.wsAdapter.BroadcastBlockChange(board.TeamID, blocks[i])
		a.metrics.IncrementBlocksInserted(1)
	}

	go func() {
		for _, b := range needsNotify {
			block := b
			a.webhook.NotifyUpdate(block)
			if allowNotifications {
				a.notifyBlockChanged(notify.Add, &block, nil, userID)
			}
		}
	}()

	return blocks, nil
}

func (a *App) GetSubTree(boardID, blockID string, levels int) ([]model.Block, error) {
	// Only 2 or 3 levels are supported for now
	if levels >= 3 {
		return a.store.GetSubTree3(boardID, blockID)
	}

	return a.store.GetSubTree2(boardID, blockID)
}

func (a *App) DeleteBlock(blockID string, modifiedBy string) error {
	block, err := a.store.GetBlock(blockID)
	if err != nil {
		return err
	}

	board, err := a.store.GetBoard(block.BoardID)
	if err != nil {
		return err
	}

	err = a.store.DeleteBlock(blockID, modifiedBy)
	if err != nil {
		return err
	}

	go func() {
		a.wsAdapter.BroadcastBlockDelete(board.TeamID, blockID, block.BoardID)
		a.metrics.IncrementBlocksDeleted(1)
		a.notifyBlockChanged(notify.Update, block, block, modifiedBy)
	}()
	return nil
}

func (a *App) GetBlockCountsByType() (map[string]int64, error) {
	return a.store.GetBlockCountsByType()
}

func (a *App) GetBlocksForBoard(boardID string) ([]model.Block, error) {
	return a.store.GetBlocksForBoard(boardID)
}

func (a *App) notifyBlockChanged(action notify.Action, block *model.Block, oldBlock *model.Block, userID string) {
	if a.notifications == nil {
		return
	}

	// find card and board for the changed block.
	board, card, err := a.getBoardAndCard(block)
	if err != nil {
		a.logger.Error("Error notifying for block change; cannot determine board or card", mlog.Err(err))
		return
	}

	evt := notify.BlockChangeEvent{
		Action:       action,
		Team:         board.TeamID,
		Board:        board,
		Card:         card,
		BlockChanged: block,
		BlockOld:     oldBlock,
		UserID:       userID,
	}
	a.notifications.BlockChanged(evt)
}

const (
	maxSearchDepth = 50
)

// getBoardAndCard returns the first parent of type `card` its board for the specified block.
// `board` and/or `card` may return nil without error if the block does not belong to a board or card.
func (a *App) getBoardAndCard(block *model.Block) (board *model.Board, card *model.Block, err error) {
	board, err = a.store.GetBoard(block.BoardID)
	if err != nil {
		return board, card, err
	}

	var count int // don't let invalid blocks hierarchy cause infinite loop.
	iter := block
	for {
		count++
		if card == nil && iter.Type == model.TypeCard {
			card = iter
		}

		if iter.ParentID == "" || (board != nil && card != nil) || count > maxSearchDepth {
			break
		}

		iter, err = a.store.GetBlock(iter.ParentID)
		if err != nil {
			return board, card, err
		}
	}
	return board, card, nil
}
