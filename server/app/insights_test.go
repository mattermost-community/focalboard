package app

import (
	"testing"

	"github.com/mattermost/focalboard/server/model"
	"github.com/stretchr/testify/require"
)

var mockInsightsWorkspaces = []model.UserWorkspace{
	{
		ID:    "mock-user-workspace-id",
		Title: "MockUserWorkspace",
	},
}

var mockTeamInsights = []*model.BoardInsight{
	{
		BoardID: "board-id-1",
	},
	{
		BoardID: "board-id-2",
	},
}

type insightError struct {
	msg string
}

func (ie insightError) Error() string {
	return ie.msg
}

func TestGetTeamBoardsInsights(t *testing.T) {
	th, tearDown := SetupTestHelper(t)
	defer tearDown()

	t.Run("success query", func(t *testing.T) {
		th.Store.EXPECT().GetUserWorkspacesInTeam("user-id", "team-id").Return(mockInsightsWorkspaces, nil)
		th.Store.EXPECT().GetTeamBoardsInsights("10 days", []string{"mock-user-workspace-id"}).Return(mockTeamInsights, nil)
		results, err := th.App.GetTeamBoardsInsights("user-id", "team-id", "10 days")
		require.NoError(t, err)
		require.Len(t, results, 2)
	})

	t.Run("fail query", func(t *testing.T) {
		th.Store.EXPECT().GetUserWorkspacesInTeam("user-id", "team-id").Return(mockInsightsWorkspaces, nil)
		th.Store.EXPECT().GetTeamBoardsInsights("10 days", []string{"mock-user-workspace-id"}).Return(nil, insightError{"board-insight-error"})
		_, err := th.App.GetTeamBoardsInsights("user-id", "team-id", "10 days")
		require.Error(t, err)
		require.ErrorIs(t, err, insightError{"board-insight-error"})
	})
}

func TestGetUserBoardsInsights(t *testing.T) {
	th, tearDown := SetupTestHelper(t)
	defer tearDown()

	t.Run("success query", func(t *testing.T) {
		th.Store.EXPECT().GetUserWorkspacesInTeam("user-id-1", "team-id").Return(mockInsightsWorkspaces, nil)
		th.Store.EXPECT().GetUserBoardsInsights("user-id-1", "10 days", []string{"mock-user-workspace-id"}).Return(mockTeamInsights, nil)
		results, err := th.App.GetUserBoardsInsights("user-id-1", "team-id", "10 days")
		require.NoError(t, err)
		require.Len(t, results, 2)
	})

	t.Run("fail query", func(t *testing.T) {
		th.Store.EXPECT().GetUserWorkspacesInTeam("user-id-1", "team-id").Return(mockInsightsWorkspaces, nil)
		th.Store.EXPECT().GetUserBoardsInsights("user-id-1", "10 days", []string{"mock-user-workspace-id"}).Return(nil, insightError{"board-insight-error"})
		_, err := th.App.GetUserBoardsInsights("user-id-1", "team-id", "10 days")
		require.Error(t, err)
		require.ErrorIs(t, err, insightError{"board-insight-error"})
	})
}
