package sqlstore

import (
	"testing"
	"time"

	"github.com/mattermost/mattermost-octo-tasks/server/model"
	"github.com/stretchr/testify/require"
)

func TestInsertBlock(t *testing.T) {
	store, tearDown := SetupTests(t)
	defer tearDown()

	blocks, err := store.GetAllBlocks()
	require.NoError(t, err)
	initialCount := len(blocks)

	block := model.Block{
		ID:     "id-test",
		RootID: "id-test",
	}

	err = store.InsertBlock(block)
	require.NoError(t, err)

	blocks, err = store.GetAllBlocks()
	require.NoError(t, err)
	require.Len(t, blocks, initialCount+1)

	// Wait for not colliding the ID+insert_at key
	time.Sleep(1 * time.Millisecond)
	err = store.DeleteBlock(block.ID)
	require.NoError(t, err)

	blocks, err = store.GetAllBlocks()
	require.NoError(t, err)
	require.Len(t, blocks, initialCount)
}

func TestGetSubTree2(t *testing.T) {
	store, tearDown := SetupTests(t)
	defer tearDown()

	blocks, err := store.GetAllBlocks()
	require.NoError(t, err)
	initialCount := len(blocks)

	blocksToInsert := []model.Block{
		model.Block{
			ID:     "parent",
			RootID: "parent",
		},
		model.Block{
			ID:       "child1",
			RootID:   "parent",
			ParentID: "parent",
		},
		model.Block{
			ID:       "child2",
			RootID:   "parent",
			ParentID: "parent",
		},
		model.Block{
			ID:       "grandchild1",
			RootID:   "parent",
			ParentID: "child1",
		},
		model.Block{
			ID:       "grandchild2",
			RootID:   "parent",
			ParentID: "child2",
		},
		model.Block{
			ID:       "greatgrandchild1",
			RootID:   "parent",
			ParentID: "grandchild1",
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
	DeleteBlocks(t, store, blocksToInsert)

	blocks, err = store.GetAllBlocks()
	require.NoError(t, err)
	require.Len(t, blocks, initialCount)
}

func TestGetSubTree3(t *testing.T) {
	store, tearDown := SetupTests(t)
	defer tearDown()

	blocks, err := store.GetAllBlocks()
	require.NoError(t, err)
	initialCount := len(blocks)

	blocksToInsert := []model.Block{
		model.Block{
			ID:     "parent",
			RootID: "parent",
		},
		model.Block{
			ID:       "child1",
			RootID:   "parent",
			ParentID: "parent",
		},
		model.Block{
			ID:       "child2",
			RootID:   "parent",
			ParentID: "parent",
		},
		model.Block{
			ID:       "grandchild1",
			RootID:   "parent",
			ParentID: "child1",
		},
		model.Block{
			ID:       "grandchild2",
			RootID:   "parent",
			ParentID: "child2",
		},
		model.Block{
			ID:       "greatgrandchild1",
			RootID:   "parent",
			ParentID: "grandchild1",
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
	DeleteBlocks(t, store, blocksToInsert)

	blocks, err = store.GetAllBlocks()
	require.NoError(t, err)
	require.Len(t, blocks, initialCount)
}
