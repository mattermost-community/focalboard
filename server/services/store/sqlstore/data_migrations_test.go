package sqlstore

import (
	"testing"
	"time"

	"github.com/mattermost/focalboard/server/model"
	st "github.com/mattermost/focalboard/server/services/store"

	"github.com/stretchr/testify/require"
)

//nolint:gosec
func TestRunUniqueIDsMigration(t *testing.T) {
	store, tearDown := SetupTests(t)
	sqlStore := store.(*SQLStore)
	defer tearDown()

	// we need to mark the migration as undone so we can run it again
	// with the test data
	keyErr := sqlStore.SetSystemSetting(UniqueIDsMigrationKey, "false")
	require.NoError(t, keyErr)

	container1 := st.Container{WorkspaceID: "1"}
	container2 := st.Container{WorkspaceID: "2"}
	container3 := st.Container{WorkspaceID: "3"}

	// blocks from workspace1. They shouldn't change, as the first
	// duplicated ID is preserved
	block1 := model.Block{ID: "block-id-1", RootID: "root-id-1"}
	block2 := model.Block{ID: "block-id-2", RootID: "root-id-2", ParentID: "block-id-1"}
	block3 := model.Block{ID: "block-id-3", RootID: "block-id-1"}

	// blocks from workspace2. They're identical to blocks 1, 2 and 3,
	// and they should change
	block4 := model.Block{ID: "block-id-1", RootID: "root-id-1"}
	block5 := model.Block{ID: "block-id-2", RootID: "root-id-2", ParentID: "block-id-1"}
	block6 := model.Block{ID: "block-id-6", RootID: "block-id-1", ParentID: "block-id-2"}

	// block from workspace3. It should change as well
	block7 := model.Block{ID: "block-id-2", RootID: "root-id-2"}

	for _, block := range []model.Block{block1, block2, block3} {
		err := sqlStore.InsertBlock(container1, &block, "user-id")
		require.NoError(t, err)
		time.Sleep(100 * time.Millisecond)
	}

	for _, block := range []model.Block{block4, block5, block6} {
		err := sqlStore.InsertBlock(container2, &block, "user-id")
		require.NoError(t, err)
		time.Sleep(100 * time.Millisecond)
	}

	for _, block := range []model.Block{block7} {
		err := sqlStore.InsertBlock(container3, &block, "user-id")
		require.NoError(t, err)
		time.Sleep(100 * time.Millisecond)
	}

	err := sqlStore.runUniqueIDsMigration()
	require.NoError(t, err)

	// blocks from workspace 1 haven't changed, so we can simply fetch them
	newBlock1, err := sqlStore.GetBlock(container1, block1.ID)
	require.NoError(t, err)
	require.NotNil(t, newBlock1)
	newBlock2, err := sqlStore.GetBlock(container1, block2.ID)
	require.NoError(t, err)
	require.NotNil(t, newBlock2)
	newBlock3, err := sqlStore.GetBlock(container1, block3.ID)
	require.NoError(t, err)
	require.NotNil(t, newBlock3)

	// first two blocks from workspace 2 have changed, so we fetch
	// them through the third one, which points to the new IDs
	newBlock6, err := sqlStore.GetBlock(container2, block6.ID)
	require.NoError(t, err)
	require.NotNil(t, newBlock6)
	newBlock4, err := sqlStore.GetBlock(container2, newBlock6.RootID)
	require.NoError(t, err)
	require.NotNil(t, newBlock4)
	newBlock5, err := sqlStore.GetBlock(container2, newBlock6.ParentID)
	require.NoError(t, err)
	require.NotNil(t, newBlock5)

	// block from workspace 3 changed as well, so we shouldn't be able
	// to fetch it
	newBlock7, err := sqlStore.GetBlock(container3, block7.ID)
	require.NoError(t, err)
	require.Nil(t, newBlock7)

	// workspace 1 block links are maintained
	require.Equal(t, newBlock1.ID, newBlock2.ParentID)
	require.Equal(t, newBlock1.ID, newBlock3.RootID)

	// workspace 2 first two block IDs have changed
	require.NotEqual(t, block4.ID, newBlock4.RootID)
	require.NotEqual(t, block5.ID, newBlock5.ParentID)
}
