package app

import (
	"testing"

	"github.com/mattermost/focalboard/server/model"
	"github.com/stretchr/testify/assert"
)

const (
	testTeamID = "team_id"
)

func TestPrepareOnboardingTour(t *testing.T) {
	th, tearDown := SetupTestHelper(t)
	defer tearDown()

	t.Run("base case", func(t *testing.T) {
		teamID := testTeamID
		userID := "user_id_1"
		welcomeBoard := model.Board{
			ID:         "board_id_1",
			Title:      "Welcome to Boards!",
			TeamID:     "0",
			IsTemplate: true,
		}

		th.Store.EXPECT().GetTemplateBoards("0", "").Return([]*model.Board{&welcomeBoard}, nil)
		th.Store.EXPECT().DuplicateBoard(welcomeBoard.ID, userID, teamID, false).Return(&model.BoardsAndBlocks{Boards: []*model.Board{&welcomeBoard}},
			nil, nil)
		th.Store.EXPECT().GetMembersForBoard(welcomeBoard.ID).Return([]*model.BoardMember{}, nil).Times(2)
		th.Store.EXPECT().GetBoard(welcomeBoard.ID).Return(&welcomeBoard, nil).AnyTimes()

		privateWelcomeBoard := model.Board{
			ID:         "board_id_1",
			Title:      "Welcome to Boards!",
			TeamID:     "0",
			IsTemplate: true,
			Type:       model.BoardTypePrivate,
		}
		newType := model.BoardTypePrivate
		th.Store.EXPECT().PatchBoard("board_id_1", &model.BoardPatch{Type: &newType}, "user_id_1").Return(&privateWelcomeBoard, nil)

		userPropPatch := model.UserPropPatch{
			UpdatedFields: map[string]string{
				KeyOnboardingTourStarted:  "1",
				KeyOnboardingTourStep:     ValueOnboardingFirstStep,
				KeyOnboardingTourCategory: ValueTourCategoryOnboarding,
			},
		}

		th.Store.EXPECT().PatchUserProps(userID, userPropPatch).Return(nil)

		teamID, boardID, err := th.App.PrepareOnboardingTour(userID, teamID)
		assert.NoError(t, err)
		assert.Equal(t, testTeamID, teamID)
		assert.NotEmpty(t, boardID)
	})
}

func TestCreateWelcomeBoard(t *testing.T) {
	th, tearDown := SetupTestHelper(t)
	defer tearDown()

	t.Run("base case", func(t *testing.T) {
		teamID := testTeamID
		userID := "user_id_1"
		welcomeBoard := model.Board{
			ID:         "board_id_1",
			Title:      "Welcome to Boards!",
			TeamID:     "0",
			IsTemplate: true,
		}
		th.Store.EXPECT().GetTemplateBoards("0", "").Return([]*model.Board{&welcomeBoard}, nil)
		th.Store.EXPECT().DuplicateBoard(welcomeBoard.ID, userID, teamID, false).
			Return(&model.BoardsAndBlocks{Boards: []*model.Board{&welcomeBoard}}, nil, nil)
		th.Store.EXPECT().GetMembersForBoard(welcomeBoard.ID).Return([]*model.BoardMember{}, nil).Times(2)
		th.Store.EXPECT().GetBoard(welcomeBoard.ID).Return(&welcomeBoard, nil).AnyTimes()

		privateWelcomeBoard := model.Board{
			ID:         "board_id_1",
			Title:      "Welcome to Boards!",
			TeamID:     "0",
			IsTemplate: true,
			Type:       model.BoardTypePrivate,
		}
		newType := model.BoardTypePrivate
		th.Store.EXPECT().PatchBoard("board_id_1", &model.BoardPatch{Type: &newType}, "user_id_1").Return(&privateWelcomeBoard, nil)

		boardID, err := th.App.createWelcomeBoard(userID, teamID)
		assert.Nil(t, err)
		assert.NotEmpty(t, boardID)
	})

	t.Run("template doesn't contain a board", func(t *testing.T) {
		teamID := testTeamID
		th.Store.EXPECT().GetTemplateBoards("0", "").Return([]*model.Board{}, nil)
		boardID, err := th.App.createWelcomeBoard("user_id_1", teamID)
		assert.Error(t, err)
		assert.Empty(t, boardID)
	})

	t.Run("template doesn't contain the welcome board", func(t *testing.T) {
		teamID := testTeamID
		welcomeBoard := model.Board{
			ID:         "board_id_1",
			Title:      "Other template",
			TeamID:     teamID,
			IsTemplate: true,
		}
		th.Store.EXPECT().GetTemplateBoards("0", "").Return([]*model.Board{&welcomeBoard}, nil)
		boardID, err := th.App.createWelcomeBoard("user_id_1", "workspace_id_1")
		assert.Error(t, err)
		assert.Empty(t, boardID)
	})
}

func TestGetOnboardingBoardID(t *testing.T) {
	th, tearDown := SetupTestHelper(t)
	defer tearDown()

	t.Run("base case", func(t *testing.T) {
		welcomeBoard := model.Board{
			ID:         "board_id_1",
			Title:      "Welcome to Boards!",
			TeamID:     "0",
			IsTemplate: true,
		}
		th.Store.EXPECT().GetTemplateBoards("0", "").Return([]*model.Board{&welcomeBoard}, nil)

		onboardingBoardID, err := th.App.getOnboardingBoardID()
		assert.NoError(t, err)
		assert.Equal(t, "board_id_1", onboardingBoardID)
	})

	t.Run("no blocks found", func(t *testing.T) {
		th.Store.EXPECT().GetTemplateBoards("0", "").Return([]*model.Board{}, nil)

		onboardingBoardID, err := th.App.getOnboardingBoardID()
		assert.Error(t, err)
		assert.Empty(t, onboardingBoardID)
	})

	t.Run("onboarding board doesn't exists", func(t *testing.T) {
		welcomeBoard := model.Board{
			ID:         "board_id_1",
			Title:      "Other template",
			TeamID:     "0",
			IsTemplate: true,
		}
		th.Store.EXPECT().GetTemplateBoards("0", "").Return([]*model.Board{&welcomeBoard}, nil)

		onboardingBoardID, err := th.App.getOnboardingBoardID()
		assert.Error(t, err)
		assert.Empty(t, onboardingBoardID)
	})
}
