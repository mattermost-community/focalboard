// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
package storetests

import (
	"testing"
	"time"

	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/services/store"
	"github.com/mattermost/focalboard/server/utils"

	"github.com/stretchr/testify/require"
)

func StoreTestDataRetention(t *testing.T, setup func(t *testing.T) (store.Store, func())) {
	t.Run("RunDataRetention", func(t *testing.T) {
		store, tearDown := setup(t)
		defer tearDown()
		testRunDataRetention(t, store)
	})
}

func testRunDataRetention(t *testing.T, store store.Store) {
	validBoard := model.Board{
		ID:         "board-id-test",
		IsTemplate: false,
		ModifiedBy: testUserID,
		TeamID:     testTeamID,
	}
	board, err := store.InsertBoard(&validBoard, "user-id-1")
	require.NoError(t, err)

	validBlock := model.Block{
		ID:         "id-test",
		BoardID:    board.ID,
		ModifiedBy: testUserID,
	}

	validBlock2 := model.Block{
		ID:         "id-test2",
		BoardID:    board.ID,
		ModifiedBy: testUserID,
	}
	validBlock3 := model.Block{
		ID:         "id-test3",
		BoardID:    board.ID,
		ModifiedBy: testUserID,
	}

	validBlock4 := model.Block{
		ID:         "id-test4",
		BoardID:    board.ID,
		ModifiedBy: testUserID,
	}

	newBlocks := []model.Block{validBlock, validBlock2, validBlock3, validBlock4}

	err = store.InsertBlocks(newBlocks, "user-id-1")
	require.NoError(t, err)

	blocks, err := store.GetBlocksWithBoardID(board.ID)
	require.NoError(t, err)
	require.Len(t, blocks, len(newBlocks))
	initialCount := len(blocks)

	t.Run("test no deletions", func(t *testing.T) {
		deletions, err := store.RunDataRetention(utils.GetMillisForTime(time.Now().Add(-time.Hour*1)), 10)
		require.NoError(t, err)
		require.Equal(t, int64(0), deletions)
	})

	t.Run("test all deletions", func(t *testing.T) {
		deletions, err := store.RunDataRetention(utils.GetMillisForTime(time.Now().Add(time.Hour*1)), 2)
		require.NoError(t, err)
		require.True(t, deletions > int64(initialCount))

		// expect all blocks to be deleted.
		blocks, errBlocks := store.GetBlocksWithBoardID(board.ID)
		require.NoError(t, errBlocks)
		require.Equal(t, 0, len(blocks))
	})
}
