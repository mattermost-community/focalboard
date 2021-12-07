package app

import (
	"testing"

	"github.com/mattermost/focalboard/server/model"

	"github.com/golang/mock/gomock"
	st "github.com/mattermost/focalboard/server/services/store"
	"github.com/stretchr/testify/require"
)

type blockError struct {
	msg string
}

func (be blockError) Error() string {
	return be.msg
}

func TestGetParentID(t *testing.T) {
	th, tearDown := SetupTestHelper(t)
	defer tearDown()

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
		th.Store.EXPECT().GetParentID(gomock.Eq(container), gomock.Eq("test-id")).Return("", blockError{"block-not-found"})
		_, err := th.App.GetParentID(container, "test-id")
		require.Error(t, err)
		require.ErrorIs(t, err, blockError{"block-not-found"})
	})
}

func TestInsertBlock(t *testing.T) {
	th, tearDown := SetupTestHelper(t)
	defer tearDown()

	container := st.Container{
		WorkspaceID: "0",
	}

	t.Run("success scenerio", func(t *testing.T) {
		block := model.Block{}
		th.Store.EXPECT().InsertBlock(gomock.Eq(container), gomock.Eq(&block), gomock.Eq("user-id-1")).Return(nil)
		err := th.App.InsertBlock(container, block, "user-id-1")
		require.NoError(t, err)
	})

	t.Run("error scenerio", func(t *testing.T) {
		block := model.Block{}
		th.Store.EXPECT().InsertBlock(gomock.Eq(container), gomock.Eq(&block), gomock.Eq("user-id-1")).Return(blockError{"error"})
		err := th.App.InsertBlock(container, block, "user-id-1")
		require.Error(t, err, "error")
	})
}

func TestPatchBlocks(t *testing.T) {
	th, tearDown := SetupTestHelper(t)
	defer tearDown()

	container := st.Container{
		WorkspaceID: "0",
	}
	t.Run("patchBlocks success scenerio", func(t *testing.T) {
		blockPatches := model.BlockPatchBatch{}
		th.Store.EXPECT().PatchBlocks(gomock.Eq(container), gomock.Eq(&blockPatches), gomock.Eq("user-id-1")).Return(nil)
		err := th.App.PatchBlocks(container, &blockPatches, "user-id-1")
		require.NoError(t, err)
	})

	t.Run("patchBlocks error scenerio", func(t *testing.T) {
		blockPatches := model.BlockPatchBatch{}
		th.Store.EXPECT().PatchBlocks(gomock.Eq(container), gomock.Eq(&blockPatches), gomock.Eq("user-id-1")).Return(blockError{"error"})
		err := th.App.PatchBlocks(container, &blockPatches, "user-id-1")
		require.Error(t, err, "error")
	})
}
