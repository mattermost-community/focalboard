package app

import (
	"testing"

	"github.com/golang/mock/gomock"
	"github.com/mattermost/focalboard/server/model"

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

	t.Run("success scenerio", func(t *testing.T) {
		boardID := "test-board-id"
		block := model.Block{BoardID: boardID}
		board := &model.Board{ID: boardID}
		th.Store.EXPECT().GetBoard(boardID).Return(board, nil)
		th.Store.EXPECT().InsertBlock(&block, "user-id-1").Return(nil)
		th.Store.EXPECT().GetMembersForBoard(boardID).Return([]*model.BoardMember{}, nil)
		err := th.App.InsertBlock(block, "user-id-1")
		require.NoError(t, err)
	})

	t.Run("error scenerio", func(t *testing.T) {
		boardID := "test-board-id"
		block := model.Block{BoardID: boardID}
		board := &model.Board{ID: boardID}
		th.Store.EXPECT().GetBoard(boardID).Return(board, nil)
		th.Store.EXPECT().InsertBlock(&block, "user-id-1").Return(blockError{"error"})
		err := th.App.InsertBlock(block, "user-id-1")
		require.Error(t, err, "error")
	})
}

func TestPatchBlocks(t *testing.T) {
	th, tearDown := SetupTestHelper(t)
	defer tearDown()

	t.Run("patchBlocks success scenerio", func(t *testing.T) {
		blockPatches := model.BlockPatchBatch{}
		th.Store.EXPECT().PatchBlocks(gomock.Eq(&blockPatches), gomock.Eq("user-id-1")).Return(nil)
		err := th.App.PatchBlocks("team-id", &blockPatches, "user-id-1")
		require.NoError(t, err)
	})

	t.Run("patchBlocks error scenerio", func(t *testing.T) {
		blockPatches := model.BlockPatchBatch{}
		th.Store.EXPECT().PatchBlocks(gomock.Eq(&blockPatches), gomock.Eq("user-id-1")).Return(blockError{"error"})
		err := th.App.PatchBlocks("team-id", &blockPatches, "user-id-1")
		require.Error(t, err, "error")
	})
}
