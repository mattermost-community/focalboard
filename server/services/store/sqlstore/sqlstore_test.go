package sqlstore

import (
	"os"
	"testing"

	"github.com/mattermost/mattermost-octo-tasks/server/model"
	"github.com/stretchr/testify/require"
)

func SetupTests(t *testing.T) (*SQLStore, func()) {
	dbType := os.Getenv("OT_STORE_TEST_DB_TYPE")
	if dbType == "" {
		dbType = "sqlite3"
	}

	connectionString := os.Getenv("OT_STORE_TEST_CONN_STRING")
	if connectionString == "" {
		connectionString = ":memory:"
	}

	store, err := New(dbType, connectionString)
	require.Nil(t, err)

	tearDown := func() {
		err = store.Shutdown()
		require.Nil(t, err)
	}

	return store, tearDown
}

func InsertBlocks(t *testing.T, s *SQLStore, blocks []model.Block) {
	for _, block := range blocks {
		err := s.InsertBlock(block)
		require.NoError(t, err)
	}
}

func DeleteBlocks(t *testing.T, s *SQLStore, blocks []model.Block, modifiedBy string) {
	for _, block := range blocks {
		err := s.DeleteBlock(block.ID, modifiedBy)
		require.NoError(t, err)
	}
}

func ContainsBlockWithID(blocks []model.Block, blockID string) bool {
	for _, block := range blocks {
		if block.ID == blockID {
			return true
		}
	}

	return false
}
