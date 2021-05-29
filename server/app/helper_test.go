// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
package app

import (
	"testing"

	"github.com/golang/mock/gomock"

	"github.com/mattermost/focalboard/server/auth"
	"github.com/mattermost/focalboard/server/services/config"
	"github.com/mattermost/focalboard/server/services/mlog"
	"github.com/mattermost/focalboard/server/services/store/mockstore"
	"github.com/mattermost/focalboard/server/services/webhook"
	"github.com/mattermost/focalboard/server/ws"

	"github.com/mattermost/mattermost-server/v5/shared/filestore/mocks"
)

type TestHelper struct {
	App   *App
	Store *mockstore.MockStore
}

func SetupTestHelper(t *testing.T) *TestHelper {

	ctrl := gomock.NewController(t)
	defer ctrl.Finish()
	cfg := config.Configuration{}
	store := mockstore.NewMockStore(ctrl)
	auth := auth.New(&cfg, store)
	logger := mlog.NewLogger()
	logger.Configure("", cfg.LoggingEscapedJson)
	sessionToken := "TESTTOKEN"
	wsserver := ws.NewServer(auth, sessionToken, false, logger)
	webhook := webhook.NewClient(&cfg, logger)
	app2 := New(&cfg, store, auth, wsserver, &mocks.FileBackend{}, webhook, logger)

	return &TestHelper{
		App:   app2,
		Store: store,
	}
}
