package storetests

import (
	"testing"
	"time"

	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/services/store"
	"github.com/mattermost/focalboard/server/utils"
	"github.com/stretchr/testify/require"
)

func StoreTestBoardStore(t *testing.T, setup func(t *testing.T) (store.Store, func())) {
	container := store.Container{
		WorkspaceID: "0",
	}

	t.Run("GetBoardHistory", func(t *testing.T) {
		store, tearDown := setup(t)
		defer tearDown()
		testGetBoardHistory(t, store, container)
	})
}

func testGetBoardHistory(t *testing.T, store store.Store, container store.Container) {
	userID := testUserID

	t.Run("testGetBoardHistory: create board", func(t *testing.T) {
		originalTitle := "Board: original title"
		boardID := utils.NewID(utils.IDTypeBoard)
		// board := &model.Board{
		// 	ID:     boardID,
		// 	Title:  originalTitle,
		// 	TeamID: testTeamID,
		// 	Type:   model.BoardTypeOpen,
		// }

		board := &model.Block{
			ID:     boardID,
			RootID: boardID,

			Title: originalTitle,
			Type:  model.TypeBoard,
		}

		err := store.InsertBlock(container, board, userID)
		require.NoError(t, err)

		opts := model.QueryBlockHistoryOptions{
			Limit:      0,
			Descending: false,
		}

		boards, err := store.GetBlockHistory(container, board.ID, opts)
		require.NoError(t, err)
		require.Len(t, boards, 1)

		// wait to avoid hitting pk uniqueness constraint in history
		time.Sleep(10 * time.Millisecond)

		userID2 := "user-id-2"
		newTitle := "Board: A new title"
		newDescription := "A new description"
		patch := &model.BlockPatch{
			Title: &newTitle,
			UpdatedFields: map[string]interface{}{
				"Description": newDescription,
			},
		}
		err = store.PatchBlock(container, boardID, patch, userID2)
		require.NoError(t, err)
		patchedBoard, err := store.GetBlock(container, board.ID)

		// Updated history
		boards, err = store.GetBlockHistory(container, board.ID, opts)
		require.NoError(t, err)
		require.Len(t, boards, 2)
		require.Equal(t, boards[0].Title, originalTitle)
		require.Equal(t, boards[1].Title, newTitle)
		require.Equal(t, boards[1].Fields["Description"], newDescription)

		// Check history against latest board
		rBoard2, err := store.GetBlock(container, board.ID)
		require.NoError(t, err)
		require.Equal(t, rBoard2.Title, newTitle)
		require.Equal(t, rBoard2.Title, boards[1].Title)
		require.NotZero(t, rBoard2.UpdateAt)
		require.Equal(t, board.UpdateAt, boards[0].UpdateAt)
		require.Equal(t, rBoard2.UpdateAt, patchedBoard.UpdateAt)
		require.Equal(t, rBoard2.UpdateAt, boards[1].UpdateAt)
		require.Equal(t, board, boards[0])
		require.Equal(t, rBoard2, boards[1])

		// wait to avoid hitting pk uniqueness constraint in history
		time.Sleep(10 * time.Millisecond)

		newTitle2 := "Board: A new title 2"
		patch2 := &model.BlockPatch{Title: &newTitle2}
		err = store.PatchBlock(container, boardID, patch2, userID2)
		require.NoError(t, err)
		patchBoard2, err := store.GetBlock(container, board.ID)

		// Updated history
		opts = model.QueryBlockHistoryOptions{
			Limit:      1,
			Descending: true,
		}
		boards, err = store.GetBlockHistory(container, board.ID, opts)
		require.NoError(t, err)
		require.Len(t, boards, 1)
		require.Equal(t, boards[0].Title, newTitle2)
		require.Equal(t, boards[0], patchBoard2)

		// Delete board
		time.Sleep(10 * time.Millisecond)
		err = store.DeleteBlock(container, boardID, userID)
		require.NoError(t, err)

		// Updated history after delete
		opts = model.QueryBlockHistoryOptions{
			Limit:      0,
			Descending: true,
		}
		boards, err = store.GetBlockHistory(container, board.ID, opts)
		require.NoError(t, err)
		require.Len(t, boards, 4)
		require.NotZero(t, boards[0].UpdateAt)
		require.Greater(t, boards[0].UpdateAt, patchBoard2.UpdateAt)
		require.NotZero(t, boards[0].DeleteAt)
		require.Greater(t, boards[0].DeleteAt, patchBoard2.UpdateAt)
	})

	t.Run("testGetBoardHistory: nonexisting board", func(t *testing.T) {
		opts := model.QueryBlockHistoryOptions{
			Limit:      0,
			Descending: false,
		}
		boards, err := store.GetBlockHistory(container, "nonexistent-id", opts)
		require.NoError(t, err)
		require.Len(t, boards, 0)
	})
}
