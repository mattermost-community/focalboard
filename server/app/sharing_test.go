package app

import (
	"database/sql"
	"testing"
	"time"

	"github.com/golang/mock/gomock"
	"github.com/google/uuid"
	"github.com/mattermost/focalboard/server/auth"
	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/services/config"
	st "github.com/mattermost/focalboard/server/services/store"
	"github.com/mattermost/focalboard/server/services/store/mockstore"
	"github.com/mattermost/focalboard/server/services/webhook"
	"github.com/mattermost/focalboard/server/ws"
	"github.com/mattermost/mattermost-server/v5/services/filesstore/mocks"
	"github.com/pkg/errors"
	"github.com/stretchr/testify/require"
)

func TestGetSharing(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()
	cfg := config.Configuration{}
	store := mockstore.NewMockStore(ctrl)
	auth := auth.New(&cfg, store)
	sessionToken := "TESTTOKEN"
	wsserver := ws.NewServer(auth, sessionToken)
	webhook := webhook.NewClient(&cfg)
	app := New(&cfg, store, auth, wsserver, &mocks.FileBackend{}, webhook)

	container := st.Container{
		WorkspaceID: "0",
	}

	t.Run("should get a sharing sucessfully", func(t *testing.T) {
		want := &model.Sharing{
			ID:         "id",
			Enabled:    true,
			Token:      "token",
			ModifiedBy: "otherid",
			UpdateAt:   time.Now().Unix(),
		}
		store.EXPECT().GetSharing(gomock.Eq(container), gomock.Eq("test-id")).Return(want, nil)

		result, err := app.GetSharing(container, "test-id")
		require.NoError(t, err)

		require.Equal(t, result, want)
		require.NotNil(t, app)
	})

	t.Run("should fail to get a sharing", func(t *testing.T) {
		store.EXPECT().GetSharing(gomock.Eq(container), gomock.Eq("test-id")).Return(
			nil,
			errors.New("sharing not found"),
		)
		result, err := app.GetSharing(container, "test-id")

		require.Nil(t, result)
		require.Error(t, err)
		require.Equal(t, "sharing not found", err.Error())
	})

	t.Run("should return a tuple of nil", func(t *testing.T) {
		store.EXPECT().GetSharing(gomock.Eq(container), gomock.Eq("test-id")).Return(
			nil,
			sql.ErrNoRows,
		)
		result, err := app.GetSharing(container, "test-id")

		require.Nil(t, result)
		require.NoError(t, err)
	})
}

func TestUpsertSharing(t *testing.T) {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()
	cfg := config.Configuration{}
	store := mockstore.NewMockStore(ctrl)
	auth := auth.New(&cfg, store)
	sessionToken := "TESTTOKEN"
	wsserver := ws.NewServer(auth, sessionToken)
	webhook := webhook.NewClient(&cfg)
	app := New(&cfg, store, auth, wsserver, &mocks.FileBackend{}, webhook)

	container := st.Container{
		WorkspaceID: "0",
	}
	sharing := model.Sharing{
		ID:         uuid.NewString(),
		Enabled:    true,
		Token:      "token",
		ModifiedBy: "otherid",
		UpdateAt:   time.Now().Unix(),
	}

	t.Run("should success to upsert sharing", func(t *testing.T) {
		store.EXPECT().UpsertSharing(gomock.Eq(container), gomock.Eq(sharing)).Return(nil)
		err := app.UpsertSharing(container, sharing)

		require.NoError(t, err)
	})

	t.Run("should fail to upsert a sharing", func(t *testing.T) {
		store.EXPECT().UpsertSharing(gomock.Eq(container), gomock.Eq(sharing)).Return(errors.New("sharing not found"))
		err := app.UpsertSharing(container, sharing)

		require.Error(t, err)
		require.Equal(t, "sharing not found", err.Error())
	})
}
