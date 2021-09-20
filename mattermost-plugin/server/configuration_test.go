package main

import (
	"errors"
	"testing"

	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/ws"
	"github.com/mattermost/mattermost-server/v6/plugin/plugintest"
	"github.com/mattermost/mattermost-server/v6/plugin/plugintest/mock"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

var errLoadPluginConfiguration = errors.New("loadPluginConfiguration Error")

func TestConfiguration(t *testing.T) {
	t.Run("null configuration", func(t *testing.T) {
		plugin := &Plugin{}
		assert.NotNil(t, plugin.getConfiguration())
	})

	t.Run("changing configuration", func(t *testing.T) {
		plugin := &Plugin{}

		configuration1 := &configuration{EnablePublicSharedBoards: false}
		plugin.setConfiguration(configuration1)
		assert.Equal(t, configuration1, plugin.getConfiguration())

		configuration2 := &configuration{EnablePublicSharedBoards: true}
		plugin.setConfiguration(configuration2)
		assert.Equal(t, configuration2, plugin.getConfiguration())
		assert.NotEqual(t, configuration1, plugin.getConfiguration())
		assert.False(t, plugin.getConfiguration() == configuration1)
		assert.True(t, plugin.getConfiguration() == configuration2)
	})

	t.Run("setting same configuration", func(t *testing.T) {
		plugin := &Plugin{}

		configuration1 := &configuration{}
		plugin.setConfiguration(configuration1)
		assert.Panics(t, func() {
			plugin.setConfiguration(configuration1)
		})
	})

	t.Run("clearing configuration", func(t *testing.T) {
		plugin := &Plugin{}

		configuration1 := &configuration{EnablePublicSharedBoards: true}
		plugin.setConfiguration(configuration1)
		assert.NotPanics(t, func() {
			plugin.setConfiguration(nil)
		})
		assert.NotNil(t, plugin.getConfiguration())
		assert.NotEqual(t, configuration1, plugin.getConfiguration())
	})
}

func TestOnConfigurationChange(t *testing.T) {
	t.Run("Test LoadPlugin Error", func(t *testing.T) {
		api := &plugintest.API{}
		api.On("LoadPluginConfiguration",
			mock.Anything).Return(func(dest interface{}) error {
			return errLoadPluginConfiguration
		})

		p := Plugin{}
		p.SetAPI(api)
		p.wsPluginAdapter = &ws.PluginAdapter{}

		err := p.OnConfigurationChange()
		assert.Error(t, err)
	})

	t.Run("Test Load Plugin Success", func(t *testing.T) {
		api := &plugintest.API{}
		api.On("LoadPluginConfiguration", mock.AnythingOfType("**main.configuration")).Return(nil)

		p := Plugin{}
		p.SetAPI(api)
		p.wsPluginAdapter = &FakePluginAdapter{}

		err := p.OnConfigurationChange()
		require.NoError(t, err)
		assert.Equal(t, 1, count)
	})
}

var count = 0

type FakePluginAdapter struct {
	ws.PluginAdapter
}

func (c *FakePluginAdapter) BroadcastConfigChange(clientConfig model.ClientConfig) {
	count++
}
