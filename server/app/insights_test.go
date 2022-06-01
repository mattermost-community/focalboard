package app

import (
	"testing"

	"github.com/mattermost/focalboard/server/model"
	mmModel "github.com/mattermost/mattermost-server/v6/model"
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

var mockTeamInsightsList = &model.BoardInsightsList{
	InsightsListData: mmModel.InsightsListData{HasNext: false},
	Items:            mockTeamInsights,
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
		th.Store.EXPECT().IsUserGuest("user-id").Return(false, nil)
		fakeLicense := &mmModel.License{Features: &mmModel.Features{}, SkuShortName: mmModel.LicenseShortSkuEnterprise}
		th.Store.EXPECT().GetLicense().Return(fakeLicense)
		th.Store.EXPECT().GetUserWorkspacesInTeam("user-id", "team-id").Return(mockInsightsWorkspaces, nil)
		th.Store.EXPECT().GetTeamBoardsInsights([]string{"mock-user-workspace-id"}, int64(0), 0, 10).Return(mockTeamInsightsList, nil)
		results, err := th.App.GetTeamBoardsInsights("user-id", "team-id", &mmModel.InsightsOpts{StartUnixMilli: 0, Page: 0, PerPage: 10})
		require.NoError(t, err)
		require.Len(t, results.Items, 2)
	})

	t.Run("fail query", func(t *testing.T) {
		th.Store.EXPECT().IsUserGuest("user-id").Return(false, nil)
		fakeLicense := &mmModel.License{Features: &mmModel.Features{}, SkuShortName: mmModel.LicenseShortSkuEnterprise}
		th.Store.EXPECT().GetLicense().Return(fakeLicense)
		th.Store.EXPECT().GetUserWorkspacesInTeam("user-id", "team-id").Return(mockInsightsWorkspaces, nil)
		th.Store.EXPECT().GetTeamBoardsInsights([]string{"mock-user-workspace-id"}, int64(0), 0, 10).Return(nil, insightError{"board-insight-error"})
		_, err := th.App.GetTeamBoardsInsights("user-id", "team-id", &mmModel.InsightsOpts{StartUnixMilli: 0, Page: 0, PerPage: 10})
		require.Error(t, err)
		require.ErrorIs(t, err, insightError{"board-insight-error"})
	})
}

func TestGetUserBoardsInsights(t *testing.T) {
	th, tearDown := SetupTestHelper(t)
	defer tearDown()

	t.Run("success query", func(t *testing.T) {
		th.Store.EXPECT().IsUserGuest("user-id-1").Return(false, nil)
		fakeLicense := &mmModel.License{Features: &mmModel.Features{}, SkuShortName: mmModel.LicenseShortSkuEnterprise}
		th.Store.EXPECT().GetLicense().Return(fakeLicense)
		th.Store.EXPECT().GetUserWorkspacesInTeam("user-id-1", "team-id").Return(mockInsightsWorkspaces, nil)
		th.Store.EXPECT().GetUserBoardsInsights("user-id-1", []string{"mock-user-workspace-id"}, int64(0), 0, 10).Return(mockTeamInsightsList, nil)
		results, err := th.App.GetUserBoardsInsights("user-id-1", "team-id", &mmModel.InsightsOpts{StartUnixMilli: 0, Page: 0, PerPage: 10})
		require.NoError(t, err)
		require.Len(t, results.Items, 2)
	})

	t.Run("fail query", func(t *testing.T) {
		th.Store.EXPECT().IsUserGuest("user-id-1").Return(false, nil)
		fakeLicense := &mmModel.License{Features: &mmModel.Features{}, SkuShortName: mmModel.LicenseShortSkuEnterprise}
		th.Store.EXPECT().GetLicense().Return(fakeLicense)
		th.Store.EXPECT().GetUserWorkspacesInTeam("user-id-1", "team-id").Return(mockInsightsWorkspaces, nil)
		th.Store.EXPECT().GetUserBoardsInsights("user-id-1", []string{"mock-user-workspace-id"}, int64(0), 0, 10).Return(nil, insightError{"board-insight-error"})
		_, err := th.App.GetUserBoardsInsights("user-id-1", "team-id", &mmModel.InsightsOpts{StartUnixMilli: 0, Page: 0, PerPage: 10})
		require.Error(t, err)
		require.ErrorIs(t, err, insightError{"board-insight-error"})
	})
}
