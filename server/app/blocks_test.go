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

func TestInsertBlock(t *testing.T) {
	th := SetupTestHelper(t)

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
		th.Store.EXPECT().InsertBlock(gomock.Eq(container), gomock.Eq(&block), gomock.Eq("user-id-1")).Return(errors.New("dummy error"))
		err := th.App.InsertBlock(container, block, "user-id-1")
		require.Error(t, err, "dummy error")
	})
}
