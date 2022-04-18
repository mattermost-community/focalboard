// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package main

import (
	"testing"

	"github.com/golang/mock/gomock"
	"github.com/mattermost/focalboard/server/server"
	"github.com/mattermost/focalboard/server/services/config"
	"github.com/mattermost/focalboard/server/services/permissions/localpermissions"
	"github.com/mattermost/focalboard/server/services/store/mockstore"
	"github.com/mattermost/mattermost-server/v6/shared/mlog"
)

type TestHelper struct {
	Server *server.Server
	Store  *mockstore.MockStore
}

func SetupTestHelper(t *testing.T) *TestHelper {
	th := &TestHelper{}

	ctrl := gomock.NewController(t)
	defer ctrl.Finish()
	mockStore := mockstore.NewMockStore(ctrl)

	th.Server = newTestServer(t, mockStore)
	th.Store = mockStore

	return th
}

func newTestServer(t *testing.T, mockStore *mockstore.MockStore) *server.Server {
	config := &config.Configuration{
		EnableDataRetention: false,
		DataRetentionDays:   10,
		FilesDriver:         "local",
		FilesPath:           "./files",
		WebPath:             "/",
	}

	logger, err := mlog.NewLogger()
	if err = logger.Configure("", config.LoggingCfgJSON, nil); err != nil {
		panic(err)
	}

	mockStore.EXPECT().GetTeam(gomock.Any()).Return(nil, nil).AnyTimes()
	mockStore.EXPECT().UpsertTeamSignupToken(gomock.Any()).AnyTimes()
	mockStore.EXPECT().GetSystemSettings().AnyTimes()
	mockStore.EXPECT().SetSystemSetting(gomock.Any(), gomock.Any()).AnyTimes()

	permissionsService := localpermissions.New(mockStore, logger)

	srv, err := server.New(server.Params{
		Cfg:                config,
		DBStore:            mockStore,
		Logger:             logger,
		PermissionsService: permissionsService,
		SkipTemplateInit:   true,
	})
	if err != nil {
		panic(err)
	}

	return srv
}
