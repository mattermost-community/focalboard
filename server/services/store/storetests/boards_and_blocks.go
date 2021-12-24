package storetests

import (
	"testing"

	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/services/store"

	"github.com/stretchr/testify/require"
)

func StoreTestBoardsAndBlocksStore(t *testing.T, setup func(t *testing.T) (store.Store, func())) {
	t.Run("createBoardsAndBlocks", func(t *testing.T) {
		store, tearDown := setup(t)
		defer tearDown()
		testCreateBoardsAndBlocks(t, store)
	})
	t.Run("patchBoardsAndBlocks", func(t *testing.T) {
		store, tearDown := setup(t)
		defer tearDown()
		testPatchBoardsAndBlocks(t, store)
	})
	t.Run("deleteBoardsAndBlocks", func(t *testing.T) {
		store, tearDown := setup(t)
		defer tearDown()
		testDeleteBoardsAndBlocks(t, store)
	})
}

func testCreateBoardsAndBlocks(t *testing.T, store store.Store) {
	teamID := "team-id"
	userID := "user-id"

	boards, err := store.GetBoardsForUserAndTeam(userID, teamID)
	require.Nil(t, err)
	require.Empty(t, boards)

	t.Run("create boards and blocks", func(t *testing.T) {
		newBab := &model.BoardsAndBlocks{
			Boards: []*model.Board{
				{ID: "board-id-1", TeamID: teamID, Type: model.BoardTypeOpen},
				{ID: "board-id-2", TeamID: teamID, Type: model.BoardTypePrivate},
				{ID: "board-id-3", TeamID: teamID, Type: model.BoardTypeOpen},
			},
			Blocks: []model.Block{
				{ID: "block-id-1", BoardID: "board-id-1", RootID: "block-id-1", Type: model.TypeCard},
				{ID: "block-id-2", BoardID: "board-id-2", RootID: "block-id-2", Type: model.TypeCard},
			},
		}

		bab, err := store.CreateBoardsAndBlocks(newBab, userID)
		require.Nil(t, err)
		require.NotNil(t, bab)
		require.Len(t, bab.Boards, 3)
		require.Len(t, bab.Blocks, 2)

		boardIDs := []string{}
		for _, board := range bab.Boards {
			boardIDs = append(boardIDs, board.ID)
		}

		blockIDs := []string{}
		for _, block := range bab.Blocks {
			blockIDs = append(blockIDs, block.ID)
		}

		require.ElementsMatch(t, []string{"board-id-1", "board-id-2", "board-id-3"}, boardIDs)
		require.ElementsMatch(t, []string{"block-id-1", "block-id-2"}, blockIDs)
	})

	t.Run("create boards and blocks with admin", func(t *testing.T) {
		newBab := &model.BoardsAndBlocks{
			Boards: []*model.Board{
				{ID: "board-id-4", TeamID: teamID, Type: model.BoardTypeOpen},
				{ID: "board-id-5", TeamID: teamID, Type: model.BoardTypePrivate},
				{ID: "board-id-6", TeamID: teamID, Type: model.BoardTypeOpen},
			},
			Blocks: []model.Block{
				{ID: "block-id-3", BoardID: "board-id-4", RootID: "block-id-3", Type: model.TypeCard},
				{ID: "block-id-4", BoardID: "board-id-5", RootID: "block-id-4", Type: model.TypeCard},
			},
		}

		bab, members, err := store.CreateBoardsAndBlocksWithAdmin(newBab, userID)
		require.Nil(t, err)
		require.NotNil(t, bab)
		require.Len(t, bab.Boards, 3)
		require.Len(t, bab.Blocks, 2)
		require.Len(t, members, 3)

		boardIDs := []string{}
		for _, board := range bab.Boards {
			boardIDs = append(boardIDs, board.ID)
		}

		blockIDs := []string{}
		for _, block := range bab.Blocks {
			blockIDs = append(blockIDs, block.ID)
		}

		require.ElementsMatch(t, []string{"board-id-4", "board-id-5", "board-id-6"}, boardIDs)
		require.ElementsMatch(t, []string{"block-id-3", "block-id-4"}, blockIDs)

		memberBoardIDs := []string{}
		for _, member := range members {
			require.Equal(t, userID, member.UserID)
			memberBoardIDs = append(memberBoardIDs, member.BoardID)
		}
		require.ElementsMatch(t, []string{"board-id-4", "board-id-5", "board-id-6"}, memberBoardIDs)
	})

	t.Run("on failure, nothing should be saved", func(t *testing.T) {
		// one of the blocks is invalid as it doesn't have RootID
		newBab := &model.BoardsAndBlocks{
			Boards: []*model.Board{
				{ID: "board-id-7", TeamID: teamID, Type: model.BoardTypeOpen},
				{ID: "board-id-8", TeamID: teamID, Type: model.BoardTypePrivate},
				{ID: "board-id-9", TeamID: teamID, Type: model.BoardTypeOpen},
			},
			Blocks: []model.Block{
				{ID: "block-id-5", BoardID: "board-id-7", RootID: "block-id-5", Type: model.TypeCard},
				{ID: "block-id-6", BoardID: "board-id-8", Type: model.TypeCard},
			},
		}

		bab, err := store.CreateBoardsAndBlocks(newBab, userID)
		require.Error(t, err)
		require.Nil(t, bab)

		bab, members, err := store.CreateBoardsAndBlocksWithAdmin(newBab, userID)
		require.Error(t, err)
		require.Empty(t, bab)
		require.Empty(t, members)
	})
}

func testPatchBoardsAndBlocks(t *testing.T, store store.Store) {
	// ToDo: implement
}

func testDeleteBoardsAndBlocks(t *testing.T, store store.Store) {
	// ToDo: implement
}
