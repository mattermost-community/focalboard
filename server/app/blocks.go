package app

import (
	"github.com/mattermost/focalboard/server/model"
)

func (a *App) GetBlocks(parentID string, blockType string) ([]model.Block, error) {
	if len(blockType) > 0 && len(parentID) > 0 {
		return a.store.GetBlocksWithParentAndType(parentID, blockType)
	}

	if len(blockType) > 0 {
		return a.store.GetBlocksWithType(blockType)
	}

	return a.store.GetBlocksWithParent(parentID)
}

func (a *App) GetRootID(blockID string) (string, error) {
	return a.store.GetRootID(blockID)
}

func (a *App) GetParentID(blockID string) (string, error) {
	return a.store.GetParentID(blockID)
}

func (a *App) InsertBlock(block model.Block) error {
	return a.store.InsertBlock(block)
}

func (a *App) InsertBlocks(blocks []model.Block) error {
	blockIDsToNotify := []string{}

	uniqueBlockIDs := make(map[string]bool)

	for _, block := range blocks {
		if !uniqueBlockIDs[block.ID] {
			blockIDsToNotify = append(blockIDsToNotify, block.ID)
		}

		// ParentID as empty string denotes a block at the root
		if !uniqueBlockIDs[block.ParentID] {
			blockIDsToNotify = append(blockIDsToNotify, block.ParentID)
		}

		err := a.store.InsertBlock(block)
		if err != nil {
			return err
		}

		a.wsServer.BroadcastBlockChange(block)
		go a.webhook.NotifyUpdate(block)
	}

	return nil
}

func (a *App) GetSubTree(blockID string, levels int) ([]model.Block, error) {
	// Only 2 or 3 levels are supported for now
	if levels >= 3 {
		return a.store.GetSubTree3(blockID)
	}
	return a.store.GetSubTree2(blockID)
}

func (a *App) GetAllBlocks() ([]model.Block, error) {
	return a.store.GetAllBlocks()
}

func (a *App) DeleteBlock(blockID string, modifiedBy string) error {
	blockIDsToNotify := []string{blockID}
	parentID, err := a.GetParentID(blockID)
	if err != nil {
		return err
	}

	if len(parentID) > 0 {
		blockIDsToNotify = append(blockIDsToNotify, parentID)
	}

	err = a.store.DeleteBlock(blockID, modifiedBy)
	if err != nil {
		return err
	}

	a.wsServer.BroadcastBlockDelete(blockID, parentID)

	return nil
}
