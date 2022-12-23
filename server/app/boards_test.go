package app

import (
	"testing"

	"github.com/mattermost/focalboard/server/utils"

	"github.com/stretchr/testify/assert"

	"github.com/mattermost/focalboard/server/model"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
)

func TestAddMemberToBoard(t *testing.T) {
	th, tearDown := SetupTestHelper(t)
	defer tearDown()

	t.Run("base case", func(t *testing.T) {
		const boardID = "board_id_1"
		const userID = "user_id_1"

		boardMember := &model.BoardMember{
			BoardID:      boardID,
			UserID:       userID,
			SchemeEditor: true,
		}

		th.Store.EXPECT().GetBoard(boardID).Return(&model.Board{
			ID:     "board_id_1",
			TeamID: "team_id_1",
		}, nil)

		th.Store.EXPECT().GetMemberForBoard(boardID, userID).Return(nil, nil)

		th.Store.EXPECT().SaveMember(mock.MatchedBy(func(i interface{}) bool {
			p := i.(*model.BoardMember)
			return p.BoardID == boardID && p.UserID == userID
		})).Return(&model.BoardMember{
			BoardID: boardID,
		}, nil)

		// for WS change broadcast
		th.Store.EXPECT().GetMembersForBoard(boardID).Return([]*model.BoardMember{}, nil)

		th.Store.EXPECT().GetUserCategoryBoards("user_id_1", "team_id_1").Return([]model.CategoryBoards{
			{
				Category: model.Category{
					ID:   "default_category_id",
					Name: "Boards",
					Type: "system",
				},
			},
		}, nil)
		th.Store.EXPECT().AddUpdateCategoryBoard("user_id_1", map[string]string{"board_id_1": "default_category_id"}).Return(nil)

		addedBoardMember, err := th.App.AddMemberToBoard(boardMember)
		require.NoError(t, err)
		require.Equal(t, boardID, addedBoardMember.BoardID)
	})

	t.Run("return existing non-synthetic membership if any", func(t *testing.T) {
		const boardID = "board_id_1"
		const userID = "user_id_1"

		boardMember := &model.BoardMember{
			BoardID:      boardID,
			UserID:       userID,
			SchemeEditor: true,
		}

		th.Store.EXPECT().GetBoard(boardID).Return(&model.Board{
			TeamID: "team_id_1",
		}, nil)

		th.Store.EXPECT().GetMemberForBoard(boardID, userID).Return(&model.BoardMember{
			UserID:    userID,
			BoardID:   boardID,
			Synthetic: false,
		}, nil)

		addedBoardMember, err := th.App.AddMemberToBoard(boardMember)
		require.NoError(t, err)
		require.Equal(t, boardID, addedBoardMember.BoardID)
	})

	t.Run("should convert synthetic membership into natural membership", func(t *testing.T) {
		const boardID = "board_id_1"
		const userID = "user_id_1"

		boardMember := &model.BoardMember{
			BoardID:      boardID,
			UserID:       userID,
			SchemeEditor: true,
		}

		th.Store.EXPECT().GetBoard(boardID).Return(&model.Board{
			ID:     "board_id_1",
			TeamID: "team_id_1",
		}, nil)

		th.Store.EXPECT().GetMemberForBoard(boardID, userID).Return(&model.BoardMember{
			UserID:    userID,
			BoardID:   boardID,
			Synthetic: true,
		}, nil)

		th.Store.EXPECT().SaveMember(mock.MatchedBy(func(i interface{}) bool {
			p := i.(*model.BoardMember)
			return p.BoardID == boardID && p.UserID == userID
		})).Return(&model.BoardMember{
			UserID:    userID,
			BoardID:   boardID,
			Synthetic: false,
		}, nil)

		// for WS change broadcast
		th.Store.EXPECT().GetMembersForBoard(boardID).Return([]*model.BoardMember{}, nil)

		th.Store.EXPECT().GetUserCategoryBoards("user_id_1", "team_id_1").Return([]model.CategoryBoards{
			{
				Category: model.Category{
					ID:   "default_category_id",
					Name: "Boards",
					Type: "system",
				},
			},
		}, nil)
		th.Store.EXPECT().AddUpdateCategoryBoard("user_id_1", map[string]string{"board_id_1": "default_category_id"}).Return(nil)

		addedBoardMember, err := th.App.AddMemberToBoard(boardMember)
		require.NoError(t, err)
		require.Equal(t, boardID, addedBoardMember.BoardID)
	})
}

func TestPatchBoard(t *testing.T) {
	th, tearDown := SetupTestHelper(t)
	defer tearDown()

	t.Run("base case, title patch", func(t *testing.T) {
		const boardID = "board_id_1"
		const userID = "user_id_1"
		const teamID = "team_id_1"

		patchTitle := "Patched Title"
		patch := &model.BoardPatch{
			Title: &patchTitle,
		}

		th.Store.EXPECT().PatchBoard(boardID, patch, userID).Return(
			&model.Board{
				ID:     boardID,
				TeamID: teamID,
				Title:  patchTitle,
			},
			nil)

		// for WS BroadcastBoardChange
		th.Store.EXPECT().GetMembersForBoard(boardID).Return([]*model.BoardMember{}, nil).Times(1)

		patchedBoard, err := th.App.PatchBoard(patch, boardID, userID)
		require.NoError(t, err)
		require.Equal(t, patchTitle, patchedBoard.Title)
	})

	t.Run("patch type open, no users", func(t *testing.T) {
		const boardID = "board_id_1"
		const userID = "user_id_2"
		const teamID = "team_id_1"

		patchType := model.BoardTypeOpen
		patch := &model.BoardPatch{
			Type: &patchType,
		}

		// Type not nil, will cause board to be reteived
		// to check isTemplate
		th.Store.EXPECT().GetBoard(boardID).Return(&model.Board{
			ID:         boardID,
			TeamID:     teamID,
			IsTemplate: true,
		}, nil)

		// Type not null will retrieve team members
		th.Store.EXPECT().GetUsersByTeam(teamID, "", false, false).Return([]*model.User{}, nil)

		th.Store.EXPECT().PatchBoard(boardID, patch, userID).Return(
			&model.Board{
				ID:     boardID,
				TeamID: teamID,
			},
			nil)

		// Should call GetMembersForBoard 2 times
		// - for WS BroadcastBoardChange
		// - for AddTeamMembers check
		th.Store.EXPECT().GetMembersForBoard(boardID).Return([]*model.BoardMember{}, nil).Times(2)

		patchedBoard, err := th.App.PatchBoard(patch, boardID, userID)
		require.NoError(t, err)
		require.Equal(t, boardID, patchedBoard.ID)
	})

	t.Run("patch type private, no users", func(t *testing.T) {
		const boardID = "board_id_1"
		const userID = "user_id_2"
		const teamID = "team_id_1"

		patchType := model.BoardTypePrivate
		patch := &model.BoardPatch{
			Type: &patchType,
		}

		// Type not nil, will cause board to be reteived
		// to check isTemplate
		th.Store.EXPECT().GetBoard(boardID).Return(&model.Board{
			ID:         boardID,
			TeamID:     teamID,
			IsTemplate: true,
		}, nil)

		// Type not null will retrieve team members
		th.Store.EXPECT().GetUsersByTeam(teamID, "", false, false).Return([]*model.User{}, nil)

		th.Store.EXPECT().PatchBoard(boardID, patch, userID).Return(
			&model.Board{
				ID:     boardID,
				TeamID: teamID,
			},
			nil)

		// Should call GetMembersForBoard 2 times
		// - for WS BroadcastBoardChange
		// - for AddTeamMembers check
		th.Store.EXPECT().GetMembersForBoard(boardID).Return([]*model.BoardMember{}, nil).Times(2)

		patchedBoard, err := th.App.PatchBoard(patch, boardID, userID)
		require.NoError(t, err)
		require.Equal(t, boardID, patchedBoard.ID)
	})

	t.Run("patch type open, single user", func(t *testing.T) {
		const boardID = "board_id_1"
		const userID = "user_id_2"
		const teamID = "team_id_1"

		patchType := model.BoardTypeOpen
		patch := &model.BoardPatch{
			Type: &patchType,
		}

		// Type not nil, will cause board to be reteived
		// to check isTemplate
		th.Store.EXPECT().GetBoard(boardID).Return(&model.Board{
			ID:         boardID,
			TeamID:     teamID,
			IsTemplate: true,
		}, nil)
		// Type not null will retrieve team members
		th.Store.EXPECT().GetUsersByTeam(teamID, "", false, false).Return([]*model.User{{ID: userID}}, nil)

		th.Store.EXPECT().PatchBoard(boardID, patch, userID).Return(
			&model.Board{
				ID:     boardID,
				TeamID: teamID,
			},
			nil)

		// Should call GetMembersForBoard 3 times
		// for WS BroadcastBoardChange
		// for AddTeamMembers check
		// for WS BroadcastMemberChange
		th.Store.EXPECT().GetMembersForBoard(boardID).Return([]*model.BoardMember{}, nil).Times(3)

		patchedBoard, err := th.App.PatchBoard(patch, boardID, userID)
		require.NoError(t, err)
		require.Equal(t, boardID, patchedBoard.ID)
	})

	t.Run("patch type private, single user", func(t *testing.T) {
		const boardID = "board_id_1"
		const userID = "user_id_2"
		const teamID = "team_id_1"

		patchType := model.BoardTypePrivate
		patch := &model.BoardPatch{
			Type: &patchType,
		}

		// Type not nil, will cause board to be reteived
		// to check isTemplate
		th.Store.EXPECT().GetBoard(boardID).Return(&model.Board{
			ID:         boardID,
			TeamID:     teamID,
			IsTemplate: true,
		}, nil)
		// Type not null will retrieve team members
		th.Store.EXPECT().GetUsersByTeam(teamID, "", false, false).Return([]*model.User{{ID: userID}}, nil)

		th.Store.EXPECT().PatchBoard(boardID, patch, userID).Return(
			&model.Board{
				ID:     boardID,
				TeamID: teamID,
			},
			nil)

		// Should call GetMembersForBoard 3 times
		// for WS BroadcastBoardChange
		// for AddTeamMembers check
		// for WS BroadcastMemberChange
		th.Store.EXPECT().GetMembersForBoard(boardID).Return([]*model.BoardMember{}, nil).Times(3)

		patchedBoard, err := th.App.PatchBoard(patch, boardID, userID)
		require.NoError(t, err)
		require.Equal(t, boardID, patchedBoard.ID)
	})

	t.Run("patch type open, user with member", func(t *testing.T) {
		const boardID = "board_id_1"
		const userID = "user_id_2"
		const teamID = "team_id_1"

		patchType := model.BoardTypeOpen
		patch := &model.BoardPatch{
			Type: &patchType,
		}

		// Type not nil, will cause board to be reteived
		// to check isTemplate
		th.Store.EXPECT().GetBoard(boardID).Return(&model.Board{
			ID:         boardID,
			TeamID:     teamID,
			IsTemplate: true,
		}, nil)
		// Type not null will retrieve team members
		th.Store.EXPECT().GetUsersByTeam(teamID, "", false, false).Return([]*model.User{{ID: userID}}, nil)

		th.Store.EXPECT().PatchBoard(boardID, patch, userID).Return(
			&model.Board{
				ID:     boardID,
				TeamID: teamID,
			},
			nil)

		// Should call GetMembersForBoard 2 times
		// for WS BroadcastBoardChange
		// for AddTeamMembers check
		// We are returning the user as a direct Board Member, so BroadcastMemberDelete won't be called
		th.Store.EXPECT().GetMembersForBoard(boardID).Return([]*model.BoardMember{{BoardID: boardID, UserID: userID, SchemeEditor: true}}, nil).Times(2)

		patchedBoard, err := th.App.PatchBoard(patch, boardID, userID)
		require.NoError(t, err)
		require.Equal(t, boardID, patchedBoard.ID)
	})

	t.Run("patch type private, user with member", func(t *testing.T) {
		const boardID = "board_id_1"
		const userID = "user_id_2"
		const teamID = "team_id_1"

		patchType := model.BoardTypePrivate
		patch := &model.BoardPatch{
			Type: &patchType,
		}

		// Type not nil, will cause board to be reteived
		// to check isTemplate
		th.Store.EXPECT().GetBoard(boardID).Return(&model.Board{
			ID:         boardID,
			TeamID:     teamID,
			IsTemplate: true,
		}, nil)
		// Type not null will retrieve team members
		th.Store.EXPECT().GetUsersByTeam(teamID, "", false, false).Return([]*model.User{{ID: userID}}, nil)

		th.Store.EXPECT().PatchBoard(boardID, patch, userID).Return(
			&model.Board{
				ID:     boardID,
				TeamID: teamID,
			},
			nil)

		// Should call GetMembersForBoard 2 times
		// for WS BroadcastBoardChange
		// for AddTeamMembers check
		// We are returning the user as a direct Board Member, so BroadcastMemberDelete won't be called
		th.Store.EXPECT().GetMembersForBoard(boardID).Return([]*model.BoardMember{{BoardID: boardID, UserID: userID, SchemeEditor: true}}, nil).Times(2)

		patchedBoard, err := th.App.PatchBoard(patch, boardID, userID)
		require.NoError(t, err)
		require.Equal(t, boardID, patchedBoard.ID)
	})
}

func TestGetBoardCount(t *testing.T) {
	th, tearDown := SetupTestHelper(t)
	defer tearDown()

	t.Run("base case", func(t *testing.T) {
		boardCount := int64(100)
		th.Store.EXPECT().GetBoardCount().Return(boardCount, nil)

		count, err := th.App.GetBoardCount()
		require.NoError(t, err)
		require.Equal(t, boardCount, count)
	})
}

func TestBoardCategory(t *testing.T) {
	th, tearDown := SetupTestHelper(t)
	defer tearDown()

	t.Run("test addBoardsToDefaultCategory", func(t *testing.T) {
		t.Run("no boards default category exists", func(t *testing.T) {
			th.Store.EXPECT().GetUserCategoryBoards("user_id", "team_id").Return([]model.CategoryBoards{
				{
					Category: model.Category{ID: "category_id_1", Name: "Category 1"},
					BoardIDs: []string{"board_id_1", "board_id_2"},
				},
				{
					Category: model.Category{ID: "category_id_2", Name: "Category 2"},
					BoardIDs: []string{"board_id_3"},
				},
				{
					Category: model.Category{ID: "category_id_3", Name: "Category 3"},
					BoardIDs: []string{},
				},
			}, nil)

			th.Store.EXPECT().CreateCategory(utils.Anything).Return(nil)
			th.Store.EXPECT().GetCategory(utils.Anything).Return(&model.Category{
				ID:   "default_category_id",
				Name: "Boards",
			}, nil)
			th.Store.EXPECT().GetMembersForUser("user_id").Return([]*model.BoardMember{}, nil)
			th.Store.EXPECT().GetBoardsForUserAndTeam("user_id", "team_id", false).Return([]*model.Board{}, nil)
			th.Store.EXPECT().AddUpdateCategoryBoard("user_id", map[string]string{
				"board_id_1": "default_category_id",
				"board_id_2": "default_category_id",
				"board_id_3": "default_category_id",
			}).Return(nil)

			boards := []*model.Board{
				{ID: "board_id_1"},
				{ID: "board_id_2"},
				{ID: "board_id_3"},
			}

			err := th.App.addBoardsToDefaultCategory("user_id", "team_id", boards)
			assert.NoError(t, err)
		})
	})
}

func TestDuplicateBoard(t *testing.T) {
	th, tearDown := SetupTestHelper(t)
	defer tearDown()

	t.Run("base case", func(t *testing.T) {
		board := &model.Board{
			ID:    "board_id_2",
			Title: "Duplicated Board",
		}

		block := &model.Block{
			ID:   "block_id_1",
			Type: "image",
		}

		th.Store.EXPECT().DuplicateBoard("board_id_1", "user_id_1", "team_id_1", false).Return(
			&model.BoardsAndBlocks{
				Boards: []*model.Board{
					board,
				},
				Blocks: []*model.Block{
					block,
				},
			},
			[]*model.BoardMember{},
			nil,
		)

		th.Store.EXPECT().GetBoard("board_id_1").Return(&model.Board{}, nil)

		th.Store.EXPECT().GetUserCategoryBoards("user_id_1", "team_id_1").Return([]model.CategoryBoards{
			{
				Category: model.Category{
					ID:   "category_id_1",
					Name: "Boards",
					Type: "system",
				},
			},
		}, nil).Times(2)

		th.Store.EXPECT().AddUpdateCategoryBoard("user_id_1", utils.Anything).Return(nil)

		// for WS change broadcast
		th.Store.EXPECT().GetMembersForBoard(utils.Anything).Return([]*model.BoardMember{}, nil).Times(2)

		bab, members, err := th.App.DuplicateBoard("board_id_1", "user_id_1", "team_id_1", false)
		assert.NoError(t, err)
		assert.NotNil(t, bab)
		assert.NotNil(t, members)
	})

	t.Run("duplicating board as template should not set it's category", func(t *testing.T) {
		board := &model.Board{
			ID:    "board_id_2",
			Title: "Duplicated Board",
		}

		block := &model.Block{
			ID:   "block_id_1",
			Type: "image",
		}

		th.Store.EXPECT().DuplicateBoard("board_id_1", "user_id_1", "team_id_1", true).Return(
			&model.BoardsAndBlocks{
				Boards: []*model.Board{
					board,
				},
				Blocks: []*model.Block{
					block,
				},
			},
			[]*model.BoardMember{},
			nil,
		)

		th.Store.EXPECT().GetBoard("board_id_1").Return(&model.Board{}, nil)

		// for WS change broadcast
		th.Store.EXPECT().GetMembersForBoard(utils.Anything).Return([]*model.BoardMember{}, nil).Times(2)

		bab, members, err := th.App.DuplicateBoard("board_id_1", "user_id_1", "team_id_1", true)
		assert.NoError(t, err)
		assert.NotNil(t, bab)
		assert.NotNil(t, members)
	})
}
