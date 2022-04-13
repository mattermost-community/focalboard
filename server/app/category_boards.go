package app

import "github.com/mattermost/focalboard/server/model"

func (a *App) GetUserCategoryBoards(userID, teamID string) ([]model.CategoryBoards, error) {
	return a.store.GetUserCategoryBoards(userID, teamID)
}

func (a *App) AddUpdateUserCategoryBoard(teamID, userID, categoryID, boardID string) error {
	err := a.store.AddUpdateCategoryBoard(userID, categoryID, boardID)
	if err != nil {
		return err
	}

	a.blockChangeNotifier.Enqueue(func() error {
		a.wsAdapter.BroadcastCategoryBoardChange(
			teamID,
			userID,
			model.BoardCategoryWebsocketData{
				BoardID:    boardID,
				CategoryID: categoryID,
			})
		return nil
	})

	return nil
}
