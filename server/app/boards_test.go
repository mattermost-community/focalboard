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
