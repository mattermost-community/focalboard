package app

import (
	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/utils"
)

func (a *App) CreateCategory(category model.Category) error {
	category.ID = utils.NewID(utils.IDTypeNone)
	if err := category.IsValid(); err != nil {
		return err
	}

	return a.store.CreateCategory(category)
}

func (a *App) UpdateCategory(category model.Category) error {
	if err := category.IsValid(); err != nil {
		return err
	}

	return a.store.UpdateCategory(category)
}

func (a *App) DeleteCategory(categoryID, userID, teamID string) error {
	return a.store.DeleteCategory(categoryID, userID, teamID)
}
