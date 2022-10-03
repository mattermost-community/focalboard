package app

import (
	"testing"

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
		th.Store.EXPECT().GetUsersByTeam(teamID, "").Return([]*model.User{}, nil)

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
		th.Store.EXPECT().GetUsersByTeam(teamID, "").Return([]*model.User{}, nil)

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
		th.Store.EXPECT().GetUsersByTeam(teamID, "").Return([]*model.User{{ID: userID}}, nil)

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
		th.Store.EXPECT().GetUsersByTeam(teamID, "").Return([]*model.User{{ID: userID}}, nil)

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
		th.Store.EXPECT().GetUsersByTeam(teamID, "").Return([]*model.User{{ID: userID}}, nil)

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
		th.Store.EXPECT().GetUsersByTeam(teamID, "").Return([]*model.User{{ID: userID}}, nil)

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
