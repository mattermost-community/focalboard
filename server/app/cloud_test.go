package app

import (
	"testing"

	"github.com/golang/mock/gomock"
	mmModel "github.com/mattermost/mattermost-server/v6/model"
	"github.com/mattermost/mattermost-server/v6/plugin/plugintest"
	"github.com/stretchr/testify/assert"
)

func TestCloud(t *testing.T) {
	th, tearDown := SetupTestHelper(t)
	defer tearDown()

	t.Run("should send message", func(t *testing.T) {
		pluginAPI := &plugintest.API{}

		sysAdmin1 := &mmModel.User{
			Id:       "michael-scott",
			Username: "Michael Scott",
		}

		sysAdmin2 := &mmModel.User{
			Id:       "dwight-schrute",
			Username: "Dwight Schrute",
		}

		getUsersOptionsPage0 := &mmModel.UserGetOptions{
			Active:  true,
			Role:    mmModel.SystemAdminRoleId,
			PerPage: 50,
			Page:    0,
		}
		pluginAPI.On("GetUsers", getUsersOptionsPage0).Return([]*mmModel.User{sysAdmin1, sysAdmin2}, nil).Once()

		getUsersOptionsPage1 := &mmModel.UserGetOptions{
			Active:  true,
			Role:    mmModel.SystemAdminRoleId,
			PerPage: 50,
			Page:    1,
		}
		pluginAPI.On("GetUsers", getUsersOptionsPage1).Return([]*mmModel.User{}, nil).Once()

		th.App.pluginAPI = pluginAPI

		team := &mmModel.Team{
			DisplayName: "Dunder Mifflin",
		}

		th.Store.EXPECT().GetWorkspaceTeam("team-id-1").Return(team, nil)
		th.Store.EXPECT().SendMessage(gomock.Any(), "custom_cloud_upgrade_nudge", gomock.Any()).Return(nil).Times(1)

		err := th.App.NotifyPortalAdminsUpgradeRequest("team-id-1")
		assert.NoError(t, err)
	})

	t.Run("no sys admins found", func(t *testing.T) {
		pluginAPI := &plugintest.API{}

		getUsersOptionsPage0 := &mmModel.UserGetOptions{
			Active:  true,
			Role:    mmModel.SystemAdminRoleId,
			PerPage: 50,
			Page:    0,
		}
		pluginAPI.On("GetUsers", getUsersOptionsPage0).Return([]*mmModel.User{}, nil).Once()

		th.App.pluginAPI = pluginAPI

		team := &mmModel.Team{
			DisplayName: "Dunder Mifflin",
		}

		th.Store.EXPECT().GetWorkspaceTeam("team-id-1").Return(team, nil)

		err := th.App.NotifyPortalAdminsUpgradeRequest("team-id-1")
		assert.NoError(t, err)
	})

	t.Run("iterate multiple pages", func(t *testing.T) {
		pluginAPI := &plugintest.API{}

		sysAdmin1 := &mmModel.User{
			Id:       "michael-scott",
			Username: "Michael Scott",
		}

		sysAdmin2 := &mmModel.User{
			Id:       "dwight-schrute",
			Username: "Dwight Schrute",
		}

		getUsersOptionsPage0 := &mmModel.UserGetOptions{
			Active:  true,
			Role:    mmModel.SystemAdminRoleId,
			PerPage: 50,
			Page:    0,
		}
		pluginAPI.On("GetUsers", getUsersOptionsPage0).Return([]*mmModel.User{sysAdmin1}, nil).Once()

		getUsersOptionsPage1 := &mmModel.UserGetOptions{
			Active:  true,
			Role:    mmModel.SystemAdminRoleId,
			PerPage: 50,
			Page:    1,
		}
		pluginAPI.On("GetUsers", getUsersOptionsPage1).Return([]*mmModel.User{sysAdmin2}, nil).Once()

		getUsersOptionsPage2 := &mmModel.UserGetOptions{
			Active:  true,
			Role:    mmModel.SystemAdminRoleId,
			PerPage: 50,
			Page:    2,
		}
		pluginAPI.On("GetUsers", getUsersOptionsPage2).Return([]*mmModel.User{}, nil).Once()

		th.App.pluginAPI = pluginAPI

		team := &mmModel.Team{
			DisplayName: "Dunder Mifflin",
		}

		th.Store.EXPECT().GetWorkspaceTeam("team-id-1").Return(team, nil)
		th.Store.EXPECT().SendMessage(gomock.Any(), "custom_cloud_upgrade_nudge", gomock.Any()).Return(nil).Times(2)

		err := th.App.NotifyPortalAdminsUpgradeRequest("team-id-1")
		assert.NoError(t, err)
	})
}
