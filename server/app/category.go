package app

import (
	"errors"
	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/utils"
)

var (
	ErrorCategoryPermissionDenied = errors.New("category doesn't belong to user")
	ErrorCategoryDeleted          = errors.New("category is deleted")
)

func (a *App) CreateCategory(category *model.Category) (*model.Category, error) {
	a.logger.Info("received: " + category.ID)
	category.Hydrate()
	a.logger.Info("set: " + category.ID)
	if err := category.IsValid(); err != nil {
		return nil, err
	}

	if err := a.store.CreateCategory(*category); err != nil {
		return nil, err
	}

	a.logger.Info("fetching: " + category.ID)
	return a.store.GetCategory(category.ID)
}

func (a *App) UpdateCategory(category *model.Category) (*model.Category, error) {
	// verify if category belongs to the user
	existingCategory, err := a.store.GetCategory(category.ID)
	if err != nil {
		return nil, err
	}

	if existingCategory.DeleteAt != 0 {
		return nil, ErrorCategoryDeleted
	}

	if existingCategory.UserID != category.UserID {
		return nil, ErrorCategoryPermissionDenied
	}

	category.UpdateAt = utils.GetMillis()
	if err := category.IsValid(); err != nil {
		return nil, err
	}
	if err := a.store.UpdateCategory(*category); err != nil {
		return nil, err
	}

	return a.store.GetCategory(category.ID)
}

func (a *App) DeleteCategory(categoryID, userID, teamID string) (*model.Category, error) {
	existingCategory, err := a.store.GetCategory(categoryID)
	if err != nil {
		return nil, err
	}

	// category is already deleted. This avoids
	// overriding the original deleted at timestamp
	if existingCategory.DeleteAt != 0 {
		return existingCategory, nil
	}

	// verify if category belongs to the user
	if existingCategory.UserID != userID {
		return nil, ErrorCategoryPermissionDenied
	}

	if err := a.store.DeleteCategory(categoryID, userID, teamID); err != nil {
		return nil, err
	}

	return a.store.GetCategory(categoryID)
}
