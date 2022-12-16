package storetests

import (
	"testing"

	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/services/store"
	"github.com/mattermost/focalboard/server/utils"
	"github.com/stretchr/testify/assert"
)

func StoreTestCategoryBoardsStore(t *testing.T, setup func(t *testing.T) (store.Store, func())) {
	t.Run("GetUserCategoryBoards", func(t *testing.T) {
		store, tearDown := setup(t)
		defer tearDown()
		testGetUserCategoryBoards(t, store)
	})
}

func testGetUserCategoryBoards(t *testing.T, store store.Store) {
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
		Name:      "Category 3",
		UserID:    "user_id_1",
		TeamID:    "team_id_1",
		CreateAt:  now,
		UpdateAt:  now,
		DeleteAt:  0,
		Collapsed: false,
	}
	err = store.CreateCategory(category3)
	assert.NoError(t, err)

	// Adding Board 1 and Board 2 to Category 1
	// The boards don't need to exists in DB for this test
	err = store.AddUpdateCategoryBoard("user_id_1", map[string]string{"board_1": "category_id_1"})
	assert.NoError(t, err)

	err = store.AddUpdateCategoryBoard("user_id_1", map[string]string{"board_2": "category_id_1"})
	assert.NoError(t, err)

	// Adding Board 3 to Category 2
	err = store.AddUpdateCategoryBoard("user_id_1", map[string]string{"board_3": "category_id_2"})
	assert.NoError(t, err)

	// we'll leave category 3 empty

	userCategoryBoards, err := store.GetUserCategoryBoards("user_id_1", "team_id_1")
	assert.NoError(t, err)

	// we created 3 categories for the user
	assert.Equal(t, 3, len(userCategoryBoards))

	var category1BoardCategory model.CategoryBoards
	var category2BoardCategory model.CategoryBoards
	var category3BoardCategory model.CategoryBoards

	for i := range userCategoryBoards {
		switch userCategoryBoards[i].ID {
		case "category_id_1":
			category1BoardCategory = userCategoryBoards[i]
		case "category_id_2":
			category2BoardCategory = userCategoryBoards[i]
		case "category_id_3":
			category3BoardCategory = userCategoryBoards[i]
		}
	}

	assert.NotEmpty(t, category1BoardCategory)
	assert.Equal(t, 2, len(category1BoardCategory.BoardIDs))

	assert.NotEmpty(t, category1BoardCategory)
	assert.Equal(t, 1, len(category2BoardCategory.BoardIDs))

	assert.NotEmpty(t, category1BoardCategory)
	assert.Equal(t, 0, len(category3BoardCategory.BoardIDs))

	t.Run("get empty category boards", func(t *testing.T) {
		userCategoryBoards, err := store.GetUserCategoryBoards("nonexistent-user-id", "nonexistent-team-id")
		assert.NoError(t, err)
		assert.Empty(t, userCategoryBoards)
	})
}
