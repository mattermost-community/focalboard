// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package storetests

import (
	"database/sql"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/require"

	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/services/store"
)

func StoreTestUserStore(t *testing.T, setup func(t *testing.T) (store.Store, func())) {
	t.Run("SetGetSystemSettings", func(t *testing.T) {
		store, tearDown := setup(t)
		defer tearDown()
		testGetWorkspaceUsers(t, store)
	})

	t.Run("CreateAndGetUser", func(t *testing.T) {
		store, tearDown := setup(t)
		defer tearDown()
		testCreateAndGetUser(t, store)
	})

	t.Run("CreateAndUpateUser", func(t *testing.T) {
		store, tearDown := setup(t)
		defer tearDown()
		testCreateAndUpdateUser(t, store)
	})

	t.Run("CreateAndGetRegisteredUserCount", func(t *testing.T) {
		store, tearDown := setup(t)
		defer tearDown()
		testCreateAndGetRegisteredUserCount(t, store)
	})
}

func testGetWorkspaceUsers(t *testing.T, store store.Store) {
	t.Run("GetWorkspaceUSers", func(t *testing.T) {
		users, err := store.GetUsersByWorkspace("workspace_1")
		require.Equal(t, 0, len(users))
		require.Equal(t, sql.ErrNoRows, err)

		userID := uuid.New().String()

		err = store.CreateUser(&model.User{
			ID:       userID,
			Username: "darth.vader",
		})
		require.NoError(t, err)

		defer func() {
			_ = store.UpdateUser(&model.User{
				ID:       userID,
				DeleteAt: time.Now().Unix(),
			})
		}()

		users, err = store.GetUsersByWorkspace("workspace_1")
		require.Equal(t, 1, len(users))
		require.Equal(t, "darth.vader", users[0].Username)
		require.NoError(t, err)
	})
}

func testCreateAndGetUser(t *testing.T, store store.Store) {
	user := &model.User{
		ID:       uuid.New().String(),
		Username: "damao",
		Email:    "mock@email.com",
	}

	t.Run("CreateUser", func(t *testing.T) {
		err := store.CreateUser(user)
		require.NoError(t, err)
	})

	t.Run("GetUserByID", func(t *testing.T) {
		got, err := store.GetUserByID(user.ID)
		require.NoError(t, err)
		require.Equal(t, user.ID, got.ID)
		require.Equal(t, user.Username, got.Username)
		require.Equal(t, user.Email, got.Email)
	})

	t.Run("GetUserByUsername", func(t *testing.T) {
		got, err := store.GetUserByUsername(user.Username)
		require.NoError(t, err)
		require.Equal(t, user.ID, got.ID)
		require.Equal(t, user.Username, got.Username)
		require.Equal(t, user.Email, got.Email)
	})

	t.Run("GetUserByEmail", func(t *testing.T) {
		got, err := store.GetUserByEmail(user.Email)
		require.NoError(t, err)
		require.Equal(t, user.ID, got.ID)
		require.Equal(t, user.Username, got.Username)
		require.Equal(t, user.Email, got.Email)
	})
}

func testCreateAndUpdateUser(t *testing.T, store store.Store) {
	user := &model.User{
		ID: uuid.New().String(),
	}
	err := store.CreateUser(user)
	require.NoError(t, err)

	t.Run("UpdateUser", func(t *testing.T) {
		user.Username = "damao"
		user.Email = "mock@email.com"
		user.Props = map[string]interface{}{"a": "b"}
		err := store.UpdateUser(user)
		require.NoError(t, err)

		got, err := store.GetUserByID(user.ID)
		require.NoError(t, err)
		require.Equal(t, user.ID, got.ID)
		require.Equal(t, user.Username, got.Username)
		require.Equal(t, user.Email, got.Email)
		require.Equal(t, user.Props, got.Props)
	})

	t.Run("UpdateUserPassword", func(t *testing.T) {
		newPassword := uuid.New().String()
		err := store.UpdateUserPassword(user.Username, newPassword)
		require.NoError(t, err)

		got, err := store.GetUserByUsername(user.Username)
		require.NoError(t, err)
		require.Equal(t, user.Username, got.Username)
		require.Equal(t, newPassword, got.Password)
	})

	t.Run("UpdateUserPasswordByID", func(t *testing.T) {
		newPassword := uuid.New().String()
		err := store.UpdateUserPasswordByID(user.ID, newPassword)
		require.NoError(t, err)

		got, err := store.GetUserByID(user.ID)
		require.NoError(t, err)
		require.Equal(t, user.ID, got.ID)
		require.Equal(t, newPassword, got.Password)
	})
}

func testCreateAndGetRegisteredUserCount(t *testing.T, store store.Store) {
	randomN := int(time.Now().Unix() % 10)
	for i := 0; i < randomN; i++ {
		err := store.CreateUser(&model.User{
			ID: uuid.New().String(),
		})
		require.NoError(t, err)
	}

	got, err := store.GetRegisteredUserCount()
	require.NoError(t, err)
	require.Equal(t, randomN, got)
}
