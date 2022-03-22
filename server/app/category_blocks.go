package app

import "github.com/mattermost/focalboard/server/model"

func (a *App) GetUserCategoryBlocks(userID, teamID string) ([]model.CategoryBlocks, error) {
	return a.store.GetUserCategoryBlocks(userID, teamID)
}

func (a *App) AddUpdateUserCategoryBlock(teamID, userID, categoryID, blockID string) error {
	err := a.store.AddUpdateCategoryBlock(userID, categoryID, blockID)
	if err != nil {
		return err
	}

	go func() {
		a.wsAdapter.BroadcastCategoryBlockChange(
			teamID,
			userID,
			model.BlockCategoryWebsocketData{
				BlockID:    blockID,
				CategoryID: categoryID,
			})
	}()

	return nil
}
