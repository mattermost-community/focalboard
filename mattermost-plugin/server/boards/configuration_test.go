// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package boards

import (
	"testing"

	"github.com/golang/mock/gomock"
	"github.com/mattermost/focalboard/server/integrationtests"
	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/server"
	"github.com/mattermost/focalboard/server/ws"

	mockservicesapi "github.com/mattermost/focalboard/server/model/mocks"

	serverModel "github.com/mattermost/mattermost-server/v6/model"
	"github.com/mattermost/mattermost-server/v6/shared/mlog"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

type TestHelper struct {
	Server *server.Server
}

func SetupTestHelper(t *testing.T) (*TestHelper, func()) {
	th := &TestHelper{}
	th.Server = newTestServer()

	err := th.Server.Start()
	require.NoError(t, err, "Server start should not error")

	tearDown := func() {
		err := th.Server.Shutdown()
		require.NoError(t, err, "Server shutdown should not error")
	}
	return th, tearDown
}

func newTestServer() *server.Server {
	return integrationtests.NewTestServerPluginMode()
}
func TestConfigurationNullConfiguration(t *testing.T) {
	boardsApp := &BoardsApp{}
	assert.NotNil(t, boardsApp.getConfiguration())
}

func TestOnConfigurationChange(t *testing.T) {
	stringRef := ""

	basePlugins := make(map[string]map[string]interface{})
	basePlugins[PluginName] = make(map[string]interface{})
	basePlugins[PluginName][SharedBoardsName] = true

	baseFeatureFlags := &serverModel.FeatureFlags{
		BoardsFeatureFlags: "Feature1-Feature2",
	}
	basePluginSettings := &serverModel.PluginSettings{
		Directory: &stringRef,
		Plugins:   basePlugins,
	}
	intRef := 365
	baseDataRetentionSettings := &serverModel.DataRetentionSettings{
		BoardsRetentionDays: &intRef,
	}
	usernameRef := "username"
	baseTeamSettings := &serverModel.TeamSettings{
		TeammateNameDisplay: &usernameRef,
	}

	falseRef := false
	basePrivacySettings := &serverModel.PrivacySettings{
		ShowEmailAddress: &falseRef,
		ShowFullName:     &falseRef,
	}

	baseConfig := &serverModel.Config{
		FeatureFlags:          baseFeatureFlags,
		PluginSettings:        *basePluginSettings,
		DataRetentionSettings: *baseDataRetentionSettings,
		TeamSettings:          *baseTeamSettings,
		PrivacySettings:       *basePrivacySettings,
	}

	t.Run("Test Load Plugin Success", func(t *testing.T) {
		th, tearDown := SetupTestHelper(t)
		defer tearDown()

		ctrl := gomock.NewController(t)
		api := mockservicesapi.NewMockServicesAPI(ctrl)
		api.EXPECT().GetConfig().Return(baseConfig)

		b := &BoardsApp{
			server:          th.Server,
			wsPluginAdapter: &FakePluginAdapter{},
			servicesAPI:     api,
			logger:          mlog.CreateConsoleTestLogger(true, mlog.LvlError),
		}

		err := b.OnConfigurationChange()
		assert.NoError(t, err)
		assert.Equal(t, 1, count)

		// make sure both App and Server got updated
		assert.True(t, b.server.Config().EnablePublicSharedBoards)
		assert.True(t, b.server.App().GetClientConfig().EnablePublicSharedBoards)

		assert.Equal(t, "true", b.server.Config().FeatureFlags["Feature1"])
		assert.Equal(t, "true", b.server.Config().FeatureFlags["Feature2"])
		assert.Equal(t, "", b.server.Config().FeatureFlags["Feature3"])
	})
}

var count = 0

type FakePluginAdapter struct {
	ws.PluginAdapter
}

func (c *FakePluginAdapter) BroadcastConfigChange(clientConfig model.ClientConfig) {
	count++
}
