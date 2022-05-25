package app

import (
	"database/sql"
	"testing"

	"github.com/golang/mock/gomock"
	"github.com/stretchr/testify/require"

	mmModel "github.com/mattermost/mattermost-server/v6/model"

	"github.com/mattermost/focalboard/server/model"
	st "github.com/mattermost/focalboard/server/services/store"
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
		blockPatches := model.BlockPatchBatch{
			BlockIDs: []string{"block1"},
			BlockPatches: []model.BlockPatch{
				{Title: mmModel.NewString("new title")},
			},
		}

		block1 := model.Block{ID: "block1"}
		th.Store.EXPECT().GetBlocksByIDs(container, []string{"block1"}).Return([]model.Block{block1}, nil)
		th.Store.EXPECT().PatchBlocks(gomock.Eq(container), gomock.Eq(&blockPatches), gomock.Eq("user-id-1")).Return(nil)
		th.Store.EXPECT().GetBlock(container, "block1").Return(&block1, nil)
		err := th.App.PatchBlocks(container, &blockPatches, "user-id-1")
		require.NoError(t, err)
	})

	t.Run("patchBlocks error scenerio", func(t *testing.T) {
		blockPatches := model.BlockPatchBatch{BlockIDs: []string{}}
		th.Store.EXPECT().GetBlocksByIDs(container, []string{}).Return(nil, sql.ErrNoRows)
		err := th.App.PatchBlocks(container, &blockPatches, "user-id-1")
		require.ErrorIs(t, err, sql.ErrNoRows)
	})

	t.Run("cloud limit error scenario", func(t *testing.T) {
		th.App.CardLimit = 5

		fakeLicense := &mmModel.License{
			Features: &mmModel.Features{Cloud: mmModel.NewBool(true)},
		}

		blockPatches := model.BlockPatchBatch{
			BlockIDs: []string{"block1"},
			BlockPatches: []model.BlockPatch{
				{Title: mmModel.NewString("new title")},
			},
		}

		block1 := model.Block{
			ID:       "block1",
			Type:     model.TypeCard,
			ParentID: "board1",
			RootID:   "board1",
			UpdateAt: 100,
		}

		board1 := model.Block{
			ID:       "board1",
			Type:     model.TypeBoard,
			ParentID: "board1",
			RootID:   "board1",
		}

		th.Store.EXPECT().GetBlocksByIDs(container, []string{"block1"}).Return([]model.Block{block1}, nil)
		th.Store.EXPECT().GetLicense().Return(fakeLicense)
		th.Store.EXPECT().GetCardLimitTimestamp().Return(int64(150), nil)
		th.Store.EXPECT().GetBlocksByIDs(container, []string{"board1"}).Return([]model.Block{board1}, nil)
		err := th.App.PatchBlocks(container, &blockPatches, "user-id-1")
		require.ErrorIs(t, err, ErrPatchUpdatesLimitedCards)
	})
}

func TestDeleteBlock(t *testing.T) {
	th, tearDown := SetupTestHelper(t)
	defer tearDown()

	container := st.Container{
		WorkspaceID: "0",
	}

	t.Run("success scenerio", func(t *testing.T) {
		block := model.Block{
			ID: "block-id",
		}
		th.Store.EXPECT().GetBlock(gomock.Eq(container), gomock.Eq("block-id")).Return(&block, nil)
		th.Store.EXPECT().DeleteBlock(gomock.Eq(container), gomock.Eq("block-id"), gomock.Eq("user-id-1")).Return(nil)
		err := th.App.DeleteBlock(container, "block-id", "user-id-1")
		require.NoError(t, err)
	})

	t.Run("error scenerio", func(t *testing.T) {
		block := model.Block{
			ID: "block-id",
		}
		th.Store.EXPECT().GetBlock(gomock.Eq(container), gomock.Eq("block-id")).Return(&block, nil)
		th.Store.EXPECT().DeleteBlock(gomock.Eq(container), gomock.Eq("block-id"), gomock.Eq("user-id-1")).Return(blockError{"error"})
		err := th.App.DeleteBlock(container, "block-id", "user-id-1")
		require.Error(t, err, "error")
	})
}

func TestUndeleteBlock(t *testing.T) {
	th, tearDown := SetupTestHelper(t)
	defer tearDown()

	container := st.Container{
		WorkspaceID: "0",
	}

	t.Run("success scenerio", func(t *testing.T) {
		block := model.Block{
			ID: "block-id",
		}
		th.Store.EXPECT().GetBlockHistory(
			gomock.Eq(container),
			gomock.Eq("block-id"),
			gomock.Eq(model.QueryBlockHistoryOptions{Limit: 1, Descending: true}),
		).Return([]model.Block{block}, nil)
		th.Store.EXPECT().UndeleteBlock(gomock.Eq(container), gomock.Eq("block-id"), gomock.Eq("user-id-1")).Return(nil)
		th.Store.EXPECT().GetBlock(gomock.Eq(container), gomock.Eq("block-id")).Return(&block, nil)
		err := th.App.UndeleteBlock(container, "block-id", "user-id-1")
		require.NoError(t, err)
	})

	t.Run("error scenerio", func(t *testing.T) {
		block := model.Block{
			ID: "block-id",
		}
		th.Store.EXPECT().GetBlockHistory(
			gomock.Eq(container),
			gomock.Eq("block-id"),
			gomock.Eq(model.QueryBlockHistoryOptions{Limit: 1, Descending: true}),
		).Return([]model.Block{block}, nil)
		th.Store.EXPECT().UndeleteBlock(gomock.Eq(container), gomock.Eq("block-id"), gomock.Eq("user-id-1")).Return(blockError{"error"})
		th.Store.EXPECT().GetBlock(gomock.Eq(container), gomock.Eq("block-id")).Return(&block, nil)
		err := th.App.UndeleteBlock(container, "block-id", "user-id-1")
		require.Error(t, err, "error")
	})
}
