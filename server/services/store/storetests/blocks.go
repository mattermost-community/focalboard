package storetests

import (
	"testing"
	"time"

	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/services/store"
	"github.com/mattermost/focalboard/server/utils"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

const (
	testUserID  = "user-id"
	testTeamID  = "team-id"
	testBoardID = "board-id"
)

func StoreTestBlocksStore(t *testing.T, setup func(t *testing.T) (store.Store, func())) {
	t.Run("InsertBlock", func(t *testing.T) {
		store, tearDown := setup(t)
		defer tearDown()
		testInsertBlock(t, store)
	})
	t.Run("InsertBlocks", func(t *testing.T) {
		store, tearDown := setup(t)
		defer tearDown()
		testInsertBlocks(t, store)
	})
	t.Run("PatchBlock", func(t *testing.T) {
		store, tearDown := setup(t)
		defer tearDown()
		testPatchBlock(t, store)
	})
	t.Run("PatchBlocks", func(t *testing.T) {
		store, tearDown := setup(t)
		defer tearDown()
		testPatchBlocks(t, store)
	})
	t.Run("DeleteBlock", func(t *testing.T) {
		store, tearDown := setup(t)
		defer tearDown()
		testDeleteBlock(t, store)
	})
	t.Run("UndeleteBlock", func(t *testing.T) {
		store, tearDown := setup(t)
		defer tearDown()
		testUndeleteBlock(t, store)
	})
	t.Run("GetSubTree2", func(t *testing.T) {
		store, tearDown := setup(t)
		defer tearDown()
		testGetSubTree2(t, store)
	})
	t.Run("GetBlocks", func(t *testing.T) {
		store, tearDown := setup(t)
		defer tearDown()
		testGetBlocks(t, store)
	})
	t.Run("GetBlock", func(t *testing.T) {
		store, tearDown := setup(t)
		defer tearDown()
		testGetBlock(t, store)
	})
	t.Run("DuplicateBlock", func(t *testing.T) {
		store, tearDown := setup(t)
		defer tearDown()
		testDuplicateBlock(t, store)
	})
	t.Run("GetBlockMetadata", func(t *testing.T) {
		store, tearDown := setup(t)
		defer tearDown()
		testGetBlockMetadata(t, store)
	})
}

func testInsertBlock(t *testing.T, store store.Store) {
	userID := testUserID
	boardID := testBoardID

	blocks, errBlocks := store.GetBlocksForBoard(boardID)
	require.NoError(t, errBlocks)
	initialCount := len(blocks)

	t.Run("valid block", func(t *testing.T) {
		block := model.Block{
			ID:         "id-test",
			BoardID:    boardID,
			ModifiedBy: userID,
		}

		err := store.InsertBlock(&block, "user-id-1")
		require.NoError(t, err)

		blocks, err := store.GetBlocksForBoard(boardID)
		require.NoError(t, err)
		require.Len(t, blocks, initialCount+1)
	})

	t.Run("invalid rootid", func(t *testing.T) {
		block := model.Block{
			ID:         "id-test",
			BoardID:    "",
			ModifiedBy: userID,
		}

		err := store.InsertBlock(&block, "user-id-1")
		require.Error(t, err)

		blocks, err := store.GetBlocksForBoard(boardID)
		require.NoError(t, err)
		require.Len(t, blocks, initialCount+1)
	})

	t.Run("invalid fields data", func(t *testing.T) {
		block := model.Block{
			ID:         "id-test",
			BoardID:    "id-test",
			ModifiedBy: userID,
			Fields:     map[string]interface{}{"no-serialiable-value": t.Run},
		}

		err := store.InsertBlock(&block, "user-id-1")
		require.Error(t, err)

		blocks, err := store.GetBlocksForBoard(boardID)
		require.NoError(t, err)
		require.Len(t, blocks, initialCount+1)
	})

	t.Run("insert new block", func(t *testing.T) {
		block := model.Block{
			BoardID: testBoardID,
		}

		err := store.InsertBlock(&block, "user-id-2")
		require.NoError(t, err)
		require.Equal(t, "user-id-2", block.CreatedBy)
	})

	t.Run("update existing block", func(t *testing.T) {
		block := model.Block{
			ID:      "id-2",
			BoardID: "board-id-1",
			Title:   "Old Title",
		}

		// inserting
		err := store.InsertBlock(&block, "user-id-2")
		require.NoError(t, err)

		// created by populated from user id for new blocks
		require.Equal(t, "user-id-2", block.CreatedBy)

		// hack to avoid multiple, quick updates to a card
		// violating block_history composite primary key constraint
		time.Sleep(1 * time.Millisecond)

		// updating
		newBlock := model.Block{
			ID:        "id-2",
			BoardID:   "board-id-1",
			CreatedBy: "user-id-3",
			Title:     "New Title",
		}
		err = store.InsertBlock(&newBlock, "user-id-4")
		require.NoError(t, err)
		// created by is not altered for existing blocks
		require.Equal(t, "user-id-3", newBlock.CreatedBy)
		require.Equal(t, "New Title", newBlock.Title)
	})

	createdAt, err := time.Parse(time.RFC822, "01 Jan 90 01:00 IST")
	assert.NoError(t, err)

	updateAt, err := time.Parse(time.RFC822, "02 Jan 90 01:00 IST")
	assert.NoError(t, err)

	t.Run("data tamper attempt", func(t *testing.T) {
		block := model.Block{
			ID:         "id-10",
			BoardID:    "board-id-1",
			Title:      "Old Title",
			CreateAt:   utils.GetMillisForTime(createdAt),
			UpdateAt:   utils.GetMillisForTime(updateAt),
			CreatedBy:  "user-id-5",
			ModifiedBy: "user-id-6",
		}

		// inserting
		err := store.InsertBlock(&block, "user-id-1")
		require.NoError(t, err)
		expectedTime := time.Now()

		retrievedBlock, err := store.GetBlock("id-10")
		assert.NoError(t, err)
		assert.NotNil(t, retrievedBlock)
		assert.Equal(t, "board-id-1", retrievedBlock.BoardID)
		assert.Equal(t, "user-id-1", retrievedBlock.CreatedBy)
		assert.Equal(t, "user-id-1", retrievedBlock.ModifiedBy)
		assert.WithinDurationf(t, expectedTime, utils.GetTimeForMillis(retrievedBlock.CreateAt), 1*time.Second, "create time should be current time")
		assert.WithinDurationf(t, expectedTime, utils.GetTimeForMillis(retrievedBlock.UpdateAt), 1*time.Second, "update time should be current time")
	})
}

func testInsertBlocks(t *testing.T, store store.Store) {
	userID := testUserID

	blocks, errBlocks := store.GetBlocksForBoard("id-test")
	require.NoError(t, errBlocks)
	initialCount := len(blocks)

	t.Run("invalid block", func(t *testing.T) {
		validBlock := model.Block{
			ID:         "id-test",
			BoardID:    "id-test",
			ModifiedBy: userID,
		}

		invalidBlock := model.Block{
			ID:         "id-test",
			BoardID:    "",
			ModifiedBy: userID,
		}

		newBlocks := []model.Block{validBlock, invalidBlock}

		time.Sleep(1 * time.Millisecond)
		err := store.InsertBlocks(newBlocks, "user-id-1")
		require.Error(t, err)

		blocks, err := store.GetBlocksForBoard("id-test")
		require.NoError(t, err)
		// no blocks should have been inserted
		require.Len(t, blocks, initialCount)
	})
}

func testPatchBlock(t *testing.T, store store.Store) {
	userID := testUserID
	boardID := "board-id-1"

	block := model.Block{
		ID:         "id-test",
		BoardID:    boardID,
		Title:      "oldTitle",
		ModifiedBy: userID,
		Fields:     map[string]interface{}{"test": "test value", "test2": "test value 2"},
	}

	err := store.InsertBlock(&block, "user-id-1")
	require.NoError(t, err)

	blocks, errBlocks := store.GetBlocksForBoard(boardID)
	require.NoError(t, errBlocks)
	initialCount := len(blocks)

	t.Run("not existing block id", func(t *testing.T) {
		err := store.PatchBlock("invalid-block-id", &model.BlockPatch{}, "user-id-1")
		require.Error(t, err)

		blocks, err := store.GetBlocksForBoard(boardID)
		require.NoError(t, err)
		require.Len(t, blocks, initialCount)
	})

	t.Run("invalid rootid", func(t *testing.T) {
		wrongBoardID := ""
		blockPatch := model.BlockPatch{
			BoardID: &wrongBoardID,
		}

		err := store.PatchBlock("id-test", &blockPatch, "user-id-1")
		require.Error(t, err)

		blocks, err := store.GetBlocksForBoard(boardID)
		require.NoError(t, err)
		require.Len(t, blocks, initialCount)
	})

	t.Run("invalid fields data", func(t *testing.T) {
		blockPatch := model.BlockPatch{
			UpdatedFields: map[string]interface{}{"no-serialiable-value": t.Run},
		}

		err := store.PatchBlock("id-test", &blockPatch, "user-id-1")
		require.Error(t, err)

		blocks, err := store.GetBlocksForBoard(boardID)
		require.NoError(t, err)
		require.Len(t, blocks, initialCount)
	})

	t.Run("update block fields", func(t *testing.T) {
		newTitle := "New title"
		blockPatch := model.BlockPatch{
			Title: &newTitle,
		}

		// Wait for not colliding the ID+insert_at key
		time.Sleep(1 * time.Millisecond)

		// inserting
		err := store.PatchBlock("id-test", &blockPatch, "user-id-2")
		require.NoError(t, err)

		retrievedBlock, err := store.GetBlock("id-test")
		require.NoError(t, err)

		// created by populated from user id for new blocks
		require.Equal(t, "user-id-2", retrievedBlock.ModifiedBy)
		require.Equal(t, "New title", retrievedBlock.Title)
	})

	t.Run("update block custom fields", func(t *testing.T) {
		blockPatch := model.BlockPatch{
			UpdatedFields: map[string]interface{}{"test": "new test value", "test3": "new value"},
		}

		// Wait for not colliding the ID+insert_at key
		time.Sleep(1 * time.Millisecond)

		// inserting
		err := store.PatchBlock("id-test", &blockPatch, "user-id-2")
		require.NoError(t, err)

		retrievedBlock, err := store.GetBlock("id-test")
		require.NoError(t, err)

		// created by populated from user id for new blocks
		require.Equal(t, "user-id-2", retrievedBlock.ModifiedBy)
		require.Equal(t, "new test value", retrievedBlock.Fields["test"])
		require.Equal(t, "test value 2", retrievedBlock.Fields["test2"])
		require.Equal(t, "new value", retrievedBlock.Fields["test3"])
	})

	t.Run("remove block custom fields", func(t *testing.T) {
		blockPatch := model.BlockPatch{
			DeletedFields: []string{"test", "test3", "test100"},
		}

		// Wait for not colliding the ID+insert_at key
		time.Sleep(1 * time.Millisecond)

		// inserting
		err := store.PatchBlock("id-test", &blockPatch, "user-id-2")
		require.NoError(t, err)

		retrievedBlock, err := store.GetBlock("id-test")
		require.NoError(t, err)

		// created by populated from user id for new blocks
		require.Equal(t, "user-id-2", retrievedBlock.ModifiedBy)
		require.Equal(t, nil, retrievedBlock.Fields["test"])
		require.Equal(t, "test value 2", retrievedBlock.Fields["test2"])
		require.Equal(t, nil, retrievedBlock.Fields["test3"])
	})
}

func testPatchBlocks(t *testing.T, store store.Store) {
	block := model.Block{
		ID:      "id-test",
		BoardID: "id-test",
		Title:   "oldTitle",
	}

	block2 := model.Block{
		ID:      "id-test2",
		BoardID: "id-test2",
		Title:   "oldTitle2",
	}

	insertBlocks := []model.Block{block, block2}
	err := store.InsertBlocks(insertBlocks, "user-id-1")
	require.NoError(t, err)

	t.Run("successful updated existing blocks", func(t *testing.T) {
		title := "updatedTitle"
		blockPatch := model.BlockPatch{
			Title: &title,
		}

		blockPatch2 := model.BlockPatch{
			Title: &title,
		}

		blockIds := []string{"id-test", "id-test2"}
		blockPatches := []model.BlockPatch{blockPatch, blockPatch2}

		time.Sleep(1 * time.Millisecond)
		err := store.PatchBlocks(&model.BlockPatchBatch{BlockIDs: blockIds, BlockPatches: blockPatches}, "user-id-1")
		require.NoError(t, err)

		retrievedBlock, err := store.GetBlock("id-test")
		require.NoError(t, err)
		require.Equal(t, title, retrievedBlock.Title)

		retrievedBlock2, err := store.GetBlock("id-test2")
		require.NoError(t, err)
		require.Equal(t, title, retrievedBlock2.Title)
	})

	t.Run("invalid block id, nothing updated existing blocks", func(t *testing.T) {
		if store.DBType() == model.SqliteDBType {
			t.Skip("No transactions support int sqlite")
		}

		title := "Another Title"
		blockPatch := model.BlockPatch{
			Title: &title,
		}

		blockPatch2 := model.BlockPatch{
			Title: &title,
		}

		blockIds := []string{"id-test", "invalid id"}
		blockPatches := []model.BlockPatch{blockPatch, blockPatch2}

		time.Sleep(1 * time.Millisecond)
		err := store.PatchBlocks(&model.BlockPatchBatch{BlockIDs: blockIds, BlockPatches: blockPatches}, "user-id-1")
		require.Error(t, err)

		retrievedBlock, err := store.GetBlock("id-test")
		require.NoError(t, err)
		require.NotEqual(t, title, retrievedBlock.Title)
	})
}

var (
	subtreeSampleBlocks = []model.Block{
		{
			ID:         "parent",
			BoardID:    testBoardID,
			ModifiedBy: testUserID,
		},
		{
			ID:         "child1",
			BoardID:    testBoardID,
			ParentID:   "parent",
			ModifiedBy: testUserID,
		},
		{
			ID:         "child2",
			BoardID:    testBoardID,
			ParentID:   "parent",
			ModifiedBy: testUserID,
		},
		{
			ID:         "grandchild1",
			BoardID:    testBoardID,
			ParentID:   "child1",
			ModifiedBy: testUserID,
		},
		{
			ID:         "grandchild2",
			BoardID:    testBoardID,
			ParentID:   "child2",
			ModifiedBy: testUserID,
		},
		{
			ID:         "greatgrandchild1",
			BoardID:    testBoardID,
			ParentID:   "grandchild1",
			ModifiedBy: testUserID,
		},
	}
)

func testGetSubTree2(t *testing.T, store store.Store) {
	boardID := testBoardID
	blocks, err := store.GetBlocksForBoard(boardID)
	require.NoError(t, err)
	initialCount := len(blocks)

	InsertBlocks(t, store, subtreeSampleBlocks, "user-id-1")
	time.Sleep(1 * time.Millisecond)
	defer DeleteBlocks(t, store, subtreeSampleBlocks, "test")

	blocks, err = store.GetBlocksForBoard(boardID)
	require.NoError(t, err)
	require.Len(t, blocks, initialCount+6)

	t.Run("from root id", func(t *testing.T) {
		blocks, err = store.GetSubTree2(boardID, "parent", model.QuerySubtreeOptions{})
		require.NoError(t, err)
		require.Len(t, blocks, 3)
		require.True(t, ContainsBlockWithID(blocks, "parent"))
		require.True(t, ContainsBlockWithID(blocks, "child1"))
		require.True(t, ContainsBlockWithID(blocks, "child2"))
	})

	t.Run("from child id", func(t *testing.T) {
		blocks, err = store.GetSubTree2(boardID, "child1", model.QuerySubtreeOptions{})
		require.NoError(t, err)
		require.Len(t, blocks, 2)
		require.True(t, ContainsBlockWithID(blocks, "child1"))
		require.True(t, ContainsBlockWithID(blocks, "grandchild1"))
	})

	t.Run("from not existing id", func(t *testing.T) {
		blocks, err = store.GetSubTree2(boardID, "not-exists", model.QuerySubtreeOptions{})
		require.NoError(t, err)
		require.Len(t, blocks, 0)
	})
}

func testDeleteBlock(t *testing.T, store store.Store) {
	userID := testUserID
	boardID := testBoardID

	blocks, err := store.GetBlocksForBoard(boardID)
	require.NoError(t, err)
	initialCount := len(blocks)

	blocksToInsert := []model.Block{
		{
			ID:         "block1",
			BoardID:    boardID,
			ModifiedBy: userID,
		},
		{
			ID:         "block2",
			BoardID:    boardID,
			ModifiedBy: userID,
		},
		{
			ID:         "block3",
			BoardID:    boardID,
			ModifiedBy: userID,
		},
	}
	InsertBlocks(t, store, blocksToInsert, "user-id-1")
	defer DeleteBlocks(t, store, blocksToInsert, "test")

	blocks, err = store.GetBlocksForBoard(boardID)
	require.NoError(t, err)
	require.Len(t, blocks, initialCount+3)

	t.Run("existing id", func(t *testing.T) {
		// Wait for not colliding the ID+insert_at key
		time.Sleep(1 * time.Millisecond)
		err := store.DeleteBlock("block1", userID)
		require.NoError(t, err)
	})

	t.Run("existing id multiple times", func(t *testing.T) {
		// Wait for not colliding the ID+insert_at key
		time.Sleep(1 * time.Millisecond)
		err := store.DeleteBlock("block1", userID)
		require.NoError(t, err)
		// Wait for not colliding the ID+insert_at key
		time.Sleep(1 * time.Millisecond)
		err = store.DeleteBlock("block1", userID)
		require.NoError(t, err)
	})

	t.Run("from not existing id", func(t *testing.T) {
		// Wait for not colliding the ID+insert_at key
		time.Sleep(1 * time.Millisecond)
		err := store.DeleteBlock("not-exists", userID)
		require.NoError(t, err)
	})
}

func testUndeleteBlock(t *testing.T, store store.Store) {
	boardID := testBoardID
	userID := testUserID

	blocks, err := store.GetBlocksForBoard(boardID)
	require.NoError(t, err)
	initialCount := len(blocks)

	blocksToInsert := []model.Block{
		{
			ID:         "block1",
			BoardID:    boardID,
			ModifiedBy: userID,
		},
		{
			ID:         "block2",
			BoardID:    boardID,
			ModifiedBy: userID,
		},
		{
			ID:         "block3",
			BoardID:    boardID,
			ModifiedBy: userID,
		},
	}
	InsertBlocks(t, store, blocksToInsert, "user-id-1")
	defer DeleteBlocks(t, store, blocksToInsert, "test")

	blocks, err = store.GetBlocksForBoard(boardID)
	require.NoError(t, err)
	require.Len(t, blocks, initialCount+3)

	t.Run("existing id", func(t *testing.T) {
		// Wait for not colliding the ID+insert_at key
		time.Sleep(1 * time.Millisecond)
		err := store.DeleteBlock("block1", userID)
		require.NoError(t, err)

		block, err := store.GetBlock("block1")
		require.NoError(t, err)
		require.Nil(t, block)

		time.Sleep(1 * time.Millisecond)
		err = store.UndeleteBlock("block1", userID)
		require.NoError(t, err)

		block, err = store.GetBlock("block1")
		require.NoError(t, err)
		require.NotNil(t, block)
	})

	t.Run("existing id multiple times", func(t *testing.T) {
		// Wait for not colliding the ID+insert_at key
		time.Sleep(1 * time.Millisecond)
		err := store.DeleteBlock("block1", userID)
		require.NoError(t, err)

		block, err := store.GetBlock("block1")
		require.NoError(t, err)
		require.Nil(t, block)

		// Wait for not colliding the ID+insert_at key
		time.Sleep(1 * time.Millisecond)
		err = store.UndeleteBlock("block1", userID)
		require.NoError(t, err)

		block, err = store.GetBlock("block1")
		require.NoError(t, err)
		require.NotNil(t, block)

		// Wait for not colliding the ID+insert_at key
		time.Sleep(1 * time.Millisecond)
		err = store.UndeleteBlock("block1", userID)
		require.NoError(t, err)

		block, err = store.GetBlock("block1")
		require.NoError(t, err)
		require.NotNil(t, block)
	})

	t.Run("from not existing id", func(t *testing.T) {
		// Wait for not colliding the ID+insert_at key
		time.Sleep(1 * time.Millisecond)
		err := store.UndeleteBlock("not-exists", userID)
		require.NoError(t, err)

		block, err := store.GetBlock("not-exists")
		require.NoError(t, err)
		require.Nil(t, block)
	})
}

func testGetBlocks(t *testing.T, store store.Store) {
	boardID := testBoardID
	blocks, err := store.GetBlocksForBoard(boardID)
	require.NoError(t, err)

	blocksToInsert := []model.Block{
		{
			ID:         "block1",
			BoardID:    boardID,
			ParentID:   "",
			ModifiedBy: testUserID,
			Type:       "test",
		},
		{
			ID:         "block2",
			BoardID:    boardID,
			ParentID:   "block1",
			ModifiedBy: testUserID,
			Type:       "test",
		},
		{
			ID:         "block3",
			BoardID:    boardID,
			ParentID:   "block1",
			ModifiedBy: testUserID,
			Type:       "test",
		},
		{
			ID:         "block4",
			BoardID:    boardID,
			ParentID:   "block1",
			ModifiedBy: testUserID,
			Type:       "test2",
		},
		{
			ID:         "block5",
			BoardID:    boardID,
			ParentID:   "block2",
			ModifiedBy: testUserID,
			Type:       "test",
		},
	}
	InsertBlocks(t, store, blocksToInsert, "user-id-1")
	defer DeleteBlocks(t, store, blocksToInsert, "test")

	t.Run("not existing parent", func(t *testing.T) {
		time.Sleep(1 * time.Millisecond)
		blocks, err = store.GetBlocksWithParentAndType(boardID, "not-exists", "test")
		require.NoError(t, err)
		require.Len(t, blocks, 0)
	})

	t.Run("not existing type", func(t *testing.T) {
		time.Sleep(1 * time.Millisecond)
		blocks, err = store.GetBlocksWithParentAndType(boardID, "block1", "not-existing")
		require.NoError(t, err)
		require.Len(t, blocks, 0)
	})

	t.Run("valid parent and type", func(t *testing.T) {
		time.Sleep(1 * time.Millisecond)
		blocks, err = store.GetBlocksWithParentAndType(boardID, "block1", "test")
		require.NoError(t, err)
		require.Len(t, blocks, 2)
	})

	t.Run("not existing parent", func(t *testing.T) {
		time.Sleep(1 * time.Millisecond)
		blocks, err = store.GetBlocksWithParent(boardID, "not-exists")
		require.NoError(t, err)
		require.Len(t, blocks, 0)
	})

	t.Run("valid parent", func(t *testing.T) {
		time.Sleep(1 * time.Millisecond)
		blocks, err = store.GetBlocksWithParent(boardID, "block1")
		require.NoError(t, err)
		require.Len(t, blocks, 3)
	})

	t.Run("not existing type", func(t *testing.T) {
		time.Sleep(1 * time.Millisecond)
		blocks, err = store.GetBlocksWithType(boardID, "not-exists")
		require.NoError(t, err)
		require.Len(t, blocks, 0)
	})

	t.Run("valid type", func(t *testing.T) {
		time.Sleep(1 * time.Millisecond)
		blocks, err = store.GetBlocksWithType(boardID, "test")
		require.NoError(t, err)
		require.Len(t, blocks, 4)
	})

	t.Run("not existing board", func(t *testing.T) {
		time.Sleep(1 * time.Millisecond)
		blocks, err = store.GetBlocksWithBoardID("not-exists")
		require.NoError(t, err)
		require.Len(t, blocks, 0)
	})

	t.Run("all blocks of the a board", func(t *testing.T) {
		time.Sleep(1 * time.Millisecond)
		blocks, err = store.GetBlocksWithBoardID(boardID)
		require.NoError(t, err)
		require.Len(t, blocks, 5)
	})
}

func testGetBlock(t *testing.T, store store.Store) {
	t.Run("get a block", func(t *testing.T) {
		block := model.Block{
			ID:         "block-id-10",
			BoardID:    "board-id-1",
			ModifiedBy: "user-id-1",
		}

		err := store.InsertBlock(&block, "user-id-1")
		require.NoError(t, err)

		fetchedBlock, err := store.GetBlock("block-id-10")
		require.NoError(t, err)
		require.NotNil(t, fetchedBlock)
		require.Equal(t, "block-id-10", fetchedBlock.ID)
		require.Equal(t, "board-id-1", fetchedBlock.BoardID)
		require.Equal(t, "user-id-1", fetchedBlock.CreatedBy)
		require.Equal(t, "user-id-1", fetchedBlock.ModifiedBy)
		assert.WithinDurationf(t, time.Now(), utils.GetTimeForMillis(fetchedBlock.CreateAt), 1*time.Second, "create time should be current time")
		assert.WithinDurationf(t, time.Now(), utils.GetTimeForMillis(fetchedBlock.UpdateAt), 1*time.Second, "update time should be current time")
	})

	t.Run("get a non-existing block", func(t *testing.T) {
		fetchedBlock, err := store.GetBlock("non-existing-id")
		require.NoError(t, err)
		require.Nil(t, fetchedBlock)
	})
}

func testDuplicateBlock(t *testing.T, store store.Store) {
	InsertBlocks(t, store, subtreeSampleBlocks, "user-id-1")
	time.Sleep(1 * time.Millisecond)
	defer DeleteBlocks(t, store, subtreeSampleBlocks, "test")

	t.Run("duplicate existing block as no template", func(t *testing.T) {
		blocks, err := store.DuplicateBlock(testBoardID, "child1", testUserID, false)
		require.NoError(t, err)
		require.Len(t, blocks, 2)
		require.Equal(t, false, blocks[0].Fields["isTemplate"])
	})

	t.Run("duplicate existing block as template", func(t *testing.T) {
		blocks, err := store.DuplicateBlock(testBoardID, "child1", testUserID, true)
		require.NoError(t, err)
		require.Len(t, blocks, 2)
		require.Equal(t, true, blocks[0].Fields["isTemplate"])
	})

	t.Run("duplicate not existing block", func(t *testing.T) {
		blocks, err := store.DuplicateBlock(testBoardID, "not-existing-id", testUserID, false)
		require.Error(t, err)
		require.Nil(t, blocks)
	})

	t.Run("duplicate not existing board", func(t *testing.T) {
		blocks, err := store.DuplicateBlock("not-existing-board", "not-existing-id", testUserID, false)
		require.Error(t, err)
		require.Nil(t, blocks)
	})

	t.Run("not matching board/block", func(t *testing.T) {
		blocks, err := store.DuplicateBlock("other-id", "child1", testUserID, false)
		require.Error(t, err)
		require.Nil(t, blocks)
	})
}

func testGetBlockMetadata(t *testing.T, store store.Store) {
	boardID := testBoardID
	blocks, err := store.GetBlocksForBoard(boardID)
	require.NoError(t, err)

	blocksToInsert := []model.Block{
		{
			ID:         "block1",
			BoardID:    boardID,
			ParentID:   "",
			ModifiedBy: testUserID,
			Type:       "test",
		},
		{
			ID:         "block2",
			BoardID:    boardID,
			ParentID:   "block1",
			ModifiedBy: testUserID,
			Type:       "test",
		},
		{
			ID:         "block3",
			BoardID:    boardID,
			ParentID:   "block1",
			ModifiedBy: testUserID,
			Type:       "test",
		},
		{
			ID:         "block4",
			BoardID:    boardID,
			ParentID:   "block1",
			ModifiedBy: testUserID,
			Type:       "test2",
		},
		{
			ID:         "block5",
			BoardID:    boardID,
			ParentID:   "block2",
			ModifiedBy: testUserID,
			Type:       "test",
		},
	}

	for _, v := range blocksToInsert {
		time.Sleep(20 * time.Millisecond)
		subBlocks := []model.Block{v}
		InsertBlocks(t, store, subBlocks, testUserID)
	}
	defer DeleteBlocks(t, store, blocksToInsert, "test")

	t.Run("get full block history", func(t *testing.T) {
		opts := model.QueryBlockHistoryOptions{
			Descending: false,
		}
		blocks, err = store.GetBlockHistoryDescendants(boardID, opts)
		require.NoError(t, err)
		require.Len(t, blocks, 5)
		expectedBlock := blocksToInsert[0]
		block := blocks[0]

		require.Equal(t, expectedBlock.ID, block.ID)
	})

	t.Run("get full block history descending", func(t *testing.T) {
		opts := model.QueryBlockHistoryOptions{
			Descending: true,
		}
		blocks, err = store.GetBlockHistoryDescendants(boardID, opts)
		require.NoError(t, err)
		require.Len(t, blocks, 5)
		expectedBlock := blocksToInsert[len(blocksToInsert)-1]
		block := blocks[0]

		require.Equal(t, expectedBlock.ID, block.ID)
	})

	t.Run("get limited block history", func(t *testing.T) {
		opts := model.QueryBlockHistoryOptions{
			Limit:      3,
			Descending: false,
		}
		blocks, err = store.GetBlockHistoryDescendants(boardID, opts)
		require.NoError(t, err)
		require.Len(t, blocks, 3)
	})

	t.Run("get first block history", func(t *testing.T) {
		opts := model.QueryBlockHistoryOptions{
			Limit:      1,
			Descending: false,
		}
		blocks, err = store.GetBlockHistoryDescendants(boardID, opts)
		require.NoError(t, err)
		require.Len(t, blocks, 1)
		expectedBlock := blocksToInsert[0]
		block := blocks[0]

		require.Equal(t, expectedBlock.ID, block.ID)
	})

	t.Run("get last block history", func(t *testing.T) {
		opts := model.QueryBlockHistoryOptions{
			Limit:      1,
			Descending: true,
		}
		blocks, err = store.GetBlockHistoryDescendants(boardID, opts)
		require.NoError(t, err)
		require.Len(t, blocks, 1)
		expectedBlock := blocksToInsert[len(blocksToInsert)-1]
		block := blocks[0]

		require.Equal(t, expectedBlock.ID, block.ID)
	})

	t.Run("get block history after updateAt", func(t *testing.T) {
		rBlocks, err2 := store.GetBlocksWithType(boardID, "test")
		require.NoError(t, err2)
		require.NotZero(t, rBlocks[2].UpdateAt)

		opts := model.QueryBlockHistoryOptions{
			AfterUpdateAt: rBlocks[2].UpdateAt,
			Descending:    false,
		}
		blocks, err = store.GetBlockHistoryDescendants(boardID, opts)
		require.NoError(t, err)
		require.Len(t, blocks, 2)
		expectedBlock := blocksToInsert[3]
		block := blocks[0]

		require.Equal(t, expectedBlock.ID, block.ID)
	})

	t.Run("get block history before updateAt", func(t *testing.T) {
		rBlocks, err2 := store.GetBlocksWithType(boardID, "test")
		require.NoError(t, err2)
		require.NotZero(t, rBlocks[2].UpdateAt)

		opts := model.QueryBlockHistoryOptions{
			BeforeUpdateAt: rBlocks[2].UpdateAt,
			Descending:     true,
		}
		blocks, err = store.GetBlockHistoryDescendants(boardID, opts)
		require.NoError(t, err)
		require.Len(t, blocks, 2)
		expectedBlock := blocksToInsert[1]
		block := blocks[0]

		require.Equal(t, expectedBlock.ID, block.ID)
	})

	t.Run("get full block history after delete", func(t *testing.T) {
		time.Sleep(20 * time.Millisecond)
		err = store.DeleteBlock(blocksToInsert[0].ID, testUserID)
		require.NoError(t, err)

		opts := model.QueryBlockHistoryOptions{
			Descending: true,
		}
		blocks, err = store.GetBlockHistoryDescendants(boardID, opts)
		require.NoError(t, err)
		require.Len(t, blocks, 6)
		expectedBlock := blocksToInsert[0]
		block := blocks[0]

		require.Equal(t, expectedBlock.ID, block.ID)
	})

	t.Run("get full block history after undelete", func(t *testing.T) {
		time.Sleep(20 * time.Millisecond)
		err = store.UndeleteBlock(blocksToInsert[0].ID, testUserID)
		require.NoError(t, err)

		opts := model.QueryBlockHistoryOptions{
			Descending: true,
		}
		blocks, err = store.GetBlockHistoryDescendants(boardID, opts)
		require.NoError(t, err)
		require.Len(t, blocks, 7)
		expectedBlock := blocksToInsert[0]
		block := blocks[0]

		require.Equal(t, expectedBlock.ID, block.ID)
	})
}
