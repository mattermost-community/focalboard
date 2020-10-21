package app

import (
	"errors"
	"testing"

	"github.com/golang/mock/gomock"
	"github.com/mattermost/mattermost-octo-tasks/server/services/config"
	"github.com/mattermost/mattermost-octo-tasks/server/services/store/mockstore"
	"github.com/mattermost/mattermost-octo-tasks/server/ws"
	"github.com/mattermost/mattermost-server/v5/services/filesstore/mocks"
	"github.com/stretchr/testify/require"
)

func TestGetParentID(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()
	store := mockstore.NewMockStore(ctrl)
	wsserver := ws.NewWSServer()
	app := New(&config.Configuration{}, store, wsserver, &mocks.FileBackend{})
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
