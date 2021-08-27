package app

import (
	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/services/notify"
	"github.com/mattermost/focalboard/server/services/store"
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
	a.wsServer.BroadcastBlockChange(c.WorkspaceID, *block)
	go func() {
		a.webhook.NotifyUpdate(*block)
		a.notifications.BlockChanged(notify.Update, block, oldBlock)
	}()
	return nil
}

func (a *App) InsertBlock(c store.Container, block model.Block, userID string) error {
	err := a.store.InsertBlock(c, &block, userID)
	if err == nil {
		a.wsServer.BroadcastBlockChange(c.WorkspaceID, block)
		a.metrics.IncrementBlocksInserted(1)
		go func() {
			a.webhook.NotifyUpdate(block)
			a.notifications.BlockChanged(notify.Add, &block, nil)
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

		needsNotify = append(needsNotify, blocks[i])

		a.wsServer.BroadcastBlockChange(c.WorkspaceID, blocks[i])
		a.metrics.IncrementBlocksInserted(1)
	}

	go func() {
		for _, b := range needsNotify {
			block := b
			a.webhook.NotifyUpdate(block)
			a.notifications.BlockChanged(notify.Add, &block, nil)
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
	parentID, err := a.GetParentID(c, blockID)
	if err != nil {
		return err
	}

	block, err := a.store.GetBlock(c, blockID)
	if err != nil {
		return err
	}

	err = a.store.DeleteBlock(c, blockID, modifiedBy)
	if err != nil {
		return err
	}

	a.wsServer.BroadcastBlockDelete(c.WorkspaceID, blockID, parentID)
	a.metrics.IncrementBlocksDeleted(1)
	a.notifications.BlockChanged(notify.Update, block, nil)

	return nil
}

func (a *App) GetBlockCountsByType() (map[string]int64, error) {
	return a.store.GetBlockCountsByType()
}
