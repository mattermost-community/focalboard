package app

import (
	"testing"

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
		th.Store.EXPECT().GetParentID(gomock.Eq(container), gomock.Eq("test-id")).Return("", blockError{"block-not-found"})
		_, err := th.App.GetParentID(container, "test-id")
		require.Error(t, err)
		require.ErrorIs(t, err, blockError{"block-not-found"})
	})
}
