package app

import (
	"testing"

	"github.com/golang/mock/gomock"
	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/services/store"
	"github.com/stretchr/testify/assert"
)

func TestPrepareOnboardingTour(t *testing.T) {
	th, tearDown := SetupTestHelper(t)
	defer tearDown()

	t.Run("base case", func(t *testing.T) {
		welcomeBoard := model.Block{
			ID:    "block_id_1",
			Type:  model.TypeBoard,
			Title: "Welcome to Boards!",
			Fields: map[string]interface{}{
				"isTemplate": true,
			},
		}

		blocks := []model.Block{welcomeBoard}
		th.Store.EXPECT().GetDefaultTemplateBlocks().Return(blocks, nil)

		th.Store.EXPECT().GetSubTree3(
			store.Container{WorkspaceID: "0"},
			"block_id_1",
			gomock.Any(),
		).Return([]model.Block{welcomeBoard}, nil)

		th.Store.EXPECT().InsertBlock(
			store.Container{WorkspaceID: "workspace_id_1"},
			gomock.Any(),
			"user_id_1",
		).Return(nil)

		th.Store.EXPECT().GetBlock(gomock.Any(), "block_id_1").Return(&welcomeBoard, nil)

		th.Store.EXPECT().CreatePrivateWorkspace("user_id_1").Return("workspace_id_1", nil)

		userPropPatch := model.UserPropPatch{
			UpdatedFields: map[string]string{
				KeyOnboardingTourStarted:  "1",
				KeyOnboardingTourStep:     ValueOnboardingFirstStep,
				KeyOnboardingTourCategory: ValueTourCategoryOnboarding,
			},
		}

		th.Store.EXPECT().PatchUserProps("user_id_1", userPropPatch).Return(nil)

		workspaceID, boardID, err := th.App.PrepareOnboardingTour("user_id_1")
		assert.NoError(t, err)
		assert.Equal(t, "workspace_id_1", workspaceID)
		assert.NotEmpty(t, boardID)
	})
}

func TestCreateWelcomeBoard(t *testing.T) {
	th, tearDown := SetupTestHelper(t)
	defer tearDown()

	t.Run("base case", func(t *testing.T) {
		welcomeBoard := model.Block{
			ID:    "block_id_1",
			Type:  model.TypeBoard,
			Title: "Welcome to Boards!",
			Fields: map[string]interface{}{
				"isTemplate": true,
			},
		}

		blocks := []model.Block{welcomeBoard}
		th.Store.EXPECT().GetDefaultTemplateBlocks().Return(blocks, nil)

		th.Store.EXPECT().GetSubTree3(
			store.Container{WorkspaceID: "0"},
			"block_id_1",
			gomock.Any(),
		).Return([]model.Block{welcomeBoard}, nil)

		th.Store.EXPECT().InsertBlock(
			store.Container{WorkspaceID: "workspace_id_1"},
			gomock.Any(),
			"user_id_1",
		).Return(nil)

		th.Store.EXPECT().GetBlock(gomock.Any(), "block_id_1").Return(&welcomeBoard, nil)

		boardID, err := th.App.createWelcomeBoard("user_id_1", "workspace_id_1")
		assert.Nil(t, err)
		assert.NotEmpty(t, boardID)
	})

	t.Run("template doesn't contain a board", func(t *testing.T) {
		welcomeBoard := model.Block{
			ID:    "block_id_1",
			Type:  model.TypeComment,
			Title: "Welcome to Boards!",
		}
		blocks := []model.Block{welcomeBoard}
		th.Store.EXPECT().GetDefaultTemplateBlocks().Return(blocks, nil)

		th.Store.EXPECT().GetSubTree3(
			store.Container{WorkspaceID: "0"},
			"buixxjic3xjfkieees4iafdrznc",
			gomock.Any(),
		).Return([]model.Block{welcomeBoard}, nil)

		th.Store.EXPECT().InsertBlock(
			store.Container{WorkspaceID: "workspace_id_1"},
			gomock.Any(),
			"user_id_1",
		).Return(nil)

		boardID, err := th.App.createWelcomeBoard("user_id_1", "workspace_id_1")
		assert.Error(t, err)
		assert.Empty(t, boardID)
	})

	t.Run("template doesn't contain the welcome board", func(t *testing.T) {
		welcomeBoard := model.Block{
			ID:    "block_id_1",
			Type:  model.TypeBoard,
			Title: "Jean luc Picard",
			Fields: map[string]interface{}{
				"isTemplate": true,
			},
		}

		blocks := []model.Block{welcomeBoard}
		th.Store.EXPECT().GetDefaultTemplateBlocks().Return(blocks, nil)

		th.Store.EXPECT().GetSubTree3(
			store.Container{WorkspaceID: "0"},
			"buixxjic3xjfkieees4iafdrznc",
			gomock.Any(),
		).Return([]model.Block{welcomeBoard}, nil)

		th.Store.EXPECT().InsertBlock(
			store.Container{WorkspaceID: "workspace_id_1"},
			gomock.Any(),
			"user_id_1",
		).Return(nil)

		boardID, err := th.App.createWelcomeBoard("user_id_1", "workspace_id_1")
		assert.Error(t, err)
		assert.Empty(t, boardID)
	})
}

func TestGetOnboardingBoardID(t *testing.T) {
	th, tearDown := SetupTestHelper(t)
	defer tearDown()

	t.Run("base case", func(t *testing.T) {
		board := model.Block{
			ID:    "board_id_1",
			Type:  model.TypeBoard,
			Title: "Welcome to Boards!",
		}

		card := model.Block{
			ID:       "card_id_1",
			Type:     model.TypeCard,
			ParentID: board.ID,
		}

		blocks := []model.Block{
			board,
			card,
		}

		th.Store.EXPECT().GetDefaultTemplateBlocks().Return(blocks, nil)

		onboardingBoardID, err := th.App.getOnboardingBoardID()
		assert.NoError(t, err)
		assert.Equal(t, "board_id_1", onboardingBoardID)
	})

	t.Run("no blocks found", func(t *testing.T) {
		blocks := []model.Block{}

		th.Store.EXPECT().GetDefaultTemplateBlocks().Return(blocks, nil)

		onboardingBoardID, err := th.App.getOnboardingBoardID()
		assert.Error(t, err)
		assert.Empty(t, onboardingBoardID)
	})

	t.Run("onboarding board doesn't exists", func(t *testing.T) {
		board := model.Block{
			ID:    "board_id_1",
			Type:  model.TypeBoard,
			Title: "Some board title",
		}

		card := model.Block{
			ID:       "card_id_1",
			Type:     model.TypeCard,
			ParentID: board.ID,
		}

		blocks := []model.Block{
			board,
			card,
		}

		th.Store.EXPECT().GetDefaultTemplateBlocks().Return(blocks, nil)

		onboardingBoardID, err := th.App.getOnboardingBoardID()
		assert.Error(t, err)
		assert.Empty(t, onboardingBoardID)
	})
}
