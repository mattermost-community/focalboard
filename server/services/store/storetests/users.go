// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package storetests

import (
	"testing"
	"time"

	"github.com/stretchr/testify/require"

	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/services/store"
	"github.com/mattermost/focalboard/server/utils"
)

func StoreTestUserStore(t *testing.T, setup func(t *testing.T) (store.Store, func())) {
	t.Run("SetGetSystemSettings", func(t *testing.T) {
		store, tearDown := setup(t)
		defer tearDown()
		testGetTeamUsers(t, store)
	})

	t.Run("CreateAndGetUser", func(t *testing.T) {
		store, tearDown := setup(t)
		defer tearDown()
		testCreateAndGetUser(t, store)
	})

	t.Run("CreateAndUpdateUser", func(t *testing.T) {
		store, tearDown := setup(t)
		defer tearDown()
		testCreateAndUpdateUser(t, store)
	})

	t.Run("CreateAndGetRegisteredUserCount", func(t *testing.T) {
		store, tearDown := setup(t)
		defer tearDown()
		testCreateAndGetRegisteredUserCount(t, store)
	})
	t.Run("TestPatchUserProps", func(t *testing.T) {
		store, tearDown := setup(t)
		defer tearDown()
		testPatchUserProps(t, store)
	})
}

func testGetTeamUsers(t *testing.T, store store.Store) {
	t.Run("GetTeamUSers", func(t *testing.T) {
		users, err := store.GetUsersByTeam("team_1", "")
		require.Equal(t, 0, len(users))
		require.True(t, model.IsErrNotFound(err), "Should be ErrNotFound compatible error")

		userID := utils.NewID(utils.IDTypeUser)

		err = store.CreateUser(&model.User{
			ID:       userID,
			Username: "darth.vader",
		})
		require.NoError(t, err)

		defer func() {
			_ = store.UpdateUser(&model.User{
				ID:       userID,
				DeleteAt: utils.GetMillis(),
			})
		}()

		users, err = store.GetUsersByTeam("team_1", "")
		require.Equal(t, 1, len(users))
		require.Equal(t, "darth.vader", users[0].Username)
		require.NoError(t, err)
	})
}

func testCreateAndGetUser(t *testing.T, store store.Store) {
	user := &model.User{
		ID:       utils.NewID(utils.IDTypeUser),
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
		ID: utils.NewID(utils.IDTypeUser),
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
		newPassword := utils.NewID(utils.IDTypeNone)
		err := store.UpdateUserPassword(user.Username, newPassword)
		require.NoError(t, err)

		got, err := store.GetUserByUsername(user.Username)
		require.NoError(t, err)
		require.Equal(t, user.Username, got.Username)
		require.Equal(t, newPassword, got.Password)
	})

	t.Run("UpdateUserPasswordByID", func(t *testing.T) {
		newPassword := utils.NewID(utils.IDTypeNone)
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
			ID: utils.NewID(utils.IDTypeUser),
		})
		require.NoError(t, err)
	}

	got, err := store.GetRegisteredUserCount()
	require.NoError(t, err)
	require.Equal(t, randomN, got)
}

func testPatchUserProps(t *testing.T, store store.Store) {
	user := &model.User{
		ID: utils.NewID(utils.IDTypeUser),
	}
	err := store.CreateUser(user)
	require.NoError(t, err)

	key1 := "new_key_1"
	key2 := "new_key_2"
	key3 := "new_key_3"

	// Only update props
	patch := model.UserPropPatch{
		UpdatedFields: map[string]string{
			key1: "new_value_1",
			key2: "new_value_2",
			key3: "new_value_3",
		},
	}

	err = store.PatchUserProps(user.ID, patch)
	require.NoError(t, err)
	userPreferences, err := store.GetUserPreferences(user.ID)
	require.NoError(t, err)
	require.Equal(t, 3, len(userPreferences))

	for _, preference := range userPreferences {
		switch preference.Name {
		case key1:
			require.Equal(t, "new_value_1", preference.Value)
		case key2:
			require.Equal(t, "new_value_2", preference.Value)
		case key3:
			require.Equal(t, "new_value_3", preference.Value)
		}
	}

	// Delete a prop
	patch = model.UserPropPatch{
		DeletedFields: []string{
			key1,
		},
	}

	err = store.PatchUserProps(user.ID, patch)
	require.NoError(t, err)
	userPreferences, err = store.GetUserPreferences(user.ID)
	require.NoError(t, err)

	for _, preference := range userPreferences {
		switch preference.Name {
		case key1:
			t.Errorf("new_key_1 shouldn't exist in user preference as we just deleted it")
		case key2:
			require.Equal(t, "new_value_2", preference.Value)
		case key3:
			require.Equal(t, "new_value_3", preference.Value)
		}
	}

	// update and delete together
	patch = model.UserPropPatch{
		UpdatedFields: map[string]string{
			key3: "new_value_3_new_again",
		},
		DeletedFields: []string{
			key2,
		},
	}
	err = store.PatchUserProps(user.ID, patch)
	require.NoError(t, err)
	userPreferences, err = store.GetUserPreferences(user.ID)
	require.NoError(t, err)

	for _, preference := range userPreferences {
		switch preference.Name {
		case key1:
			t.Errorf("new_key_1 shouldn't exist in user preference as we just deleted it")
		case key2:
			t.Errorf("new_key_2 shouldn't exist in user preference as we just deleted it")
		case key3:
			require.Equal(t, "new_value_3_new_again", preference.Value)
		}
	}
}
