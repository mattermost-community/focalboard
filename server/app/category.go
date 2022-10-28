package app

import (
	"errors"

	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/utils"
)

var ErrCannotDeleteSystemCategory = errors.New("cannot delete a system category")
var ErrCannotUpdateSystemCategory = errors.New("cannot update a system category")

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
	if err := category.IsValid(); err != nil {
		return nil, err
	}

	// verify if category belongs to the user
	existingCategory, err := a.store.GetCategory(category.ID)
	if err != nil {
		return nil, err
	}

	if existingCategory.DeleteAt != 0 {
		return nil, model.ErrCategoryDeleted
	}

	if existingCategory.UserID != category.UserID {
		return nil, model.ErrCategoryPermissionDenied
	}

	if existingCategory.TeamID != category.TeamID {
		return nil, model.ErrCategoryPermissionDenied
	}

	if existingCategory.Type == model.CategoryTypeSystem {
		// You cannot rename or delete a system category,
		// So restoring its name and undeleting it if set so.
		category.Name = existingCategory.Name
		category.DeleteAt = 0
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
		return nil, model.ErrCategoryPermissionDenied
	}

	// verify if category belongs to the team
	if existingCategory.TeamID != teamID {
		return nil, model.NewErrInvalidCategory("category doesn't belong to the team")
	}

	if existingCategory.Type == model.CategoryTypeSystem {
		return nil, ErrCannotDeleteSystemCategory
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
