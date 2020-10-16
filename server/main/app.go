package main

type App struct {
	store    *SQLStore
	wsServer *WSServer
}

func (a *App) GetBlocks(parentID string, blockType string) ([]Block, error) {
	if len(blockType) > 0 && len(parentID) > 0 {
		return a.store.getBlocksWithParentAndType(parentID, blockType)
	}
	if len(blockType) > 0 {
		return a.store.getBlocksWithType(blockType)
	}
	return a.store.getBlocksWithParent(parentID)
}

func (a *App) GetParentID(blockID string) (string, error) {
	return a.store.getParentID(blockID)
}

func (a *App) InsertBlock(block Block) error {
	return a.store.insertBlock(block)
}

func (a *App) InsertBlocks(blocks []Block) error {
	var blockIDsToNotify = []string{}
	uniqueBlockIDs := make(map[string]bool)

	for _, block := range blocks {
		if !uniqueBlockIDs[block.ID] {
			blockIDsToNotify = append(blockIDsToNotify, block.ID)
		}
		if len(block.ParentID) > 0 && !uniqueBlockIDs[block.ParentID] {
			blockIDsToNotify = append(blockIDsToNotify, block.ParentID)
		}

		err := a.store.insertBlock(block)
		if err != nil {
			return err
		}
	}

	wsServer.broadcastBlockChangeToWebsocketClients(blockIDsToNotify)
	return nil
}

func (a *App) GetSubTree(blockID string) ([]Block, error) {
	return a.store.getSubTree(blockID)
}

func (a *App) GetAllBlocks() ([]Block, error) {
	return a.store.getAllBlocks()
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

	err = a.store.deleteBlock(blockID)
	if err != nil {
		return err
	}

	a.wsServer.broadcastBlockChangeToWebsocketClients(blockIDsToNotify)
	return nil
}
