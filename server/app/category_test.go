package app

import (
	"testing"

	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/utils"
	"github.com/stretchr/testify/assert"
)

func TestCreateCategory(t *testing.T) {
	th, tearDown := SetupTestHelper(t)
	defer tearDown()

	t.Run("base case", func(t *testing.T) {
		th.Store.EXPECT().CreateCategory(utils.Anything).Return(nil)

		th.Store.EXPECT().GetCategory(utils.Anything).Return(&model.Category{
			ID: "category_id_1",
		}, nil)

		category := &model.Category{
			Name:   "Category",
			UserID: "user_id",
			TeamID: "team_id",
			Type:   "custom",
		}
		createdCategory, err := th.App.CreateCategory(category)
		assert.NotNil(t, createdCategory)
		assert.NoError(t, err)
	})

	t.Run("creating invalid category", func(t *testing.T) {
		category := &model.Category{
			Name:   "", // empty name shouldn't be allowed
			UserID: "user_id",
			TeamID: "team_id",
			Type:   "custom",
		}
		createdCategory, err := th.App.CreateCategory(category)
		assert.Nil(t, createdCategory)
		assert.Error(t, err)

		category.Name = "Name"
		category.UserID = "" // empty creator user id shouldn't be allowed
		createdCategory, err = th.App.CreateCategory(category)
		assert.Nil(t, createdCategory)
		assert.Error(t, err)

		category.UserID = "user_id"
		category.TeamID = "" // empty TeamID shouldn't be allowed
		createdCategory, err = th.App.CreateCategory(category)
		assert.Nil(t, createdCategory)
		assert.Error(t, err)

		category.Type = "invalid" // unknown type shouldn't be allowed
		createdCategory, err = th.App.CreateCategory(category)
		assert.Nil(t, createdCategory)
		assert.Error(t, err)
	})
}

func TestUpdateCategory(t *testing.T) {
	th, tearDown := SetupTestHelper(t)
	defer tearDown()

	t.Run("base case", func(t *testing.T) {
		th.Store.EXPECT().GetCategory(utils.Anything).Return(&model.Category{
			ID:     "category_id_1",
			Name:   "Category",
			TeamID: "team_id_1",
			UserID: "user_id_1",
			Type:   "custom",
		}, nil)

		th.Store.EXPECT().UpdateCategory(utils.Anything).Return(nil)
		th.Store.EXPECT().GetCategory("category_id_1").Return(&model.Category{
			ID:   "category_id_1",
			Name: "Category",
		}, nil)

		category := &model.Category{
			ID:     "category_id_1",
			Name:   "Category",
			UserID: "user_id_1",
			TeamID: "team_id_1",
			Type:   "custom",
		}
		updatedCategory, err := th.App.UpdateCategory(category)
		assert.NotNil(t, updatedCategory)
		assert.NoError(t, err)
	})

	t.Run("updating invalid category", func(t *testing.T) {
		category := &model.Category{
			ID:     "category_id_1",
			Name:   "Name",
			UserID: "user_id",
			TeamID: "team_id",
			Type:   "custom",
		}

		category.ID = ""
		createdCategory, err := th.App.UpdateCategory(category)
		assert.Nil(t, createdCategory)
		assert.Error(t, err)

		category.ID = "category_id_1"
		category.Name = ""
		createdCategory, err = th.App.UpdateCategory(category)
		assert.Nil(t, createdCategory)
		assert.Error(t, err)

		category.Name = "Name"
		category.UserID = "" // empty creator user id shouldn't be allowed
		createdCategory, err = th.App.UpdateCategory(category)
		assert.Nil(t, createdCategory)
		assert.Error(t, err)

		category.UserID = "user_id"
		category.TeamID = "" // empty TeamID shouldn't be allowed
		createdCategory, err = th.App.UpdateCategory(category)
		assert.Nil(t, createdCategory)
		assert.Error(t, err)

		category.Type = "invalid" // unknown type shouldn't be allowed
		createdCategory, err = th.App.UpdateCategory(category)
		assert.Nil(t, createdCategory)
		assert.Error(t, err)
	})

	t.Run("trying to update someone else's category", func(t *testing.T) {
		th.Store.EXPECT().GetCategory(utils.Anything).Return(&model.Category{
			ID:     "category_id_1",
			Name:   "Category",
			TeamID: "team_id_1",
			UserID: "user_id_1",
			Type:   "custom",
		}, nil)

		category := &model.Category{
			ID:     "category_id_1",
			Name:   "Category",
			UserID: "user_id_2",
			TeamID: "team_id_1",
			Type:   "custom",
		}
		updatedCategory, err := th.App.UpdateCategory(category)
		assert.Nil(t, updatedCategory)
		assert.Error(t, err)
	})

	t.Run("trying to update some other team's category", func(t *testing.T) {
		th.Store.EXPECT().GetCategory(utils.Anything).Return(&model.Category{
			ID:     "category_id_1",
			Name:   "Category",
			TeamID: "team_id_1",
			UserID: "user_id_1",
			Type:   "custom",
		}, nil)

		category := &model.Category{
			ID:     "category_id_1",
			Name:   "Category",
			UserID: "user_id_1",
			TeamID: "team_id_2",
			Type:   "custom",
		}
		updatedCategory, err := th.App.UpdateCategory(category)
		assert.Nil(t, updatedCategory)
		assert.Error(t, err)
	})

	t.Run("should not be allowed to rename system category", func(t *testing.T) {
		th.Store.EXPECT().GetCategory(utils.Anything).Return(&model.Category{
			ID:     "category_id_1",
			Name:   "Category",
			TeamID: "team_id_1",
			UserID: "user_id_1",
			Type:   "system",
		}, nil).Times(1)

		th.Store.EXPECT().UpdateCategory(utils.Anything).Return(nil)

		th.Store.EXPECT().GetCategory(utils.Anything).Return(&model.Category{
			ID:        "category_id_1",
			Name:      "Category",
			TeamID:    "team_id_1",
			UserID:    "user_id_1",
			Type:      "system",
			Collapsed: true,
		}, nil).Times(1)

		category := &model.Category{
			ID:     "category_id_1",
			Name:   "Updated Name",
			UserID: "user_id_1",
			TeamID: "team_id_1",
			Type:   "system",
		}
		updatedCategory, err := th.App.UpdateCategory(category)
		assert.NotNil(t, updatedCategory)
		assert.NoError(t, err)
		assert.Equal(t, "Category", updatedCategory.Name)
	})

	t.Run("should be allowed to collapse and expand any category type", func(t *testing.T) {
		th.Store.EXPECT().GetCategory(utils.Anything).Return(&model.Category{
			ID:        "category_id_1",
			Name:      "Category",
			TeamID:    "team_id_1",
			UserID:    "user_id_1",
			Type:      "system",
			Collapsed: false,
		}, nil).Times(1)

		th.Store.EXPECT().UpdateCategory(utils.Anything).Return(nil)

		th.Store.EXPECT().GetCategory(utils.Anything).Return(&model.Category{
			ID:        "category_id_1",
			Name:      "Category",
			TeamID:    "team_id_1",
			UserID:    "user_id_1",
			Type:      "system",
			Collapsed: true,
		}, nil).Times(1)

		category := &model.Category{
			ID:        "category_id_1",
			Name:      "Updated Name",
			UserID:    "user_id_1",
			TeamID:    "team_id_1",
			Type:      "system",
			Collapsed: true,
		}
		updatedCategory, err := th.App.UpdateCategory(category)
		assert.NotNil(t, updatedCategory)
		assert.NoError(t, err)
		assert.Equal(t, "Category", updatedCategory.Name, "The name should have not been updated")
		assert.True(t, updatedCategory.Collapsed)
	})
}

func TestDeleteCategory(t *testing.T) {
	th, tearDown := SetupTestHelper(t)
	defer tearDown()

	t.Run("base case", func(t *testing.T) {
		th.Store.EXPECT().GetCategory("category_id_1").Return(&model.Category{
			ID:       "category_id_1",
			DeleteAt: 0,
			UserID:   "user_id_1",
			TeamID:   "team_id_1",
			Type:     "custom",
		}, nil)

		th.Store.EXPECT().DeleteCategory("category_id_1", "user_id_1", "team_id_1").Return(nil)

		th.Store.EXPECT().GetCategory("category_id_1").Return(&model.Category{
			DeleteAt: 10000,
		}, nil)

		deletedCategory, err := th.App.DeleteCategory("category_id_1", "user_id_1", "team_id_1")
		assert.NotNil(t, deletedCategory)
		assert.NoError(t, err)
	})

	t.Run("trying to delete already deleted category", func(t *testing.T) {
		th.Store.EXPECT().GetCategory("category_id_1").Return(&model.Category{
			ID:       "category_id_1",
			DeleteAt: 1000,
			UserID:   "user_id_1",
			TeamID:   "team_id_1",
			Type:     "custom",
		}, nil)

		deletedCategory, err := th.App.DeleteCategory("category_id_1", "user_id_1", "team_id_1")
		assert.NotNil(t, deletedCategory)
		assert.NoError(t, err)
	})

	t.Run("trying to delete system category", func(t *testing.T) {
		th.Store.EXPECT().GetCategory("category_id_1").Return(&model.Category{
			ID:       "category_id_1",
			DeleteAt: 0,
			UserID:   "user_id_1",
			TeamID:   "team_id_1",
			Type:     "system",
		}, nil)

		deletedCategory, err := th.App.DeleteCategory("category_id_1", "user_id_1", "team_id_1")
		assert.Nil(t, deletedCategory)
		assert.Error(t, err)
	})
}
