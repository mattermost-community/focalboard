package storetests

import (
	"testing"
	"time"

	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/services/store"
	"github.com/stretchr/testify/require"
)

func StoreTestBlocksStore(t *testing.T, setup func(t *testing.T) (store.Store, func())) {
	t.Run("InsertBlock", func(t *testing.T) {
		store, tearDown := setup(t)
		defer tearDown()
		testInsertBlock(t, store)
	})
	t.Run("DeleteBlock", func(t *testing.T) {
		store, tearDown := setup(t)
		defer tearDown()
		testDeleteBlock(t, store)
	})
	t.Run("GetSubTree2", func(t *testing.T) {
		store, tearDown := setup(t)
		defer tearDown()
		testGetSubTree2(t, store)
	})
	t.Run("GetSubTree3", func(t *testing.T) {
		store, tearDown := setup(t)
		defer tearDown()
		testGetSubTree3(t, store)
	})
	t.Run("GetParentID", func(t *testing.T) {
		store, tearDown := setup(t)
		defer tearDown()
		testGetParentID(t, store)
	})
	t.Run("GetRootID", func(t *testing.T) {
		store, tearDown := setup(t)
		defer tearDown()
		testGetRootID(t, store)
	})
}

func testInsertBlock(t *testing.T, store store.Store) {
	userID := "user-id"

	blocks, err := store.GetAllBlocks()
	require.NoError(t, err)
	initialCount := len(blocks)

	t.Run("valid block", func(t *testing.T) {
		block := model.Block{
			ID:         "id-test",
			RootID:     "id-test",
			ModifiedBy: userID,
		}

		err := store.InsertBlock(block)
		require.NoError(t, err)

		blocks, err := store.GetAllBlocks()
		require.NoError(t, err)
		require.Len(t, blocks, initialCount+1)
	})

	t.Run("invalid rootid", func(t *testing.T) {
		block := model.Block{
			ID:         "id-test",
			RootID:     "",
			ModifiedBy: userID,
		}

		err := store.InsertBlock(block)
		require.Error(t, err)

		blocks, err := store.GetAllBlocks()
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

		err := store.InsertBlock(block)
		require.Error(t, err)

		blocks, err := store.GetAllBlocks()
		require.NoError(t, err)
		require.Len(t, blocks, initialCount+1)
	})
}

func testGetSubTree2(t *testing.T, store store.Store) {
	userID := "user-id"

	blocks, err := store.GetAllBlocks()
	require.NoError(t, err)
	initialCount := len(blocks)

	blocksToInsert := []model.Block{
		{
			ID:         "parent",
			RootID:     "parent",
			ModifiedBy: userID,
		},
		{
			ID:         "child1",
			RootID:     "parent",
			ParentID:   "parent",
			ModifiedBy: userID,
		},
		{
			ID:         "child2",
			RootID:     "parent",
			ParentID:   "parent",
			ModifiedBy: userID,
		},
		{
			ID:         "grandchild1",
			RootID:     "parent",
			ParentID:   "child1",
			ModifiedBy: userID,
		},
		{
			ID:         "grandchild2",
			RootID:     "parent",
			ParentID:   "child2",
			ModifiedBy: userID,
		},
		{
			ID:         "greatgrandchild1",
			RootID:     "parent",
			ParentID:   "grandchild1",
			ModifiedBy: userID,
		},
	}

	InsertBlocks(t, store, blocksToInsert)

	blocks, err = store.GetAllBlocks()
	require.NoError(t, err)
	require.Len(t, blocks, initialCount+6)

	t.Run("from root id", func(t *testing.T) {
		blocks, err = store.GetSubTree2("parent")
		require.NoError(t, err)
		require.Len(t, blocks, 3)
		require.True(t, ContainsBlockWithID(blocks, "parent"))
		require.True(t, ContainsBlockWithID(blocks, "child1"))
		require.True(t, ContainsBlockWithID(blocks, "child2"))
	})

	t.Run("from child id", func(t *testing.T) {
		blocks, err = store.GetSubTree2("child1")
		require.NoError(t, err)
		require.Len(t, blocks, 2)
		require.True(t, ContainsBlockWithID(blocks, "child1"))
		require.True(t, ContainsBlockWithID(blocks, "grandchild1"))
	})

	t.Run("from not existing id", func(t *testing.T) {
		blocks, err = store.GetSubTree2("not-exists")
		require.NoError(t, err)
		require.Len(t, blocks, 0)
	})
}

func testGetSubTree3(t *testing.T, store store.Store) {
	userID := "user-id"

	blocks, err := store.GetAllBlocks()
	require.NoError(t, err)
	initialCount := len(blocks)

	blocksToInsert := []model.Block{
		{
			ID:         "parent",
			RootID:     "parent",
			ModifiedBy: userID,
		},
		{
			ID:         "child1",
			RootID:     "parent",
			ParentID:   "parent",
			ModifiedBy: userID,
		},
		{
			ID:         "child2",
			RootID:     "parent",
			ParentID:   "parent",
			ModifiedBy: userID,
		},
		{
			ID:         "grandchild1",
			RootID:     "parent",
			ParentID:   "child1",
			ModifiedBy: userID,
		},
		{
			ID:         "grandchild2",
			RootID:     "parent",
			ParentID:   "child2",
			ModifiedBy: userID,
		},
		{
			ID:         "greatgrandchild1",
			RootID:     "parent",
			ParentID:   "grandchild1",
			ModifiedBy: userID,
		},
	}

	InsertBlocks(t, store, blocksToInsert)

	blocks, err = store.GetAllBlocks()
	require.NoError(t, err)
	require.Len(t, blocks, initialCount+6)

	t.Run("from root id", func(t *testing.T) {
		blocks, err = store.GetSubTree3("parent")
		require.NoError(t, err)
		require.Len(t, blocks, 5)
		require.True(t, ContainsBlockWithID(blocks, "parent"))
		require.True(t, ContainsBlockWithID(blocks, "child1"))
		require.True(t, ContainsBlockWithID(blocks, "child2"))
		require.True(t, ContainsBlockWithID(blocks, "grandchild1"))
		require.True(t, ContainsBlockWithID(blocks, "grandchild2"))
	})

	t.Run("from child id", func(t *testing.T) {
		blocks, err = store.GetSubTree3("child1")
		require.NoError(t, err)
		require.Len(t, blocks, 3)
		require.True(t, ContainsBlockWithID(blocks, "child1"))
		require.True(t, ContainsBlockWithID(blocks, "grandchild1"))
		require.True(t, ContainsBlockWithID(blocks, "greatgrandchild1"))
	})

	t.Run("from not existing id", func(t *testing.T) {
		blocks, err = store.GetSubTree3("not-exists")
		require.NoError(t, err)
		require.Len(t, blocks, 0)
	})
}

func testGetRootID(t *testing.T, store store.Store) {
	userID := "user-id"

	blocks, err := store.GetAllBlocks()
	require.NoError(t, err)
	initialCount := len(blocks)

	blocksToInsert := []model.Block{
		{
			ID:         "parent",
			RootID:     "parent",
			ModifiedBy: userID,
		},
		{
			ID:         "child1",
			RootID:     "parent",
			ParentID:   "parent",
			ModifiedBy: userID,
		},
		{
			ID:         "child2",
			RootID:     "parent",
			ParentID:   "parent",
			ModifiedBy: userID,
		},
		{
			ID:         "grandchild1",
			RootID:     "parent",
			ParentID:   "child1",
			ModifiedBy: userID,
		},
		{
			ID:         "grandchild2",
			RootID:     "parent",
			ParentID:   "child2",
			ModifiedBy: userID,
		},
		{
			ID:         "greatgrandchild1",
			RootID:     "parent",
			ParentID:   "grandchild1",
			ModifiedBy: userID,
		},
	}

	InsertBlocks(t, store, blocksToInsert)

	blocks, err = store.GetAllBlocks()
	require.NoError(t, err)
	require.Len(t, blocks, initialCount+6)

	t.Run("from root id", func(t *testing.T) {
		rootID, err := store.GetRootID("parent")
		require.NoError(t, err)
		require.Equal(t, "parent", rootID)
	})

	t.Run("from child id", func(t *testing.T) {
		rootID, err := store.GetRootID("child1")
		require.NoError(t, err)
		require.Equal(t, "parent", rootID)
	})

	t.Run("from not existing id", func(t *testing.T) {
		_, err := store.GetRootID("not-exists")
		require.Error(t, err)
	})
}

func testGetParentID(t *testing.T, store store.Store) {
	userID := "user-id"

	blocks, err := store.GetAllBlocks()
	require.NoError(t, err)
	initialCount := len(blocks)

	blocksToInsert := []model.Block{
		{
			ID:         "parent",
			RootID:     "parent",
			ModifiedBy: userID,
		},
		{
			ID:         "child1",
			RootID:     "parent",
			ParentID:   "parent",
			ModifiedBy: userID,
		},
		{
			ID:         "child2",
			RootID:     "parent",
			ParentID:   "parent",
			ModifiedBy: userID,
		},
		{
			ID:         "grandchild1",
			RootID:     "parent",
			ParentID:   "child1",
			ModifiedBy: userID,
		},
		{
			ID:         "grandchild2",
			RootID:     "parent",
			ParentID:   "child2",
			ModifiedBy: userID,
		},
		{
			ID:         "greatgrandchild1",
			RootID:     "parent",
			ParentID:   "grandchild1",
			ModifiedBy: userID,
		},
	}

	InsertBlocks(t, store, blocksToInsert)

	blocks, err = store.GetAllBlocks()
	require.NoError(t, err)
	require.Len(t, blocks, initialCount+6)

	t.Run("from root id", func(t *testing.T) {
		parentID, err := store.GetParentID("parent")
		require.NoError(t, err)
		require.Equal(t, "", parentID)
	})

	t.Run("from child id", func(t *testing.T) {
		parentID, err := store.GetParentID("grandchild1")
		require.NoError(t, err)
		require.Equal(t, "child1", parentID)
	})

	t.Run("from not existing id", func(t *testing.T) {
		_, err := store.GetParentID("not-exists")
		require.Error(t, err)
	})
}

func testDeleteBlock(t *testing.T, store store.Store) {
	userID := "user-id"

	blocks, err := store.GetAllBlocks()
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
	InsertBlocks(t, store, blocksToInsert)

	blocks, err = store.GetAllBlocks()
	require.NoError(t, err)
	require.Len(t, blocks, initialCount+3)

	t.Run("exiting id", func(t *testing.T) {
		// Wait for not colliding the ID+insert_at key
		time.Sleep(1 * time.Millisecond)
		err := store.DeleteBlock("block1", userID)
		require.NoError(t, err)
	})

	t.Run("exiting id multiple times", func(t *testing.T) {
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
