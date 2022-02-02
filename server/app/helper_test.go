// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
package app

import (
	"testing"

	"github.com/golang/mock/gomock"

	"github.com/mattermost/focalboard/server/auth"
	"github.com/mattermost/focalboard/server/services/config"
	"github.com/mattermost/focalboard/server/services/metrics"
	"github.com/mattermost/focalboard/server/services/store/mockstore"
	"github.com/mattermost/focalboard/server/services/webhook"
	"github.com/mattermost/focalboard/server/ws"

	"github.com/mattermost/mattermost-server/v6/plugin/plugintest/mock"
	"github.com/mattermost/mattermost-server/v6/shared/filestore/mocks"
	"github.com/mattermost/mattermost-server/v6/shared/mlog"
)

type TestHelper struct {
	App    *App
	Store  *mockstore.MockStore
	logger *mlog.Logger
}

func SetupTestHelper(t *testing.T) (*TestHelper, func()) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()
	cfg := config.Configuration{}
	store := mockstore.NewMockStore(ctrl)

	filesMock := &mocks.FileBackend{}

	// called during default template setup for every test
	store.EXPECT().GetDefaultTemplateBlocks().AnyTimes()
	store.EXPECT().RemoveDefaultTemplates(gomock.Any()).AnyTimes()
	store.EXPECT().InsertBlock(gomock.Any(), gomock.Any(), gomock.Any()).AnyTimes()
	filesMock.On("WriteFile", mock.Anything, mock.Anything).Return(mock.Anything, nil)

	auth := auth.New(&cfg, store)
	logger := mlog.CreateConsoleTestLogger(false, mlog.LvlDebug)
	sessionToken := "TESTTOKEN"
	wsserver := ws.NewServer(auth, sessionToken, false, logger)
	webhook := webhook.NewClient(&cfg, logger)
	metricsService := metrics.NewMetrics(metrics.InstanceInfo{})

	appServices := Services{
		Auth:         auth,
		Store:        store,
		FilesBackend: filesMock,
		Webhook:      webhook,
		Metrics:      metricsService,
		Logger:       logger,
	}
	app2 := New(&cfg, wsserver, appServices)

	tearDown := func() {
		if logger != nil {
			_ = logger.Shutdown()
		}
	}

	return &TestHelper{
		App:    app2,
		Store:  store,
		logger: logger,
	}, tearDown
}
