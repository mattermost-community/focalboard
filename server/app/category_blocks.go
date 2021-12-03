package app

import "github.com/mattermost/focalboard/server/model"

func (a *App) GetUserCategoryBoards(userID, teamID string) ([]model.CategoryBlocks, error) {
	return a.store.GetUserCategoryBoards(userID, teamID)
}
