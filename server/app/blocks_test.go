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

func TestInsertBlock(t *testing.T) {
	th, tearDown := SetupTestHelper(t)
	defer tearDown()

	container := st.Container{
		TeamID: "0",
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
