package integrationtests

import (
	"testing"

	"github.com/mattermost/focalboard/server/model"

	"github.com/stretchr/testify/require"
)

func TestCreateBoardsAndBlocks(t *testing.T) {
	teamID := "team-id"

	t.Run("a non authenticated user should be rejected", func(t *testing.T) {
		th := SetupTestHelper(t).Start()
		defer th.TearDown()

		newBab := &model.BoardsAndBlocks{
			Boards: []*model.Board{},
			Blocks: []model.Block{},
		}

		bab, resp := th.Client.CreateBoardsAndBlocks(newBab)
		th.CheckUnauthorized(resp)
		require.Nil(t, bab)
	})

	t.Run("invalid boards and blocks", func(t *testing.T) {
		th := SetupTestHelper(t).InitBasic()
		defer th.TearDown()

		t.Run("no boards", func(t *testing.T) {
			newBab := &model.BoardsAndBlocks{
				Boards: []*model.Board{},
				Blocks: []model.Block{
					{ID: "block-id", BoardID: "board-id", RootID: "block-id", Type: model.TypeCard},
				},
			}

			bab, resp := th.Client.CreateBoardsAndBlocks(newBab)
			th.CheckBadRequest(resp)
			require.Nil(t, bab)
		})

		t.Run("no blocks", func(t *testing.T) {
			newBab := &model.BoardsAndBlocks{
				Boards: []*model.Board{
					{ID: "board-id", TeamID: teamID, Type: model.BoardTypePrivate},
				},
				Blocks: []model.Block{},
			}

			bab, resp := th.Client.CreateBoardsAndBlocks(newBab)
			th.CheckBadRequest(resp)
			require.Nil(t, bab)
		})

		t.Run("blocks from nonexistent boards", func(t *testing.T) {
			newBab := &model.BoardsAndBlocks{
				Boards: []*model.Board{
					{ID: "board-id", TeamID: teamID, Type: model.BoardTypePrivate},
				},
				Blocks: []model.Block{
					{ID: "block-id", BoardID: "nonexistent-board-id", RootID: "block-id", Type: model.TypeCard, CreateAt: 1, UpdateAt: 1},
				},
			}

			bab, resp := th.Client.CreateBoardsAndBlocks(newBab)
			th.CheckBadRequest(resp)
			require.Nil(t, bab)
		})

		t.Run("boards with no IDs", func(t *testing.T) {
			newBab := &model.BoardsAndBlocks{
				Boards: []*model.Board{
					{ID: "board-id", TeamID: teamID, Type: model.BoardTypePrivate},
					{TeamID: teamID, Type: model.BoardTypePrivate},
				},
				Blocks: []model.Block{
					{ID: "block-id", BoardID: "board-id", RootID: "block-id", Type: model.TypeCard, CreateAt: 1, UpdateAt: 1},
				},
			}

			bab, resp := th.Client.CreateBoardsAndBlocks(newBab)
			th.CheckBadRequest(resp)
			require.Nil(t, bab)
		})

		t.Run("boards from different teams", func(t *testing.T) {
			newBab := &model.BoardsAndBlocks{
				Boards: []*model.Board{
					{ID: "board-id-1", TeamID: "team-id-1", Type: model.BoardTypePrivate},
					{ID: "board-id-2", TeamID: "team-id-2", Type: model.BoardTypePrivate},
				},
				Blocks: []model.Block{
					{ID: "block-id", BoardID: "board-id-1", RootID: "block-id", Type: model.TypeCard, CreateAt: 1, UpdateAt: 1},
				},
			}

			bab, resp := th.Client.CreateBoardsAndBlocks(newBab)
			th.CheckBadRequest(resp)
			require.Nil(t, bab)
		})

		t.Run("creating boards and blocks", func(t *testing.T) {
			newBab := &model.BoardsAndBlocks{
				Boards: []*model.Board{
					{ID: "board-id-1", Title: "public board", TeamID: teamID, Type: model.BoardTypeOpen},
					{ID: "board-id-2", Title: "private board", TeamID: teamID, Type: model.BoardTypePrivate},
				},
				Blocks: []model.Block{
					{ID: "block-id-1", Title: "block 1", BoardID: "board-id-1", RootID: "block-id-1", Type: model.TypeCard, CreateAt: 1, UpdateAt: 1},
					{ID: "block-id-2", Title: "block 2", BoardID: "board-id-2", RootID: "block-id-2", Type: model.TypeCard, CreateAt: 1, UpdateAt: 1},
				},
			}

			bab, resp := th.Client.CreateBoardsAndBlocks(newBab)
			th.CheckOK(resp)
			require.NotNil(t, bab)

			require.Len(t, bab.Boards, 2)
			require.Len(t, bab.Blocks, 2)

			// board 1 should have been created with a new ID, and its
			// block should be there too
			boardsTermPublic, resp := th.Client.SearchBoardsForTeam(teamID, "public")
			th.CheckOK(resp)
			require.Len(t, boardsTermPublic, 1)
			board1 := boardsTermPublic[0]
			require.Equal(t, "public board", board1.Title)
			require.Equal(t, model.BoardTypeOpen, board1.Type)
			require.NotEqual(t, "board-id-1", board1.ID)
			blocks1, err := th.Server.App().GetBlocksForBoard(board1.ID)
			require.NoError(t, err)
			require.Len(t, blocks1, 1)
			require.Equal(t, "block 1", blocks1[0].Title)

			// board 1 should have been created with a new ID, and its
			// block should be there too
			boardsTermPrivate, resp := th.Client.SearchBoardsForTeam(teamID, "private")
			th.CheckOK(resp)
			require.Len(t, boardsTermPrivate, 1)
			board2 := boardsTermPrivate[0]
			require.Equal(t, "private board", board2.Title)
			require.Equal(t, model.BoardTypePrivate, board2.Type)
			require.NotEqual(t, "board-id-2", board2.ID)
			blocks2, err := th.Server.App().GetBlocksForBoard(board2.ID)
			require.NoError(t, err)
			require.Len(t, blocks2, 1)
			require.Equal(t, "block 2", blocks2[0].Title)

			// user should be an admin of both newly created boards
			user1 := th.GetUser1()
			members1, err := th.Server.App().GetMembersForBoard(board1.ID)
			require.NoError(t, err)
			require.Len(t, members1, 1)
			require.Equal(t, user1.ID, members1[0].UserID)
			members2, err := th.Server.App().GetMembersForBoard(board2.ID)
			require.NoError(t, err)
			require.Len(t, members2, 1)
			require.Equal(t, user1.ID, members2[0].UserID)
		})
	})
}

func TestPatchBoardsAndBlocks(t *testing.T) {
	// ToDo: implement
}

func TestDeleteBoardsAndBlocks(t *testing.T) {
	// ToDo: implement
}
