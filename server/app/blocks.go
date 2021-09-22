package app

import (
	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/services/notify"
	"github.com/mattermost/focalboard/server/services/store"

	"github.com/mattermost/mattermost-server/v6/shared/mlog"
)

func (a *App) GetBlocks(c store.Container, parentID string, blockType string) ([]model.Block, error) {
	if blockType != "" && parentID != "" {
		return a.store.GetBlocksWithParentAndType(c, parentID, blockType)
	}

	if blockType != "" {
		return a.store.GetBlocksWithType(c, blockType)
	}

	return a.store.GetBlocksWithParent(c, parentID)
}

func (a *App) GetBlocksWithRootID(c store.Container, rootID string) ([]model.Block, error) {
	return a.store.GetBlocksWithRootID(c, rootID)
}

func (a *App) GetRootID(c store.Container, blockID string) (string, error) {
	return a.store.GetRootID(c, blockID)
}

func (a *App) GetParentID(c store.Container, blockID string) (string, error) {
	return a.store.GetParentID(c, blockID)
}

func (a *App) PatchBlock(c store.Container, blockID string, blockPatch *model.BlockPatch, userID string) error {
	oldBlock, err := a.store.GetBlock(c, blockID)
	if err != nil {
		return nil
	}

	err = a.store.PatchBlock(c, blockID, blockPatch, userID)
	if err != nil {
		return err
	}

	a.metrics.IncrementBlocksPatched(1)
	block, err := a.store.GetBlock(c, blockID)
	if err != nil {
		return nil
	}
	a.wsAdapter.BroadcastBlockChange(c.WorkspaceID, *block)
	go func() {
		a.webhook.NotifyUpdate(*block)
		a.notifyBlockChanged(notify.Update, c, block, oldBlock, userID)
	}()
	return nil
}

func (a *App) InsertBlock(c store.Container, block model.Block, userID string) error {
	err := a.store.InsertBlock(c, &block, userID)
	if err == nil {
		a.wsAdapter.BroadcastBlockChange(c.WorkspaceID, block)
		a.metrics.IncrementBlocksInserted(1)
		go func() {
			a.webhook.NotifyUpdate(block)
			a.notifyBlockChanged(notify.Add, c, &block, nil, userID)
		}()
	}
	return err
}

func (a *App) InsertBlocks(c store.Container, blocks []model.Block, userID string) error {
	needsNotify := make([]model.Block, 0, len(blocks))
	for i := range blocks {
		err := a.store.InsertBlock(c, &blocks[i], userID)
		if err != nil {
			return err
		}
		blocks[i].WorkspaceID = c.WorkspaceID
		needsNotify = append(needsNotify, blocks[i])

		a.wsAdapter.BroadcastBlockChange(c.WorkspaceID, blocks[i])
		a.metrics.IncrementBlocksInserted(1)
	}

	go func() {
		for _, b := range needsNotify {
			block := b
			a.webhook.NotifyUpdate(block)
			a.notifyBlockChanged(notify.Add, c, &block, nil, userID)
		}
	}()

	return nil
}

func (a *App) GetSubTree(c store.Container, blockID string, levels int) ([]model.Block, error) {
	// Only 2 or 3 levels are supported for now
	if levels >= 3 {
		return a.store.GetSubTree3(c, blockID)
	}
	return a.store.GetSubTree2(c, blockID)
}

func (a *App) GetAllBlocks(c store.Container) ([]model.Block, error) {
	return a.store.GetAllBlocks(c)
}

func (a *App) DeleteBlock(c store.Container, blockID string, modifiedBy string) error {
	block, err := a.store.GetBlock(c, blockID)
	if err != nil {
		return err
	}

	err = a.store.DeleteBlock(c, blockID, modifiedBy)
	if err != nil {
		return err
	}

	a.wsAdapter.BroadcastBlockDelete(c.WorkspaceID, blockID, block.ParentID)
	a.metrics.IncrementBlocksDeleted(1)
	go func() {
		a.notifyBlockChanged(notify.Update, c, block, block, modifiedBy)
	}()
	return nil
}

func (a *App) GetBlockCountsByType() (map[string]int64, error) {
	return a.store.GetBlockCountsByType()
}

func (a *App) notifyBlockChanged(action notify.Action, c store.Container, block *model.Block, oldBlock *model.Block, userID string) {
	if a.notifications == nil {
		return
	}

	// find card and board for the changed block.
	board, card, err := a.getBoardAndCard(c, block)
	if err != nil {
		a.logger.Error("Error notifying for block change; cannot determine board or card", mlog.Err(err))
		return
	}

	evt := notify.BlockChangeEvent{
		Action:       action,
		Workspace:    c.WorkspaceID,
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

// getBoardAndCard returns the first parent of type `card` and first parent of type `board` for the specified block.
// `board` and/or `card` may return nil without error if the block does not belong to a board or card.
func (a *App) getBoardAndCard(c store.Container, block *model.Block) (board *model.Block, card *model.Block, err error) {
	var count int // don't let invalid blocks hierarchy cause infinite loop.
	iter := block
	for {
		count++
		if board == nil && iter.Type == "board" {
			board = iter
		}

		if card == nil && iter.Type == "card" {
			card = iter
		}

		if iter.ParentID == "" || (board != nil && card != nil) || count > maxSearchDepth {
			break
		}

		iter, err = a.store.GetBlock(c, iter.ParentID)
		if err != nil {
			return board, card, err
		}
	}
	return board, card, nil
}
