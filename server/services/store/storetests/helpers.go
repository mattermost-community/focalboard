package storetests

import (
	"testing"

	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/services/store"
	"github.com/stretchr/testify/require"
)

func InsertBlocks(t *testing.T, s store.Store, container store.Container, blocks []model.Block) {
	for _, block := range blocks {
		err := s.InsertBlock(container, block)
		require.NoError(t, err)
	}
}

func DeleteBlocks(t *testing.T, s store.Store, container store.Container, blocks []model.Block, modifiedBy string) {
	for _, block := range blocks {
		err := s.DeleteBlock(container, block.ID, modifiedBy)
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
