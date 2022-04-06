package app

import (
	"errors"

	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/utils"
)

var (
	ErrorCategoryPermissionDenied = errors.New("category doesn't belong to user")
	ErrorCategoryDeleted          = errors.New("category is deleted")
	ErrorInvalidCategory          = errors.New("invalid category")
)

func (a *App) CreateCategory(category *model.Category) (*model.Category, error) {
	category.Hydrate()
	if err := category.IsValid(); err != nil {
		return nil, err
	}

	if err := a.store.CreateCategory(*category); err != nil {
		return nil, err
	}

	createdCategory, err := a.store.GetCategory(category.ID)
	if err != nil {
		return nil, err
	}

	go func() {
		a.wsAdapter.BroadcastCategoryChange(*createdCategory)
	}()

	return createdCategory, nil
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
	if err = category.IsValid(); err != nil {
		return nil, err
	}
	if err = a.store.UpdateCategory(*category); err != nil {
		return nil, err
	}

	updatedCategory, err := a.store.GetCategory(category.ID)
	if err != nil {
		return nil, err
	}

	go func() {
		a.wsAdapter.BroadcastCategoryChange(*updatedCategory)
	}()

	return updatedCategory, nil
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

	// verify if category belongs to the team
	if existingCategory.TeamID != teamID {
		return nil, ErrorInvalidCategory
	}

	if err = a.store.DeleteCategory(categoryID, userID, teamID); err != nil {
		return nil, err
	}

	deletedCategory, err := a.store.GetCategory(categoryID)
	if err != nil {
		return nil, err
	}

	go func() {
		a.wsAdapter.BroadcastCategoryChange(*deletedCategory)
	}()

	return deletedCategory, nil
}
