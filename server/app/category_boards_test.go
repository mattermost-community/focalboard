package app

import (
	"testing"

	"github.com/mattermost/focalboard/server/utils"

	"github.com/mattermost/focalboard/server/model"
	"github.com/stretchr/testify/assert"
)

func TestGetUserCategoryBoards(t *testing.T) {
	th, tearDown := SetupTestHelper(t)
	defer tearDown()

	t.Run("user had no default category and had boards", func(t *testing.T) {
		th.Store.EXPECT().GetUserCategoryBoards("user_id", "team_id").Return([]model.CategoryBoards{}, nil)
		th.Store.EXPECT().CreateCategory(utils.Anything).Return(nil)
		th.Store.EXPECT().GetCategory(utils.Anything).Return(&model.Category{
			ID:   "boards_category_id",
			Name: "Boards",
		}, nil)

		th.Store.EXPECT().GetMembersForUser("user_id").Return([]*model.BoardMember{
			{
				BoardID:   "board_id_1",
				Synthetic: false,
			},
			{
				BoardID:   "board_id_2",
				Synthetic: false,
			},
			{
				BoardID:   "board_id_3",
				Synthetic: false,
			},
		}, nil)
		th.Store.EXPECT().AddUpdateCategoryBoard("user_id", "boards_category_id", "board_id_1").Return(nil)
		th.Store.EXPECT().AddUpdateCategoryBoard("user_id", "boards_category_id", "board_id_2").Return(nil)
		th.Store.EXPECT().AddUpdateCategoryBoard("user_id", "boards_category_id", "board_id_3").Return(nil)

		categoryBoards, err := th.App.GetUserCategoryBoards("user_id", "team_id")
		assert.NoError(t, err)
		assert.Equal(t, 1, len(categoryBoards))
		assert.Equal(t, "Boards", categoryBoards[0].Name)
		assert.Equal(t, 3, len(categoryBoards[0].BoardIDs))
		assert.Contains(t, categoryBoards[0].BoardIDs, "board_id_1")
		assert.Contains(t, categoryBoards[0].BoardIDs, "board_id_2")
		assert.Contains(t, categoryBoards[0].BoardIDs, "board_id_3")
	})

	t.Run("user had no default category BUT had no boards", func(t *testing.T) {
		th.Store.EXPECT().GetUserCategoryBoards("user_id", "team_id").Return([]model.CategoryBoards{}, nil)
		th.Store.EXPECT().CreateCategory(utils.Anything).Return(nil)
		th.Store.EXPECT().GetCategory(utils.Anything).Return(&model.Category{
			ID:   "boards_category_id",
			Name: "Boards",
		}, nil)

		th.Store.EXPECT().GetMembersForUser("user_id").Return([]*model.BoardMember{}, nil)

		categoryBoards, err := th.App.GetUserCategoryBoards("user_id", "team_id")
		assert.NoError(t, err)
		assert.Equal(t, 1, len(categoryBoards))
		assert.Equal(t, "Boards", categoryBoards[0].Name)
		assert.Equal(t, 0, len(categoryBoards[0].BoardIDs))
	})

	t.Run("user already had a default Boards category with boards in it", func(t *testing.T) {
		th.Store.EXPECT().GetUserCategoryBoards("user_id", "team_id").Return([]model.CategoryBoards{
			{
				Category: model.Category{Name: "Boards"},
				BoardIDs: []string{"board_id_1", "board_id_2"},
			},
		}, nil)

		categoryBoards, err := th.App.GetUserCategoryBoards("user_id", "team_id")
		assert.NoError(t, err)
		assert.Equal(t, 1, len(categoryBoards))
		assert.Equal(t, "Boards", categoryBoards[0].Name)
		assert.Equal(t, 2, len(categoryBoards[0].BoardIDs))
	})
}

func TestCreateBoardsCategory(t *testing.T) {
	th, tearDown := SetupTestHelper(t)
	defer tearDown()

	t.Run("user doesn't have any boards - implicit or explicit", func(t *testing.T) {
		th.Store.EXPECT().CreateCategory(utils.Anything).Return(nil)
		th.Store.EXPECT().GetCategory(utils.Anything).Return(&model.Category{
			ID:   "boards_category_id",
			Type: "system",
			Name: "Boards",
		}, nil)
		th.Store.EXPECT().GetMembersForUser("user_id").Return([]*model.BoardMember{}, nil)

		existingCategoryBoards := []model.CategoryBoards{}
		boardsCategory, err := th.App.createBoardsCategory("user_id", "team_id", existingCategoryBoards)
		assert.NoError(t, err)
		assert.NotNil(t, boardsCategory)
		assert.Equal(t, "Boards", boardsCategory.Name)
		assert.Equal(t, 0, len(boardsCategory.BoardIDs))
	})

	t.Run("user has implicit access to some board", func(t *testing.T) {
		th.Store.EXPECT().CreateCategory(utils.Anything).Return(nil)
		th.Store.EXPECT().GetCategory(utils.Anything).Return(&model.Category{
			ID:   "boards_category_id",
			Type: "system",
			Name: "Boards",
		}, nil)
		th.Store.EXPECT().GetMembersForUser("user_id").Return([]*model.BoardMember{
			{
				BoardID:   "board_id_1",
				Synthetic: true,
			},
			{
				BoardID:   "board_id_2",
				Synthetic: true,
			},
			{
				BoardID:   "board_id_3",
				Synthetic: true,
			},
		}, nil)

		existingCategoryBoards := []model.CategoryBoards{}
		boardsCategory, err := th.App.createBoardsCategory("user_id", "team_id", existingCategoryBoards)
		assert.NoError(t, err)
		assert.NotNil(t, boardsCategory)
		assert.Equal(t, "Boards", boardsCategory.Name)

		// there should still be no boards in the default category as
		// the user had only implicit access to boards
		assert.Equal(t, 0, len(boardsCategory.BoardIDs))
	})

	t.Run("user has explicit access to some board", func(t *testing.T) {
		th.Store.EXPECT().CreateCategory(utils.Anything).Return(nil)
		th.Store.EXPECT().GetCategory(utils.Anything).Return(&model.Category{
			ID:   "boards_category_id",
			Type: "system",
			Name: "Boards",
		}, nil)
		th.Store.EXPECT().GetMembersForUser("user_id").Return([]*model.BoardMember{
			{
				BoardID:   "board_id_1",
				Synthetic: false,
			},
			{
				BoardID:   "board_id_2",
				Synthetic: false,
			},
			{
				BoardID:   "board_id_3",
				Synthetic: false,
			},
		}, nil)
		th.Store.EXPECT().AddUpdateCategoryBoard("user_id", "boards_category_id", "board_id_1").Return(nil)
		th.Store.EXPECT().AddUpdateCategoryBoard("user_id", "boards_category_id", "board_id_2").Return(nil)
		th.Store.EXPECT().AddUpdateCategoryBoard("user_id", "boards_category_id", "board_id_3").Return(nil)

		existingCategoryBoards := []model.CategoryBoards{}
		boardsCategory, err := th.App.createBoardsCategory("user_id", "team_id", existingCategoryBoards)
		assert.NoError(t, err)
		assert.NotNil(t, boardsCategory)
		assert.Equal(t, "Boards", boardsCategory.Name)

		// since user has explicit access to three boards,
		// they should all end up in the default category
		assert.Equal(t, 3, len(boardsCategory.BoardIDs))
	})

	t.Run("user has both implicit and explicit access to some board", func(t *testing.T) {
		th.Store.EXPECT().CreateCategory(utils.Anything).Return(nil)
		th.Store.EXPECT().GetCategory(utils.Anything).Return(&model.Category{
			ID:   "boards_category_id",
			Type: "system",
			Name: "Boards",
		}, nil)
		th.Store.EXPECT().GetMembersForUser("user_id").Return([]*model.BoardMember{
			{
				BoardID:   "board_id_1",
				Synthetic: false,
			},
			{
				BoardID:   "board_id_2",
				Synthetic: true,
			},
			{
				BoardID:   "board_id_3",
				Synthetic: true,
			},
		}, nil)
		th.Store.EXPECT().AddUpdateCategoryBoard("user_id", "boards_category_id", "board_id_1").Return(nil)

		existingCategoryBoards := []model.CategoryBoards{}
		boardsCategory, err := th.App.createBoardsCategory("user_id", "team_id", existingCategoryBoards)
		assert.NoError(t, err)
		assert.NotNil(t, boardsCategory)
		assert.Equal(t, "Boards", boardsCategory.Name)

		// there was only one explicit board access,
		// and so only that one should end up in the
		// default category
		assert.Equal(t, 1, len(boardsCategory.BoardIDs))
	})
}
