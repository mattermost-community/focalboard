package integrationtests

import (
	"testing"

	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/utils"

	"github.com/stretchr/testify/require"
)

func TestGetBlocks(t *testing.T) {
	th := SetupTestHelper().InitBasic()
	defer th.TearDown()

	blocks, resp := th.Client.GetBlocks()
	require.NoError(t, resp.Error)
	initialCount := len(blocks)

	blockID1 := utils.CreateGUID()
	blockID2 := utils.CreateGUID()
	newBlocks := []model.Block{
		{
			ID:       blockID1,
			RootID:   blockID1,
			CreateAt: 1,
			UpdateAt: 1,
			Type:     "board",
		},
		{
			ID:       blockID2,
			RootID:   blockID2,
			CreateAt: 1,
			UpdateAt: 1,
			Type:     "board",
		},
	}
	_, resp = th.Client.InsertBlocks(newBlocks)
	require.NoError(t, resp.Error)

	blocks, resp = th.Client.GetBlocks()
	require.NoError(t, resp.Error)
	require.Len(t, blocks, initialCount+2)

	blockIDs := make([]string, len(blocks))
	for i, b := range blocks {
		blockIDs[i] = b.ID
	}
	require.Contains(t, blockIDs, blockID1)
	require.Contains(t, blockIDs, blockID2)
}

func TestPostBlock(t *testing.T) {
	th := SetupTestHelper().InitBasic()
	defer th.TearDown()

	blocks, resp := th.Client.GetBlocks()
	require.NoError(t, resp.Error)
	initialCount := len(blocks)

	blockID1 := utils.CreateGUID()
	blockID2 := utils.CreateGUID()
	blockID3 := utils.CreateGUID()

	t.Run("Create a single block", func(t *testing.T) {
		block := model.Block{
			ID:       blockID1,
			RootID:   blockID1,
			CreateAt: 1,
			UpdateAt: 1,
			Type:     "board",
			Title:    "New title",
		}

		_, resp := th.Client.InsertBlocks([]model.Block{block})
		require.NoError(t, resp.Error)

		blocks, resp := th.Client.GetBlocks()
		require.NoError(t, resp.Error)
		require.Len(t, blocks, initialCount+1)

		blockIDs := make([]string, len(blocks))
		for i, b := range blocks {
			blockIDs[i] = b.ID
		}
		require.Contains(t, blockIDs, blockID1)
	})

	t.Run("Create a couple of blocks in the same call", func(t *testing.T) {
		newBlocks := []model.Block{
			{
				ID:       blockID2,
				RootID:   blockID2,
				CreateAt: 1,
				UpdateAt: 1,
				Type:     "board",
			},
			{
				ID:       blockID3,
				RootID:   blockID3,
				CreateAt: 1,
				UpdateAt: 1,
				Type:     "board",
			},
		}

		_, resp := th.Client.InsertBlocks(newBlocks)
		require.NoError(t, resp.Error)

		blocks, resp := th.Client.GetBlocks()
		require.NoError(t, resp.Error)
		require.Len(t, blocks, initialCount+3)

		blockIDs := make([]string, len(blocks))
		for i, b := range blocks {
			blockIDs[i] = b.ID
		}
		require.Contains(t, blockIDs, blockID1)
		require.Contains(t, blockIDs, blockID2)
		require.Contains(t, blockIDs, blockID3)
	})

	t.Run("Update a block", func(t *testing.T) {
		block := model.Block{
			ID:       blockID1,
			RootID:   blockID1,
			CreateAt: 1,
			UpdateAt: 20,
			Type:     "board",
			Title:    "Updated title",
		}

		_, resp := th.Client.InsertBlocks([]model.Block{block})
		require.NoError(t, resp.Error)

		blocks, resp := th.Client.GetBlocks()
		require.NoError(t, resp.Error)
		require.Len(t, blocks, initialCount+3)

		var updatedBlock model.Block
		for _, b := range blocks {
			if b.ID == blockID1 {
				updatedBlock = b
			}
		}
		require.NotNil(t, updatedBlock)
		require.Equal(t, "Updated title", updatedBlock.Title)
	})
}

func TestDeleteBlock(t *testing.T) {
	th := SetupTestHelper().InitBasic()
	defer th.TearDown()

	blocks, resp := th.Client.GetBlocks()
	require.NoError(t, resp.Error)
	initialCount := len(blocks)

	blockID := utils.CreateGUID()
	t.Run("Create a block", func(t *testing.T) {
		block := model.Block{
			ID:       blockID,
			RootID:   blockID,
			CreateAt: 1,
			UpdateAt: 1,
			Type:     "board",
			Title:    "New title",
		}

		_, resp := th.Client.InsertBlocks([]model.Block{block})
		require.NoError(t, resp.Error)

		blocks, resp := th.Client.GetBlocks()
		require.NoError(t, resp.Error)
		require.Len(t, blocks, initialCount+1)

		blockIDs := make([]string, len(blocks))
		for i, b := range blocks {
			blockIDs[i] = b.ID
		}
		require.Contains(t, blockIDs, blockID)

	})

	t.Run("Delete a block", func(t *testing.T) {
		_, resp := th.Client.DeleteBlock(blockID)
		require.NoError(t, resp.Error)

		blocks, resp := th.Client.GetBlocks()
		require.NoError(t, resp.Error)
		require.Len(t, blocks, initialCount)
	})
}

func TestGetSubtree(t *testing.T) {
	th := SetupTestHelper().InitBasic()
	defer th.TearDown()

	blocks, resp := th.Client.GetBlocks()
	require.NoError(t, resp.Error)
	initialCount := len(blocks)

	parentBlockID := utils.CreateGUID()
	childBlockID1 := utils.CreateGUID()
	childBlockID2 := utils.CreateGUID()
	t.Run("Create the block structure", func(t *testing.T) {
		newBlocks := []model.Block{
			{
				ID:       parentBlockID,
				RootID:   parentBlockID,
				CreateAt: 1,
				UpdateAt: 1,
				Type:     "board",
			},
			{
				ID:       childBlockID1,
				RootID:   parentBlockID,
				ParentID: parentBlockID,
				CreateAt: 2,
				UpdateAt: 2,
				Type:     "card",
			},
			{
				ID:       childBlockID2,
				RootID:   parentBlockID,
				ParentID: parentBlockID,
				CreateAt: 2,
				UpdateAt: 2,
				Type:     "card",
			},
		}

		_, resp := th.Client.InsertBlocks(newBlocks)
		require.NoError(t, resp.Error)

		blocks, resp := th.Client.GetBlocks()
		require.NoError(t, resp.Error)
		require.Len(t, blocks, initialCount+1) // GetBlocks returns root blocks (null ParentID)

		blockIDs := make([]string, len(blocks))
		for i, b := range blocks {
			blockIDs[i] = b.ID
		}
		require.Contains(t, blockIDs, parentBlockID)
	})

	t.Run("Get subtree for parent ID", func(t *testing.T) {
		blocks, resp := th.Client.GetSubtree(parentBlockID)
		require.NoError(t, resp.Error)
		require.Len(t, blocks, 3)

		blockIDs := make([]string, len(blocks))
		for i, b := range blocks {
			blockIDs[i] = b.ID
		}
		require.Contains(t, blockIDs, parentBlockID)
		require.Contains(t, blockIDs, childBlockID1)
		require.Contains(t, blockIDs, childBlockID2)
	})
}
