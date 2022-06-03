// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package main

import (
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/mattermost/mattermost-server/v6/model"
	"github.com/stretchr/testify/assert"
)

func TestServeHTTP(t *testing.T) {
	th, tearDown := SetupTestHelper(t)
	defer tearDown()

	assert := assert.New(t)
	plugin := Plugin{
		server: th.Server,
	}
	w := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodGet, "/hello", nil)

	plugin.ServeHTTP(nil, w, r)

	result := w.Result()
	assert.NotNil(result)
	defer result.Body.Close()
	bodyBytes, err := ioutil.ReadAll(result.Body)
	assert.Nil(err)
	bodyString := string(bodyBytes)

	assert.Equal("Hello", bodyString)
}

func TestSetConfiguration(t *testing.T) {
	th, tearDown := SetupTestHelper(t)
	defer tearDown()

	plugin := Plugin{
		server: th.Server,
	}
	boolTrue := true
	stringRef := ""

	baseFeatureFlags := &model.FeatureFlags{}
	basePluginSettings := &model.PluginSettings{
		Directory: &stringRef,
	}
	driverName := "testDriver"
	dataSource := "testDirectory"
	baseSQLSettings := &model.SqlSettings{
		DriverName: &driverName,
		DataSource: &dataSource,
	}

	directory := "testDirectory"
	baseFileSettings := &model.FileSettings{
		DriverName:  &driverName,
		Directory:   &directory,
		MaxFileSize: model.NewInt64(1024 * 1024),
	}

	days := 365
	baseDataRetentionSettings := &model.DataRetentionSettings{
		BoardsRetentionDays: &days,
	}

	baseConfig := &model.Config{
		FeatureFlags:          baseFeatureFlags,
		PluginSettings:        *basePluginSettings,
		SqlSettings:           *baseSQLSettings,
		FileSettings:          *baseFileSettings,
		DataRetentionSettings: *baseDataRetentionSettings,
	}

	t.Run("test enable telemetry", func(t *testing.T) {
		logSettings := &model.LogSettings{
			EnableDiagnostics: &boolTrue,
		}
		mmConfig := baseConfig
		mmConfig.LogSettings = *logSettings

		config := plugin.createBoardsConfig(*mmConfig, "", "testId")
		assert.Equal(t, true, config.Telemetry)
		assert.Equal(t, "testId", config.TelemetryID)
	})

	t.Run("test enable shared boards", func(t *testing.T) {
		mmConfig := baseConfig
		mmConfig.PluginSettings.Plugins = make(map[string]map[string]interface{})
		mmConfig.PluginSettings.Plugins[pluginName] = make(map[string]interface{})
		mmConfig.PluginSettings.Plugins[pluginName][sharedBoardsName] = true
		config := plugin.createBoardsConfig(*mmConfig, "", "")
		assert.Equal(t, true, config.EnablePublicSharedBoards)
	})

	t.Run("test boards feature flags", func(t *testing.T) {
		featureFlags := &model.FeatureFlags{
			TestFeature:        "test",
			TestBoolFeature:    boolTrue,
			BoardsFeatureFlags: "hello_world-myTest",
		}

		mmConfig := baseConfig
		mmConfig.FeatureFlags = featureFlags

		config := plugin.createBoardsConfig(*mmConfig, "", "")
		assert.Equal(t, "true", config.FeatureFlags["TestBoolFeature"])
		assert.Equal(t, "test", config.FeatureFlags["TestFeature"])

		assert.Equal(t, "true", config.FeatureFlags["hello_world"])
		assert.Equal(t, "true", config.FeatureFlags["myTest"])
	})
}
