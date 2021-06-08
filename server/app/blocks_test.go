package app

import (
	"errors"
	"github.com/mattermost/focalboard/server/model"
	"testing"

	"github.com/golang/mock/gomock"
	st "github.com/mattermost/focalboard/server/services/store"
	"github.com/stretchr/testify/require"
)

func TestGetParentID(t *testing.T) {
	th := SetupTestHelper(t)

	container := st.Container{
		WorkspaceID: "0",
	}
	t.Run("success query", func(t *testing.T) {
		th.Store.EXPECT().GetParentID(gomock.Eq(container), gomock.Eq("test-id")).Return("test-parent-id", nil)
		result, err := th.App.GetParentID(container, "test-id")
		require.NoError(t, err)
		require.Equal(t, "test-parent-id", result)
	})

	t.Run("fail query", func(t *testing.T) {
		th.Store.EXPECT().GetParentID(gomock.Eq(container), gomock.Eq("test-id")).Return("", errors.New("block-not-found"))
		_, err := th.App.GetParentID(container, "test-id")
		require.Error(t, err)
		require.Equal(t, "block-not-found", err.Error())
	})
}

func TestGetParentBlocks(t *testing.T) {
	th := SetupTestHelper(t)

	t.Run("success scenario", func(t *testing.T) {
		retParentBlocks := []model.Block{
			{
				ID: "parent_id_1",
			},
			{
				ID: "parent_id_2",
			},
			{
				ID: "root_id_1",
			},
		}
		th.Store.EXPECT().GetBlocks(
			gomock.Eq([]string{"parent_id_1", "parent_id_2", "root_id_1"}),
		).Return(retParentBlocks, nil)

		blocks, err := th.App.GetParentBlocks([]model.Block{
			{
				ParentID: "parent_id_1",
			},
			{
				ParentID: "parent_id_2",
				RootID:   "root_id_1",
			},
			{
				ID:       "block_id_1",
				ParentID: "block_id_1",
			},
			{
				ID:     "block_id_2",
				RootID: "block_id_2",
			},
		})

		require.NoError(t, err)
		require.Equal(t, 3, len(blocks))
		require.Equal(t, "parent_id_1", blocks[0].ID)
		require.Equal(t, "parent_id_2", blocks[1].ID)
		require.Equal(t, "root_id_1", blocks[2].ID)
	})

	t.Run("error scenerio", func(t *testing.T) {
		th.Store.EXPECT().GetBlocks(gomock.Eq([]string{"parent_id_1"})).Return(nil, errors.New("dummy error"))
		blocks, err := th.App.GetParentBlocks([]model.Block{
			{
				ParentID: "parent_id_1",
			},
		})

		require.Error(t, err, "dummy error")
		require.Nil(t, blocks)
	})

	t.Run("empty input", func(t *testing.T) {
		retParentBlocks := []model.Block{}
		th.Store.EXPECT().GetBlocks(gomock.Any()).Return(retParentBlocks, nil)

		blocks, err := th.App.GetParentBlocks([]model.Block{})

		require.NoError(t, err)
		require.Equal(t, 0, len(blocks))
	})

	t.Run("parent blocks not found", func(t *testing.T) {
		retParentBlocks := []model.Block{}
		th.Store.EXPECT().GetBlocks(
			gomock.Eq([]string{"parent_id_1", "parent_id_2", "root_id_1"}),
		).Return(retParentBlocks, nil)

		blocks, err := th.App.GetParentBlocks([]model.Block{
			{
				ParentID: "parent_id_1",
			},
			{
				ParentID: "parent_id_2",
				RootID:   "root_id_1",
			},
			{
				ID:       "block_id_1",
				ParentID: "block_id_1",
			},
			{
				ID:     "block_id_2",
				RootID: "block_id_2",
			},
		})

		require.NoError(t, err)
		require.Equal(t, 0, len(blocks))
	})
}
