package app

import "github.com/mattermost/focalboard/server/model"

func (a *App) GetUserCategoryBoards(userID, teamID string) ([]model.CategoryBlocks, error) {
	return a.store.GetUserCategoryBoards(userID, teamID)
}

func (a *App) AddUpdateUserCategoryBlock(userID, teamID, oldCategoryID, newCategoryID, blockID string) error {
	return a.store.AddUpdateCategoryBlock(userID, teamID, oldCategoryID, newCategoryID, blockID)
}
