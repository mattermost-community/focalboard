package storetests

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"

	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/services/store"
	"github.com/stretchr/testify/require"
)

const (
	testUserID = "user-id"
)

func StoreTestBlocksStore(t *testing.T, setup func(t *testing.T) (store.Store, func())) {
	container := store.Container{
		WorkspaceID: "0",
	}

	t.Run("InsertBlock", func(t *testing.T) {
		store, tearDown := setup(t)
		defer tearDown()
		testInsertBlock(t, store, container)
	})
	t.Run("DeleteBlock", func(t *testing.T) {
		store, tearDown := setup(t)
		defer tearDown()
		testDeleteBlock(t, store, container)
	})
	t.Run("GetSubTree2", func(t *testing.T) {
		store, tearDown := setup(t)
		defer tearDown()
		testGetSubTree2(t, store, container)
	})
	t.Run("GetSubTree3", func(t *testing.T) {
		store, tearDown := setup(t)
		defer tearDown()
		testGetSubTree3(t, store, container)
	})
	t.Run("GetParentID", func(t *testing.T) {
		store, tearDown := setup(t)
		defer tearDown()
		testGetParents(t, store, container)
	})
	t.Run("GetBlocks", func(t *testing.T) {
		store, tearDown := setup(t)
		defer tearDown()
		testGetBlocks(t, store, container)
	})
	t.Run("GetBlock", func(t *testing.T) {
		store, tearDown := setup(t)
		defer tearDown()
		testGetBlock(t, store, container)
	})
}

func testInsertBlock(t *testing.T, store store.Store, container store.Container) {
	userID := testUserID

	blocks, errBlocks := store.GetAllBlocks(container)
	require.NoError(t, errBlocks)
	initialCount := len(blocks)

	t.Run("valid block", func(t *testing.T) {
		block := model.Block{
			ID:         "id-test",
			RootID:     "id-test",
			ModifiedBy: userID,
		}

		err := store.InsertBlock(container, &block, "user-id-1")
		require.NoError(t, err)

		blocks, err := store.GetAllBlocks(container)
		require.NoError(t, err)
		require.Len(t, blocks, initialCount+1)
	})

	t.Run("invalid rootid", func(t *testing.T) {
		block := model.Block{
			ID:         "id-test",
			RootID:     "",
			ModifiedBy: userID,
		}

		err := store.InsertBlock(container, &block, "user-id-1")
		require.Error(t, err)

		blocks, err := store.GetAllBlocks(container)
		require.NoError(t, err)
		require.Len(t, blocks, initialCount+1)
	})

	t.Run("invalid fields data", func(t *testing.T) {
		block := model.Block{
			ID:         "id-test",
			RootID:     "id-test",
			ModifiedBy: userID,
			Fields:     map[string]interface{}{"no-serialiable-value": t.Run},
		}

		err := store.InsertBlock(container, &block, "user-id-1")
		require.Error(t, err)

		blocks, err := store.GetAllBlocks(container)
		require.NoError(t, err)
		require.Len(t, blocks, initialCount+1)
	})

	t.Run("insert new block", func(t *testing.T) {
		block := model.Block{
			RootID: "root-id",
		}

		err := store.InsertBlock(container, &block, "user-id-2")
		require.NoError(t, err)
		require.Equal(t, "user-id-2", block.CreatedBy)
	})

	t.Run("update existing block", func(t *testing.T) {
		block := model.Block{
			ID:     "id-2",
			RootID: "root-id",
			Title:  "Old Title",
		}

		// inserting
		err := store.InsertBlock(container, &block, "user-id-2")
		require.NoError(t, err)

		// created by populated from user id for new blocks
		require.Equal(t, "user-id-2", block.CreatedBy)

		// hack to avoid multiple, quick updates to a card
		// violating block_history composite primary key constraint
		time.Sleep(1 * time.Second)

		// updating
		newBlock := model.Block{
			ID:        "id-2",
			RootID:    "root-id",
			CreatedBy: "user-id-3",
			Title:     "New Title",
		}
		err = store.InsertBlock(container, &newBlock, "user-id-4")
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
			RootID:     "root-id",
			Title:      "Old Title",
			CreateAt:   createdAt.Unix(),
			UpdateAt:   updateAt.Unix(),
			CreatedBy:  "user-id-5",
			ModifiedBy: "user-id-6",
		}

		// inserting
		err := store.InsertBlock(container, &block, "user-id-1")
		require.NoError(t, err)

		retrievedBlock, err := store.GetBlock(container, "id-10")
		assert.NoError(t, err)
		assert.NotNil(t, retrievedBlock)
		assert.Equal(t, "user-id-1", retrievedBlock.CreatedBy)
		assert.Equal(t, "user-id-1", retrievedBlock.ModifiedBy)
		assert.WithinDurationf(t, time.Now(), time.Unix(retrievedBlock.CreateAt/1000, 0), 1*time.Second, "create time should be current time")
		assert.WithinDurationf(t, time.Now(), time.Unix(retrievedBlock.UpdateAt/1000, 0), 1*time.Second, "update time should be current time")
	})
}

var (
	subtreeSampleBlocks = []model.Block{
		{
			ID:         "parent",
			RootID:     "parent",
			ModifiedBy: testUserID,
		},
		{
			ID:         "child1",
			RootID:     "parent",
			ParentID:   "parent",
			ModifiedBy: testUserID,
		},
		{
			ID:         "child2",
			RootID:     "parent",
			ParentID:   "parent",
			ModifiedBy: testUserID,
		},
		{
			ID:         "grandchild1",
			RootID:     "parent",
			ParentID:   "child1",
			ModifiedBy: testUserID,
		},
		{
			ID:         "grandchild2",
			RootID:     "parent",
			ParentID:   "child2",
			ModifiedBy: testUserID,
		},
		{
			ID:         "greatgrandchild1",
			RootID:     "parent",
			ParentID:   "grandchild1",
			ModifiedBy: testUserID,
		},
	}
)

func testGetSubTree2(t *testing.T, store store.Store, container store.Container) {
	blocks, err := store.GetAllBlocks(container)
	require.NoError(t, err)
	initialCount := len(blocks)

	InsertBlocks(t, store, container, subtreeSampleBlocks, "user-id-1")
	defer DeleteBlocks(t, store, container, subtreeSampleBlocks, "test")

	blocks, err = store.GetAllBlocks(container)
	require.NoError(t, err)
	require.Len(t, blocks, initialCount+6)

	t.Run("from root id", func(t *testing.T) {
		blocks, err = store.GetSubTree2(container, "parent")
		require.NoError(t, err)
		require.Len(t, blocks, 3)
		require.True(t, ContainsBlockWithID(blocks, "parent"))
		require.True(t, ContainsBlockWithID(blocks, "child1"))
		require.True(t, ContainsBlockWithID(blocks, "child2"))
	})

	t.Run("from child id", func(t *testing.T) {
		blocks, err = store.GetSubTree2(container, "child1")
		require.NoError(t, err)
		require.Len(t, blocks, 2)
		require.True(t, ContainsBlockWithID(blocks, "child1"))
		require.True(t, ContainsBlockWithID(blocks, "grandchild1"))
	})

	t.Run("from not existing id", func(t *testing.T) {
		blocks, err = store.GetSubTree2(container, "not-exists")
		require.NoError(t, err)
		require.Len(t, blocks, 0)
	})
}

func testGetSubTree3(t *testing.T, store store.Store, container store.Container) {
	blocks, err := store.GetAllBlocks(container)
	require.NoError(t, err)
	initialCount := len(blocks)

	InsertBlocks(t, store, container, subtreeSampleBlocks, "user-id-1")
	defer DeleteBlocks(t, store, container, subtreeSampleBlocks, "test")

	blocks, err = store.GetAllBlocks(container)
	require.NoError(t, err)
	require.Len(t, blocks, initialCount+6)

	t.Run("from root id", func(t *testing.T) {
		blocks, err = store.GetSubTree3(container, "parent")
		require.NoError(t, err)
		require.Len(t, blocks, 5)
		require.True(t, ContainsBlockWithID(blocks, "parent"))
		require.True(t, ContainsBlockWithID(blocks, "child1"))
		require.True(t, ContainsBlockWithID(blocks, "child2"))
		require.True(t, ContainsBlockWithID(blocks, "grandchild1"))
		require.True(t, ContainsBlockWithID(blocks, "grandchild2"))
	})

	t.Run("from child id", func(t *testing.T) {
		blocks, err = store.GetSubTree3(container, "child1")
		require.NoError(t, err)
		require.Len(t, blocks, 3)
		require.True(t, ContainsBlockWithID(blocks, "child1"))
		require.True(t, ContainsBlockWithID(blocks, "grandchild1"))
		require.True(t, ContainsBlockWithID(blocks, "greatgrandchild1"))
	})

	t.Run("from not existing id", func(t *testing.T) {
		blocks, err = store.GetSubTree3(container, "not-exists")
		require.NoError(t, err)
		require.Len(t, blocks, 0)
	})
}

func testGetParents(t *testing.T, store store.Store, container store.Container) {
	blocks, err := store.GetAllBlocks(container)
	require.NoError(t, err)
	initialCount := len(blocks)

	InsertBlocks(t, store, container, subtreeSampleBlocks, "user-id-1")
	defer DeleteBlocks(t, store, container, subtreeSampleBlocks, "test")

	blocks, err = store.GetAllBlocks(container)
	require.NoError(t, err)
	require.Len(t, blocks, initialCount+6)

	t.Run("root from root id", func(t *testing.T) {
		rootID, err := store.GetRootID(container, "parent")
		require.NoError(t, err)
		require.Equal(t, "parent", rootID)
	})

	t.Run("root from child id", func(t *testing.T) {
		rootID, err := store.GetRootID(container, "child1")
		require.NoError(t, err)
		require.Equal(t, "parent", rootID)
	})

	t.Run("root from not existing id", func(t *testing.T) {
		_, err := store.GetRootID(container, "not-exists")
		require.Error(t, err)
	})

	t.Run("parent from root id", func(t *testing.T) {
		parentID, err := store.GetParentID(container, "parent")
		require.NoError(t, err)
		require.Equal(t, "", parentID)
	})

	t.Run("parent from child id", func(t *testing.T) {
		parentID, err := store.GetParentID(container, "grandchild1")
		require.NoError(t, err)
		require.Equal(t, "child1", parentID)
	})

	t.Run("parent from not existing id", func(t *testing.T) {
		_, err := store.GetParentID(container, "not-exists")
		require.Error(t, err)
	})
}

func testDeleteBlock(t *testing.T, store store.Store, container store.Container) {
	userID := testUserID

	blocks, err := store.GetAllBlocks(container)
	require.NoError(t, err)
	initialCount := len(blocks)

	blocksToInsert := []model.Block{
		{
			ID:         "block1",
			RootID:     "block1",
			ModifiedBy: userID,
		},
		{
			ID:         "block2",
			RootID:     "block2",
			ModifiedBy: userID,
		},
		{
			ID:         "block3",
			RootID:     "block3",
			ModifiedBy: userID,
		},
	}
	InsertBlocks(t, store, container, blocksToInsert, "user-id-1")
	defer DeleteBlocks(t, store, container, blocksToInsert, "test")

	blocks, err = store.GetAllBlocks(container)
	require.NoError(t, err)
	require.Len(t, blocks, initialCount+3)

	t.Run("exiting id", func(t *testing.T) {
		// Wait for not colliding the ID+insert_at key
		time.Sleep(1 * time.Millisecond)
		err := store.DeleteBlock(container, "block1", userID)
		require.NoError(t, err)
	})

	t.Run("exiting id multiple times", func(t *testing.T) {
		// Wait for not colliding the ID+insert_at key
		time.Sleep(1 * time.Millisecond)
		err := store.DeleteBlock(container, "block1", userID)
		require.NoError(t, err)
		// Wait for not colliding the ID+insert_at key
		time.Sleep(1 * time.Millisecond)
		err = store.DeleteBlock(container, "block1", userID)
		require.NoError(t, err)
	})

	t.Run("from not existing id", func(t *testing.T) {
		// Wait for not colliding the ID+insert_at key
		time.Sleep(1 * time.Millisecond)
		err := store.DeleteBlock(container, "not-exists", userID)
		require.NoError(t, err)
	})
}

func testGetBlocks(t *testing.T, store store.Store, container store.Container) {
	blocks, err := store.GetAllBlocks(container)
	require.NoError(t, err)

	blocksToInsert := []model.Block{
		{
			ID:         "block1",
			ParentID:   "",
			RootID:     "block1",
			ModifiedBy: testUserID,
			Type:       "test",
		},
		{
			ID:         "block2",
			ParentID:   "block1",
			RootID:     "block1",
			ModifiedBy: testUserID,
			Type:       "test",
		},
		{
			ID:         "block3",
			ParentID:   "block1",
			RootID:     "block1",
			ModifiedBy: testUserID,
			Type:       "test",
		},
		{
			ID:         "block4",
			ParentID:   "block1",
			RootID:     "block1",
			ModifiedBy: testUserID,
			Type:       "test2",
		},
		{
			ID:         "block5",
			ParentID:   "block2",
			RootID:     "block2",
			ModifiedBy: testUserID,
			Type:       "test",
		},
	}

	InsertBlocks(t, store, container, blocksToInsert, "user-id-1")
	defer DeleteBlocks(t, store, container, blocksToInsert, "test")

	t.Run("not existing parent", func(t *testing.T) {
		time.Sleep(1 * time.Millisecond)
		blocks, err = store.GetBlocksWithParentAndType(container, "not-exists", "test")
		require.NoError(t, err)
		require.Len(t, blocks, 0)
	})

	t.Run("not existing type", func(t *testing.T) {
		time.Sleep(1 * time.Millisecond)
		blocks, err = store.GetBlocksWithParentAndType(container, "block1", "not-existing")
		require.NoError(t, err)
		require.Len(t, blocks, 0)
	})

	t.Run("valid parent and type", func(t *testing.T) {
		time.Sleep(1 * time.Millisecond)
		blocks, err = store.GetBlocksWithParentAndType(container, "block1", "test")
		require.NoError(t, err)
		require.Len(t, blocks, 2)
	})

	t.Run("not existing parent", func(t *testing.T) {
		time.Sleep(1 * time.Millisecond)
		blocks, err = store.GetBlocksWithParent(container, "not-exists")
		require.NoError(t, err)
		require.Len(t, blocks, 0)
	})

	t.Run("valid parent", func(t *testing.T) {
		time.Sleep(1 * time.Millisecond)
		blocks, err = store.GetBlocksWithParent(container, "block1")
		require.NoError(t, err)
		require.Len(t, blocks, 3)
	})

	t.Run("not existing type", func(t *testing.T) {
		time.Sleep(1 * time.Millisecond)
		blocks, err = store.GetBlocksWithType(container, "not-exists")
		require.NoError(t, err)
		require.Len(t, blocks, 0)
	})

	t.Run("valid type", func(t *testing.T) {
		time.Sleep(1 * time.Millisecond)
		blocks, err = store.GetBlocksWithType(container, "test")
		require.NoError(t, err)
		require.Len(t, blocks, 4)
	})

	t.Run("not existing parent", func(t *testing.T) {
		time.Sleep(1 * time.Millisecond)
		blocks, err = store.GetBlocksWithRootID(container, "not-exists")
		require.NoError(t, err)
		require.Len(t, blocks, 0)
	})

	t.Run("valid parent", func(t *testing.T) {
		time.Sleep(1 * time.Millisecond)
		blocks, err = store.GetBlocksWithRootID(container, "block1")
		require.NoError(t, err)
		require.Len(t, blocks, 4)
	})
}

func testGetBlock(t *testing.T, store store.Store, container store.Container) {
	t.Run("get a block", func(t *testing.T) {
		block := model.Block{
			ID:         "block-id-10",
			RootID:     "root-id-1",
			ModifiedBy: "user-id-1",
		}

		err := store.InsertBlock(container, &block, "user-id-1")
		require.NoError(t, err)

		fetchedBlock, err := store.GetBlock(container, "block-id-10")
		require.NoError(t, err)
		require.NotNil(t, fetchedBlock)
		require.Equal(t, "block-id-10", fetchedBlock.ID)
		require.Equal(t, "root-id-1", fetchedBlock.RootID)
		require.Equal(t, "user-id-1", fetchedBlock.CreatedBy)
		require.Equal(t, "user-id-1", fetchedBlock.ModifiedBy)
		assert.WithinDurationf(t, time.Now(), time.Unix(fetchedBlock.CreateAt/1000, 0), 1*time.Second, "create time should be current time")
		assert.WithinDurationf(t, time.Now(), time.Unix(fetchedBlock.UpdateAt/1000, 0), 1*time.Second, "update time should be current time")
	})

	t.Run("get a non-existing block", func(t *testing.T) {
		fetchedBlock, err := store.GetBlock(container, "non-existing-id")
		require.NoError(t, err)
		require.Nil(t, fetchedBlock)
	})
}
