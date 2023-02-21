// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package server

import (
	"testing"

	"github.com/golang/mock/gomock"
	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/ws"

	mockservicesapi "github.com/mattermost/focalboard/server/model/mocks"
	server_util "github.com/mattermost/focalboard/server/server/util"

	mm_model "github.com/mattermost/mattermost-server/v6/model"
	"github.com/mattermost/mattermost-server/v6/shared/mlog"

	"github.com/stretchr/testify/assert"
)

func TestConfigurationNullConfiguration(t *testing.T) {
	boardsApp := &BoardsService{}
	assert.NotNil(t, boardsApp.getConfiguration())
}

func TestOnConfigurationChange(t *testing.T) {
	stringRef := ""

	basePlugins := make(map[string]map[string]interface{})
	basePlugins[PluginName] = make(map[string]interface{})
	basePlugins[PluginName][SharedBoardsName] = true

	baseFeatureFlags := &mm_model.FeatureFlags{
		BoardsFeatureFlags: "Feature1-Feature2",
	}
	basePluginSettings := &mm_model.PluginSettings{
		Directory: &stringRef,
		Plugins:   basePlugins,
	}
	intRef := 365
	baseDataRetentionSettings := &mm_model.DataRetentionSettings{
		BoardsRetentionDays: &intRef,
	}
	usernameRef := "username"
	baseTeamSettings := &mm_model.TeamSettings{
		TeammateNameDisplay: &usernameRef,
	}

	falseRef := false
	basePrivacySettings := &mm_model.PrivacySettings{
		ShowEmailAddress: &falseRef,
		ShowFullName:     &falseRef,
	}

	baseConfig := &mm_model.Config{
		FeatureFlags:          baseFeatureFlags,
		PluginSettings:        *basePluginSettings,
		DataRetentionSettings: *baseDataRetentionSettings,
		TeamSettings:          *baseTeamSettings,
		PrivacySettings:       *basePrivacySettings,
	}

	t.Run("Test Load Plugin Success", func(t *testing.T) {
		th, tearDown := server_util.SetupTestHelper(t)
		defer tearDown()

		ctrl := gomock.NewController(t)
		api := mockservicesapi.NewMockServicesAPI(ctrl)
		api.EXPECT().GetConfig().Return(baseConfig)

		b := &BoardsService{
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
