package app

import (
	"path/filepath"

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

func (a *App) GetBlockWithID(c store.Container, blockID string) (*model.Block, error) {
	return a.store.GetBlock(c, blockID)
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

func (a *App) PatchBlock(c store.Container, blockID string, blockPatch *model.BlockPatch, modifiedByID string) error {
	oldBlock, err := a.store.GetBlock(c, blockID)
	if err != nil {
		return nil
	}

	err = a.store.PatchBlock(c, blockID, blockPatch, modifiedByID)
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
		a.notifyBlockChanged(notify.Update, c, block, oldBlock, modifiedByID)
	}()
	return nil
}

func (a *App) PatchBlocks(c store.Container, blockPatches *model.BlockPatchBatch, modifiedByID string) error {
	oldBlocks := make([]model.Block, 0, len(blockPatches.BlockIDs))
	for _, blockID := range blockPatches.BlockIDs {
		oldBlock, err := a.store.GetBlock(c, blockID)
		if err != nil {
			return nil
		}
		oldBlocks = append(oldBlocks, *oldBlock)
	}

	err := a.store.PatchBlocks(c, blockPatches, modifiedByID)
	if err != nil {
		return err
	}

	a.metrics.IncrementBlocksPatched(len(oldBlocks))
	for i, blockID := range blockPatches.BlockIDs {
		newBlock, err := a.store.GetBlock(c, blockID)
		if err != nil {
			return nil
		}
		a.wsAdapter.BroadcastBlockChange(c.WorkspaceID, *newBlock)
		go func(currentIndex int) {
			a.webhook.NotifyUpdate(*newBlock)
			a.notifyBlockChanged(notify.Update, c, newBlock, &oldBlocks[currentIndex], modifiedByID)
		}(i)
	}

	return nil
}

func (a *App) InsertBlock(c store.Container, block model.Block, modifiedByID string) error {
	err := a.store.InsertBlock(c, &block, modifiedByID)
	if err == nil {
		a.wsAdapter.BroadcastBlockChange(c.WorkspaceID, block)
		a.metrics.IncrementBlocksInserted(1)
		go func() {
			a.webhook.NotifyUpdate(block)
			a.notifyBlockChanged(notify.Add, c, &block, nil, modifiedByID)
		}()
	}
	return err
}

func (a *App) InsertBlocks(c store.Container, blocks []model.Block, modifiedByID string, allowNotifications bool) ([]model.Block, error) {
	needsNotify := make([]model.Block, 0, len(blocks))
	for i := range blocks {
		err := a.store.InsertBlock(c, &blocks[i], modifiedByID)
		if err != nil {
			return nil, err
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
			if allowNotifications {
				a.notifyBlockChanged(notify.Add, c, &block, nil, modifiedByID)
			}
		}
	}()

	return blocks, nil
}

func (a *App) GetSubTree(c store.Container, blockID string, levels int) ([]model.Block, error) {
	// Only 2 or 3 levels are supported for now
	if levels >= 3 {
		return a.store.GetSubTree3(c, blockID, model.QuerySubtreeOptions{})
	}
	return a.store.GetSubTree2(c, blockID, model.QuerySubtreeOptions{})
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

	if block.Type == model.TypeImage {
		fileName, fileIDExists := block.Fields["fileId"]
		if fileName, fileIDIsString := fileName.(string); fileIDExists && fileIDIsString {
			filePath := filepath.Join(block.WorkspaceID, block.RootID, fileName)
			err = a.filesBackend.RemoveFile(filePath)

			if err != nil {
				a.logger.Error("Error deleting image file",
					mlog.String("FilePath", filePath),
					mlog.Err(err))
			}
		}
	}

	a.wsAdapter.BroadcastBlockDelete(c.WorkspaceID, blockID, block.ParentID)
	a.metrics.IncrementBlocksDeleted(1)
	go func() {
		a.notifyBlockChanged(notify.Delete, c, block, block, modifiedBy)
	}()
	return nil
}

func (a *App) GetBlockCountsByType() (map[string]int64, error) {
	return a.store.GetBlockCountsByType()
}

func (a *App) notifyBlockChanged(action notify.Action, c store.Container, block *model.Block, oldBlock *model.Block, modifiedByID string) {
	if a.notifications == nil {
		return
	}

	// find card and board for the changed block.
	board, card, err := a.store.GetBoardAndCard(c, block)
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
		ModifiedByID: modifiedByID,
	}
	a.notifications.BlockChanged(evt)
}
