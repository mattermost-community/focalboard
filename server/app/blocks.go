package app

import (
	"errors"
	"fmt"
	"path/filepath"

	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/services/notify"
	"github.com/mattermost/focalboard/server/services/store"
	"github.com/mattermost/focalboard/server/utils"

	"github.com/mattermost/mattermost-server/v6/shared/mlog"
)

var ErrViewsLimitReached = errors.New("views limit reached for board")

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
		// check for workspace ID allows creating template boards
		// with more views that what limit allows.
		if c.WorkspaceID != "0" && blocks[i].Type == model.TypeView {
			withinLimit, err := a.isWithinViewsLimit(c, blocks[i])
			if err != nil {
				return nil, err
			}

			if !withinLimit {
				a.logger.Info("views limit reached on board", mlog.String("board_id", blocks[i].ParentID), mlog.String("workspace_id", c.WorkspaceID))
				return nil, ErrViewsLimitReached
			}
		}

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

func (a *App) isWithinViewsLimit(c store.Container, block model.Block) (bool, error) {
	views, err := a.store.GetBlocksWithParentAndType(c, block.ParentID, model.TypeView)
	if err != nil {
		return false, err
	}

	return len(views) < 5, nil
}

func (a *App) CopyCardFiles(sourceBoardID string, destWorkspaceID string, blocks []model.Block) error {
	// Images attached in cards have a path comprising the card's board ID.
	// When we create a template from this board, we need to copy the files
	// with the new board ID in path.
	// Not doing so causing images in templates (and boards created from this
	// template) to fail to load.

	// look up ID of source board, which may be different than the blocks.
	board, err := a.GetBlockByID(store.Container{}, sourceBoardID)
	if err != nil || board == nil {
		return fmt.Errorf("cannot fetch board %s for CopyCardFiles: %w", sourceBoardID, err)
	}

	for i := range blocks {
		block := blocks[i]

		fileName, ok := block.Fields["fileId"]
		if block.Type == model.TypeImage && ok {
			// create unique filename in case we are copying cards within the same board.
			ext := filepath.Ext(fileName.(string))
			destFilename := utils.NewID(utils.IDTypeNone) + ext

			sourceFilePath := filepath.Join(board.WorkspaceID, sourceBoardID, fileName.(string))
			destinationFilePath := filepath.Join(destWorkspaceID, block.RootID, destFilename)

			a.logger.Debug(
				"Copying card file",
				mlog.String("sourceFilePath", sourceFilePath),
				mlog.String("destinationFilePath", destinationFilePath),
			)

			if err := a.filesBackend.CopyFile(sourceFilePath, destinationFilePath); err != nil {
				a.logger.Error(
					"CopyCardFiles failed to copy file",
					mlog.String("sourceFilePath", sourceFilePath),
					mlog.String("destinationFilePath", destinationFilePath),
					mlog.Err(err),
				)

				return err
			}
			block.Fields["fileId"] = destFilename
		}
	}

	return nil
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

func (a *App) GetBlockByID(c store.Container, blockID string) (*model.Block, error) {
	return a.store.GetBlock(c, blockID)
}

func (a *App) DeleteBlock(c store.Container, blockID string, modifiedBy string) error {
	block, err := a.store.GetBlock(c, blockID)
	if err != nil {
		return err
	}

	if block == nil {
		// deleting non-existing block not considered an error
		return nil
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

func (a *App) UndeleteBlock(c store.Container, blockID string, modifiedBy string) error {
	blocks, err := a.store.GetBlockHistory(c, blockID, model.QueryBlockHistoryOptions{Limit: 1, Descending: true})
	if err != nil {
		return err
	}

	if len(blocks) == 0 {
		// deleting non-existing block not considered an error
		return nil
	}

	err = a.store.UndeleteBlock(c, blockID, modifiedBy)
	if err != nil {
		return err
	}

	block, err := a.store.GetBlock(c, blockID)
	if err != nil {
		return err
	}

	if block == nil {
		a.logger.Error("Error loading the block after undelete, not propagating through websockets or notifications")
		return nil
	}

	a.wsAdapter.BroadcastBlockChange(c.WorkspaceID, *block)
	a.metrics.IncrementBlocksInserted(1)
	go func() {
		a.webhook.NotifyUpdate(*block)
		a.notifyBlockChanged(notify.Add, c, block, nil, modifiedBy)
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
