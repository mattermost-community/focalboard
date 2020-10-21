package app

import (
	"github.com/mattermost/mattermost-octo-tasks/server/model"
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

func (a *App) GetParentID(blockID string) (string, error) {
	return a.store.GetParentID(blockID)
}

func (a *App) InsertBlock(block model.Block) error {
	return a.store.InsertBlock(block)
}

func (a *App) InsertBlocks(blocks []model.Block) error {
	var blockIDsToNotify = []string{}
	uniqueBlockIDs := make(map[string]bool)

	for _, block := range blocks {
		if !uniqueBlockIDs[block.ID] {
			blockIDsToNotify = append(blockIDsToNotify, block.ID)
		}
		if len(block.ParentID) > 0 && !uniqueBlockIDs[block.ParentID] {
			blockIDsToNotify = append(blockIDsToNotify, block.ParentID)
		}

		err := a.store.InsertBlock(block)
		if err != nil {
			return err
		}
	}

	a.wsServer.BroadcastBlockChangeToWebsocketClients(blockIDsToNotify)
	return nil
}

func (a *App) GetSubTree(blockID string) ([]model.Block, error) {
	return a.store.GetSubTree(blockID)
}

func (a *App) GetAllBlocks() ([]model.Block, error) {
	return a.store.GetAllBlocks()
}

func (a *App) DeleteBlock(blockID string) error {
	var blockIDsToNotify = []string{blockID}
	parentID, err := a.GetParentID(blockID)
	if err != nil {
		return err
	}

	if len(parentID) > 0 {
		blockIDsToNotify = append(blockIDsToNotify, parentID)
	}

	err = a.store.DeleteBlock(blockID)
	if err != nil {
		return err
	}

	a.wsServer.BroadcastBlockChangeToWebsocketClients(blockIDsToNotify)
	return nil
}
