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
		testInsertBlock(t, store, tearDown)
	})
	t.Run("GetSubTree2", func(t *testing.T) {
		store, tearDown := setup(t)
		testGetSubTree2(t, store, tearDown)
	})
	t.Run("GetSubTree3", func(t *testing.T) {
		store, tearDown := setup(t)
		testGetSubTree3(t, store, tearDown)
	})
}

func testInsertBlock(t *testing.T, store store.Store, tearDown func()) {
	defer tearDown()

	userID := "user-id"

	blocks, err := store.GetAllBlocks()
	require.NoError(t, err)
	initialCount := len(blocks)

	block := model.Block{
		ID:         "id-test",
		RootID:     "id-test",
		ModifiedBy: userID,
	}

	err = store.InsertBlock(block)
	require.NoError(t, err)

	blocks, err = store.GetAllBlocks()
	require.NoError(t, err)
	require.Len(t, blocks, initialCount+1)

	// Wait for not colliding the ID+insert_at key
	time.Sleep(1 * time.Millisecond)
	err = store.DeleteBlock(block.ID, userID)
	require.NoError(t, err)

	blocks, err = store.GetAllBlocks()
	require.NoError(t, err)
	require.Len(t, blocks, initialCount)
}

func testGetSubTree2(t *testing.T, store store.Store, tearDown func()) {
	defer tearDown()

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

	blocks, err = store.GetSubTree2("parent")
	require.NoError(t, err)
	require.Len(t, blocks, 3)
	require.True(t, ContainsBlockWithID(blocks, "parent"))
	require.True(t, ContainsBlockWithID(blocks, "child1"))
	require.True(t, ContainsBlockWithID(blocks, "child2"))

	// Wait for not colliding the ID+insert_at key
	time.Sleep(1 * time.Millisecond)
	DeleteBlocks(t, store, blocksToInsert, userID)

	blocks, err = store.GetAllBlocks()
	require.NoError(t, err)
	require.Len(t, blocks, initialCount)
}

func testGetSubTree3(t *testing.T, store store.Store, tearDown func()) {
	defer tearDown()

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

	blocks, err = store.GetSubTree3("parent")
	require.NoError(t, err)
	require.Len(t, blocks, 5)
	require.True(t, ContainsBlockWithID(blocks, "parent"))
	require.True(t, ContainsBlockWithID(blocks, "child1"))
	require.True(t, ContainsBlockWithID(blocks, "child2"))
	require.True(t, ContainsBlockWithID(blocks, "grandchild1"))
	require.True(t, ContainsBlockWithID(blocks, "grandchild2"))

	// Wait for not colliding the ID+insert_at key
	time.Sleep(1 * time.Millisecond)
	DeleteBlocks(t, store, blocksToInsert, userID)

	blocks, err = store.GetAllBlocks()
	require.NoError(t, err)
	require.Len(t, blocks, initialCount)
}
