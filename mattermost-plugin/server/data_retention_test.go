// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package main

import (
	"testing"
	"time"

	"github.com/golang/mock/gomock"
	"github.com/mattermost/focalboard/server/server"
	"github.com/mattermost/focalboard/server/services/config"
	"github.com/mattermost/focalboard/server/services/permissions/localpermissions"
	"github.com/mattermost/focalboard/server/services/store/mockstore"
	"github.com/mattermost/mattermost-server/v6/model"
	"github.com/mattermost/mattermost-server/v6/shared/mlog"
	"github.com/stretchr/testify/assert"
)

type TestHelperMockStore struct {
	Server *server.Server
	Store  *mockstore.MockStore
}

func SetupTestHelperMockStore(t *testing.T) *TestHelperMockStore {
	th := &TestHelperMockStore{}

	ctrl := gomock.NewController(t)
	defer ctrl.Finish()
	mockStore := mockstore.NewMockStore(ctrl)

	th.Server = newTestServerMock(mockStore)
	th.Store = mockStore

	return th
}

func newTestServerMock(mockStore *mockstore.MockStore) *server.Server {
	config := &config.Configuration{
		EnableDataRetention: false,
		DataRetentionDays:   10,
		FilesDriver:         "local",
		FilesPath:           "./files",
		WebPath:             "/",
	}

	logger := mlog.CreateConsoleTestLogger(true, mlog.LvlDebug)

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
	})
	if err != nil {
		panic(err)
	}

	return srv
}

func TestRunDataRetention(t *testing.T) {
	th := SetupTestHelperMockStore(t)
	plugin := Plugin{}
	plugin.server = th.Server

	now := time.Now().UnixNano()

	t.Run("test null license", func(t *testing.T) {
		th.Store.EXPECT().GetLicense().Return(nil)
		_, err := plugin.RunDataRetention(now, 10)
		assert.NotNil(t, err)
		assert.Equal(t, ErrInsufficientLicense, err)
	})

	t.Run("test invalid license", func(t *testing.T) {
		falseValue := false

		th.Store.EXPECT().GetLicense().Return(
			&model.License{
				Features: &model.Features{
					DataRetention: &falseValue,
				},
			},
		)
		_, err := plugin.RunDataRetention(now, 10)
		assert.NotNil(t, err)
		assert.Equal(t, ErrInsufficientLicense, err)
	})

	t.Run("test valid license, invalid config", func(t *testing.T) {
		trueValue := true
		th.Store.EXPECT().GetLicense().Return(
			&model.License{
				Features: &model.Features{
					DataRetention: &trueValue,
				},
			})

		count, err := plugin.RunDataRetention(now, 10)
		assert.Nil(t, err)
		assert.Equal(t, int64(0), count)
	})

	t.Run("test valid license, valid config", func(t *testing.T) {
		trueValue := true
		th.Store.EXPECT().GetLicense().Return(
			&model.License{
				Features: &model.Features{
					DataRetention: &trueValue,
				},
			})

		th.Store.EXPECT().RunDataRetention(gomock.Any(), int64(10)).Return(int64(100), nil)
		plugin.server.Config().EnableDataRetention = true

		count, err := plugin.RunDataRetention(now, 10)

		assert.Nil(t, err)
		assert.Equal(t, int64(100), count)
	})
}
