// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package main

import (
	"testing"

	"github.com/mattermost/focalboard/server/integrationtests"
	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/server"
	"github.com/mattermost/focalboard/server/ws"

	serverModel "github.com/mattermost/mattermost-server/v6/model"
	"github.com/mattermost/mattermost-server/v6/plugin/plugintest"

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
	plugin := &Plugin{}
	assert.NotNil(t, plugin.getConfiguration())
}

func TestOnConfigurationChange(t *testing.T) {
	stringRef := ""

	basePlugins := make(map[string]map[string]interface{})
	basePlugins[pluginName] = make(map[string]interface{})
	basePlugins[pluginName][sharedBoardsName] = true

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

	baseConfig := &serverModel.Config{
		FeatureFlags:          baseFeatureFlags,
		PluginSettings:        *basePluginSettings,
		DataRetentionSettings: *baseDataRetentionSettings,
	}

	t.Run("Test Load Plugin Success", func(t *testing.T) {
		th, tearDown := SetupTestHelper(t)
		defer tearDown()
		api := &plugintest.API{}
		api.On("GetUnsanitizedConfig").Return(baseConfig)
		api.On("GetConfig").Return(baseConfig)

		p := Plugin{}
		p.SetAPI(api)
		p.server = th.Server
		p.wsPluginAdapter = &FakePluginAdapter{}

		err := p.OnConfigurationChange()
		assert.NoError(t, err)
		assert.Equal(t, 1, count)

		// make sure both App and Server got updated
		assert.True(t, p.server.Config().EnablePublicSharedBoards)
		assert.True(t, p.server.App().GetClientConfig().EnablePublicSharedBoards)

		assert.Equal(t, "true", p.server.Config().FeatureFlags["Feature1"])
		assert.Equal(t, "true", p.server.Config().FeatureFlags["Feature2"])
		assert.Equal(t, "", p.server.Config().FeatureFlags["Feature3"])
	})
}

var count = 0

type FakePluginAdapter struct {
	ws.PluginAdapter
}

func (c *FakePluginAdapter) BroadcastConfigChange(clientConfig model.ClientConfig) {
	count++
}
