package storetests

import (
	"testing"

	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/services/store"
	"github.com/stretchr/testify/require"
)

func InsertBlocks(t *testing.T, s store.Store, blocks []*model.Block, userID string) {
	for i := range blocks {
		err := s.InsertBlock(blocks[i], userID)
		require.NoError(t, err)
	}
}

func DeleteBlocks(t *testing.T, s store.Store, blocks []*model.Block, modifiedBy string) {
	for _, block := range blocks {
		err := s.DeleteBlock(block.ID, modifiedBy)
		require.NoError(t, err)
	}
}

func ContainsBlockWithID(blocks []*model.Block, blockID string) bool {
	for _, block := range blocks {
		if block.ID == blockID {
			return true
		}
	}

	return false
}
