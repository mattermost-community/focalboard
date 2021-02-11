package app

import (
	"errors"
	"testing"

	"github.com/golang/mock/gomock"
	"github.com/mattermost/focalboard/server/auth"
	"github.com/mattermost/focalboard/server/services/config"
	"github.com/mattermost/focalboard/server/services/store/mockstore"
	"github.com/mattermost/focalboard/server/services/webhook"
	"github.com/mattermost/focalboard/server/ws"
	"github.com/mattermost/mattermost-server/v5/services/filesstore/mocks"
	"github.com/stretchr/testify/require"
)

func TestGetParentID(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()
	cfg := config.Configuration{}
	store := mockstore.NewMockStore(ctrl)
	auth := auth.New(&cfg, store)
	sessionToken := "TESTTOKEN"
	wsserver := ws.NewServer(auth, sessionToken)
	webhook := webhook.NewClient(&cfg)
	app := New(&cfg, store, auth, wsserver, &mocks.FileBackend{}, webhook)

	t.Run("success query", func(t *testing.T) {
		store.EXPECT().GetParentID(gomock.Eq("test-id")).Return("test-parent-id", nil)
		result, err := app.GetParentID("test-id")
		require.NoError(t, err)
		require.Equal(t, "test-parent-id", result)
	})

	t.Run("fail query", func(t *testing.T) {
		store.EXPECT().GetParentID(gomock.Eq("test-id")).Return("", errors.New("block-not-found"))
		_, err := app.GetParentID("test-id")
		require.Error(t, err)
		require.Equal(t, "block-not-found", err.Error())
	})
}
