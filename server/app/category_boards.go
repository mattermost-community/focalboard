package app

import "github.com/mattermost/focalboard/server/model"

const defaultCategoryBoards = "Boards"

func (a *App) GetUserCategoryBoards(userID, teamID string) ([]model.CategoryBoards, error) {
	categoryBoards, err := a.store.GetUserCategoryBoards(userID, teamID)
	if err != nil {
		return nil, err
	}

	createdCategoryBoards, err := a.createDefaultCategoriesIfRequired(categoryBoards, userID, teamID)
	if err != nil {
		return nil, err
	}

	categoryBoards = append(categoryBoards, createdCategoryBoards...)
	return categoryBoards, nil
}

func (a *App) createDefaultCategoriesIfRequired(
	existingCategoryBoards []model.CategoryBoards,
	userID,
	teamID string,
) ([]model.CategoryBoards, error) {
	createdCategories := []model.CategoryBoards{}

	boardsCategoryExist := false

	for _, categoryBoard := range existingCategoryBoards {
		if categoryBoard.Name == defaultCategoryBoards {
			boardsCategoryExist = true
		}
	}

	if !boardsCategoryExist {
		category := model.Category{
			Name:      defaultCategoryBoards,
			UserID:    userID,
			TeamID:    teamID,
			Collapsed: false,
		}
		createdCategory, err := a.CreateCategory(&category)
		if err != nil {
			return nil, err
		}

		createdCategoryBoards := model.CategoryBoards{
			Category: *createdCategory,
			BoardIDs: []string{},
		}

		createdCategories = append(createdCategories, createdCategoryBoards)
	}

	return createdCategories, nil
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
