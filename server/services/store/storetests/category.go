package storetests

import (
	"testing"

	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/services/store"
	"github.com/mattermost/focalboard/server/utils"
	"github.com/stretchr/testify/assert"
)

func StoreTestCategoryStore(t *testing.T, setup func(t *testing.T) (store.Store, func())) {
	t.Run("CreateCategory", func(t *testing.T) {
		store, tearDown := setup(t)
		defer tearDown()
		testGetCreateCategory(t, store)
	})
	t.Run("UpdateCategory", func(t *testing.T) {
		store, tearDown := setup(t)
		defer tearDown()
		testUpdateCategory(t, store)
	})
	t.Run("DeleteCategory", func(t *testing.T) {
		store, tearDown := setup(t)
		defer tearDown()
		testDeleteCategory(t, store)
	})
	t.Run("GetUserCategoriesCategory", func(t *testing.T) {
		store, tearDown := setup(t)
		defer tearDown()
		testGetUserCategories(t, store)
	})
}

func testGetCreateCategory(t *testing.T, store store.Store) {
	t.Run("save uncollapsed category", func(t *testing.T) {
		now := utils.GetMillis()
		category := model.Category{
			ID:        "category_id_1",
			Name:      "Category",
			UserID:    "user_id_1",
			TeamID:    "team_id_1",
			CreateAt:  now,
			UpdateAt:  now,
			DeleteAt:  0,
			Collapsed: false,
		}

		err := store.CreateCategory(category)
		assert.NoError(t, err)

		createdCategory, err := store.GetCategory("category_id_1")
		assert.NoError(t, err)
		assert.Equal(t, "Category", createdCategory.Name)
		assert.Equal(t, "user_id_1", createdCategory.UserID)
		assert.Equal(t, "team_id_1", createdCategory.TeamID)
		assert.Equal(t, false, createdCategory.Collapsed)
	})

	t.Run("save collapsed category", func(t *testing.T) {
		now := utils.GetMillis()
		category := model.Category{
			ID:        "category_id_2",
			Name:      "Category",
			UserID:    "user_id_1",
			TeamID:    "team_id_1",
			CreateAt:  now,
			UpdateAt:  now,
			DeleteAt:  0,
			Collapsed: true,
		}

		err := store.CreateCategory(category)
		assert.NoError(t, err)

		createdCategory, err := store.GetCategory("category_id_2")
		assert.NoError(t, err)
		assert.Equal(t, "Category", createdCategory.Name)
		assert.Equal(t, "user_id_1", createdCategory.UserID)
		assert.Equal(t, "team_id_1", createdCategory.TeamID)
		assert.Equal(t, true, createdCategory.Collapsed)
	})
}

func testUpdateCategory(t *testing.T, store store.Store) {
	now := utils.GetMillis()
	category := model.Category{
		ID:        "category_id_1",
		Name:      "Category 1",
		UserID:    "user_id_1",
		TeamID:    "team_id_1",
		CreateAt:  now,
		UpdateAt:  now,
		DeleteAt:  0,
		Collapsed: false,
	}

	err := store.CreateCategory(category)
	assert.NoError(t, err)

	updateNow := utils.GetMillis()
	updatedCategory := model.Category{
		ID:        "category_id_1",
		Name:      "Category 1 New",
		UserID:    "user_id_1",
		TeamID:    "team_id_1",
		CreateAt:  now,
		UpdateAt:  updateNow,
		DeleteAt:  0,
		Collapsed: true,
	}

	err = store.UpdateCategory(updatedCategory)
	assert.NoError(t, err)

	fetchedCategory, err := store.GetCategory("category_id_1")
	assert.NoError(t, err)
	assert.Equal(t, "category_id_1", fetchedCategory.ID)
	assert.Equal(t, "Category 1 New", fetchedCategory.Name)
	assert.Equal(t, true, fetchedCategory.Collapsed)

	// now lets try to un-collapse the same category
	updatedCategory.Collapsed = false
	err = store.UpdateCategory(updatedCategory)
	assert.NoError(t, err)

	fetchedCategory, err = store.GetCategory("category_id_1")
	assert.NoError(t, err)
	assert.Equal(t, "category_id_1", fetchedCategory.ID)
	assert.Equal(t, "Category 1 New", fetchedCategory.Name)
	assert.Equal(t, false, fetchedCategory.Collapsed)
}

func testDeleteCategory(t *testing.T, store store.Store) {
	now := utils.GetMillis()
	category := model.Category{
		ID:        "category_id_1",
		Name:      "Category 1",
		UserID:    "user_id_1",
		TeamID:    "team_id_1",
		CreateAt:  now,
		UpdateAt:  now,
		DeleteAt:  0,
		Collapsed: false,
	}

	err := store.CreateCategory(category)
	assert.NoError(t, err)

	err = store.DeleteCategory("category_id_1", "user_id_1", "team_id_1")
	assert.NoError(t, err)

	deletedCategory, err := store.GetCategory("category_id_1")
	assert.NoError(t, err)
	assert.Equal(t, "category_id_1", deletedCategory.ID)
	assert.Equal(t, "Category 1", deletedCategory.Name)
	assert.Equal(t, false, deletedCategory.Collapsed)
	assert.Greater(t, deletedCategory.DeleteAt, int64(0))
}

func testGetUserCategories(t *testing.T, store store.Store) {
	now := utils.GetMillis()
	category1 := model.Category{
		ID:        "category_id_1",
		Name:      "Category 1",
		UserID:    "user_id_1",
		TeamID:    "team_id_1",
		CreateAt:  now,
		UpdateAt:  now,
		DeleteAt:  0,
		Collapsed: false,
	}
	err := store.CreateCategory(category1)
	assert.NoError(t, err)

	category2 := model.Category{
		ID:        "category_id_2",
		Name:      "Category 2",
		UserID:    "user_id_1",
		TeamID:    "team_id_1",
		CreateAt:  now,
		UpdateAt:  now,
		DeleteAt:  0,
		Collapsed: false,
	}
	err = store.CreateCategory(category2)
	assert.NoError(t, err)

	category3 := model.Category{
		ID:        "category_id_3",
		Name:      "Category 2",
		UserID:    "user_id_1",
		TeamID:    "team_id_1",
		CreateAt:  now,
		UpdateAt:  now,
		DeleteAt:  0,
		Collapsed: false,
	}
	err = store.CreateCategory(category3)
	assert.NoError(t, err)

	userCategories, err := store.GetUserCategoryBoards("user_id_1", "team_id_1")
	assert.NoError(t, err)
	assert.Equal(t, 3, len(userCategories))
}
