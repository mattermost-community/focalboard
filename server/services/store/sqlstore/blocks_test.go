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
	require.Empty(t, blocks)

	block := model.Block{
		ID: "id-test",
	}

	err = store.InsertBlock(block)
	require.NoError(t, err)

	blocks, err = store.GetAllBlocks()
	require.NoError(t, err)
	require.Len(t, blocks, 1)

	// Wait for not colliding the ID+insert_at key
	time.Sleep(1 * time.Millisecond)
	err = store.DeleteBlock(block.ID)
	require.NoError(t, err)

	blocks, err = store.GetAllBlocks()
	require.NoError(t, err)
	require.Empty(t, blocks)
}
