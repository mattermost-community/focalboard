package utils

import (
	"testing"

	"github.com/mattermost/focalboard/server/model"

	"github.com/stretchr/testify/require"
)

func TestGenerateBlockIDs(t *testing.T) {
	t.Run("Should generate a new ID for a single block with no references", func(t *testing.T) {
		blockID := NewID(IDTypeBlock)
		blocks := []model.Block{{ID: blockID}}

		blocks = GenerateBlockIDs(blocks)

		require.NotEqual(t, blockID, blocks[0].ID)
		require.Zero(t, blocks[0].RootID)
		require.Zero(t, blocks[0].ParentID)
	})

	t.Run("Should generate a new ID for a single block with references", func(t *testing.T) {
		blockID := NewID(IDTypeBlock)
		rootID := NewID(IDTypeBlock)
		parentID := NewID(IDTypeBlock)
		blocks := []model.Block{{ID: blockID, RootID: rootID, ParentID: parentID}}

		blocks = GenerateBlockIDs(blocks)

		require.NotEqual(t, blockID, blocks[0].ID)
		require.Equal(t, rootID, blocks[0].RootID)
		require.Equal(t, parentID, blocks[0].ParentID)
	})

	t.Run("Should generate IDs and link multiple blocks with existing references", func(t *testing.T) {
		blockID1 := NewID(IDTypeBlock)
		rootID1 := NewID(IDTypeBlock)
		parentID1 := NewID(IDTypeBlock)
		block1 := model.Block{ID: blockID1, RootID: rootID1, ParentID: parentID1}

		blockID2 := NewID(IDTypeBlock)
		rootID2 := blockID1
		parentID2 := NewID(IDTypeBlock)
		block2 := model.Block{ID: blockID2, RootID: rootID2, ParentID: parentID2}

		blocks := []model.Block{block1, block2}

		blocks = GenerateBlockIDs(blocks)

		require.NotEqual(t, blockID1, blocks[0].ID)
		require.Equal(t, rootID1, blocks[0].RootID)
		require.Equal(t, parentID1, blocks[0].ParentID)

		require.NotEqual(t, blockID2, blocks[1].ID)
		require.NotEqual(t, rootID2, blocks[1].RootID)
		require.Equal(t, parentID2, blocks[1].ParentID)

		// blockID1 was referenced, so it should still be after the ID
		// changes
		require.Equal(t, blocks[0].ID, blocks[1].RootID)
	})

	t.Run("Should generate new IDs but not modify nonexisting references", func(t *testing.T) {
		blockID1 := NewID(IDTypeBlock)
		rootID1 := ""
		parentID1 := NewID(IDTypeBlock)
		block1 := model.Block{ID: blockID1, RootID: rootID1, ParentID: parentID1}

		blockID2 := NewID(IDTypeBlock)
		rootID2 := NewID(IDTypeBlock)
		parentID2 := ""
		block2 := model.Block{ID: blockID2, RootID: rootID2, ParentID: parentID2}

		blocks := []model.Block{block1, block2}

		blocks = GenerateBlockIDs(blocks)

		// only the IDs should have changed
		require.NotEqual(t, blockID1, blocks[0].ID)
		require.Zero(t, blocks[0].RootID)
		require.Equal(t, parentID1, blocks[0].ParentID)

		require.NotEqual(t, blockID2, blocks[1].ID)
		require.Equal(t, rootID2, blocks[1].RootID)
		require.Zero(t, blocks[1].ParentID)
	})

	t.Run("Should modify correctly multiple blocks with existing and nonexisting references", func(t *testing.T) {
		blockID1 := NewID(IDTypeBlock)
		rootID1 := NewID(IDTypeBlock)
		parentID1 := NewID(IDTypeBlock)
		block1 := model.Block{ID: blockID1, RootID: rootID1, ParentID: parentID1}

		// linked to 1
		blockID2 := NewID(IDTypeBlock)
		rootID2 := blockID1
		parentID2 := NewID(IDTypeBlock)
		block2 := model.Block{ID: blockID2, RootID: rootID2, ParentID: parentID2}

		// linked to 2
		blockID3 := NewID(IDTypeBlock)
		rootID3 := blockID2
		parentID3 := NewID(IDTypeBlock)
		block3 := model.Block{ID: blockID3, RootID: rootID3, ParentID: parentID3}

		// linked to 1
		blockID4 := NewID(IDTypeBlock)
		rootID4 := blockID1
		parentID4 := NewID(IDTypeBlock)
		block4 := model.Block{ID: blockID4, RootID: rootID4, ParentID: parentID4}

		// blocks are shuffled
		blocks := []model.Block{block4, block2, block1, block3}

		blocks = GenerateBlockIDs(blocks)

		// block 1
		require.NotEqual(t, blockID1, blocks[2].ID)
		require.Equal(t, rootID1, blocks[2].RootID)
		require.Equal(t, parentID1, blocks[2].ParentID)

		// block 2
		require.NotEqual(t, blockID2, blocks[1].ID)
		require.NotEqual(t, rootID2, blocks[1].RootID)
		require.Equal(t, blocks[2].ID, blocks[1].RootID) // link to 1
		require.Equal(t, parentID2, blocks[1].ParentID)

		// block 3
		require.NotEqual(t, blockID3, blocks[3].ID)
		require.NotEqual(t, rootID3, blocks[3].RootID)
		require.Equal(t, blocks[1].ID, blocks[3].RootID) // link to 2
		require.Equal(t, parentID3, blocks[3].ParentID)

		// block 4
		require.NotEqual(t, blockID4, blocks[0].ID)
		require.NotEqual(t, rootID4, blocks[0].RootID)
		require.Equal(t, blocks[2].ID, blocks[0].RootID) // link to 1
		require.Equal(t, parentID4, blocks[0].ParentID)
	})
}
