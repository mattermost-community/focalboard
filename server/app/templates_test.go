package app

import (
	"testing"

	"github.com/golang/mock/gomock"
	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/utils"
	"github.com/stretchr/testify/require"

	"github.com/mattermost/mattermost-server/v6/plugin/plugintest/mock"
)

func TestApp_initializeTemplates(t *testing.T) {
	board := &model.Board{
		ID:              utils.NewID(utils.IDTypeBoard),
		TeamID:          globalTeamID,
		Type:            model.BoardTypeOpen,
		Title:           "test board",
		IsTemplate:      true,
		TemplateVersion: defaultTemplateVersion,
	}

	block := model.Block{
		ID:       utils.NewID(utils.IDTypeBlock),
		ParentID: board.ID,
		BoardID:  board.ID,
		Type:     model.TypeText,
		Title:    "test text",
	}

	boardsAndBlocks := &model.BoardsAndBlocks{
		Boards: []*model.Board{board},
		Blocks: []model.Block{block},
	}

	t.Run("Needs template init", func(t *testing.T) {
		th, tearDown := SetupTestHelper(t)
		defer tearDown()

		th.Store.EXPECT().GetTemplateBoards(globalTeamID, "").Return([]*model.Board{}, nil)
		th.Store.EXPECT().RemoveDefaultTemplates([]*model.Board{}).Return(nil)
		th.Store.EXPECT().CreateBoardsAndBlocks(gomock.Any(), gomock.Any()).AnyTimes().Return(boardsAndBlocks, nil)
		th.Store.EXPECT().GetMembersForBoard(board.ID).AnyTimes().Return([]*model.BoardMember{}, nil)

		th.FilesBackend.On("WriteFile", mock.Anything, mock.Anything).Return(int64(1), nil)

		done, err := th.App.initializeTemplates()
		require.NoError(t, err, "initializeTemplates should not error")
		require.True(t, done, "initialization was needed")
	})

	t.Run("Skip template init", func(t *testing.T) {
		th, tearDown := SetupTestHelper(t)
		defer tearDown()

		th.Store.EXPECT().GetTemplateBoards(globalTeamID, "").Return([]*model.Board{board}, nil)

		done, err := th.App.initializeTemplates()
		require.NoError(t, err, "initializeTemplates should not error")
		require.False(t, done, "initialization was not needed")
	})
}
