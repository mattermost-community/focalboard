// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package storetests

import (
	"fmt"
	"testing"
	"time"

	"github.com/stretchr/testify/require"

	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/services/store"
	"github.com/mattermost/focalboard/server/utils"
)

func StoreTestUserStore(t *testing.T, setup func(t *testing.T) (store.Store, func())) {
	t.Run("GetUsersByTeam", func(t *testing.T) {
		store, tearDown := setup(t)
		defer tearDown()
		testGetUsersByTeam(t, store)
	})

	t.Run("CreateAndGetUser", func(t *testing.T) {
		store, tearDown := setup(t)
		defer tearDown()
		testCreateAndGetUser(t, store)
	})

	t.Run("GetUsersList", func(t *testing.T) {
		store, tearDown := setup(t)
		defer tearDown()
		testGetUsersList(t, store)
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
	t.Run("TestPatchUserProps", func(t *testing.T) {
		store, tearDown := setup(t)
		defer tearDown()
		testPatchUserProps(t, store)
	})
}

func testGetUsersByTeam(t *testing.T, store store.Store) {
	t.Run("GetTeamUSers", func(t *testing.T) {
		users, err := store.GetUsersByTeam("team_1")
		require.NoError(t, err)
		require.Empty(t, users)

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

		users, err = store.GetUsersByTeam("team_1")
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

	t.Run("GetUserByID nonexistent", func(t *testing.T) {
		got, err := store.GetUserByID("nonexistent-id")
		var nf *model.ErrNotFound
		require.ErrorAs(t, err, &nf)
		require.Nil(t, got)
	})

	t.Run("GetUserByUsername", func(t *testing.T) {
		got, err := store.GetUserByUsername(user.Username)
		require.NoError(t, err)
		require.Equal(t, user.ID, got.ID)
		require.Equal(t, user.Username, got.Username)
		require.Equal(t, user.Email, got.Email)
	})

	t.Run("GetUserByUsername nonexistent", func(t *testing.T) {
		got, err := store.GetUserByID("nonexistent-username")
		var nf *model.ErrNotFound
		require.ErrorAs(t, err, &nf)
		require.Nil(t, got)
	})

	t.Run("GetUserByEmail", func(t *testing.T) {
		got, err := store.GetUserByEmail(user.Email)
		require.NoError(t, err)
		require.Equal(t, user.ID, got.ID)
		require.Equal(t, user.Username, got.Username)
		require.Equal(t, user.Email, got.Email)
	})

	t.Run("GetUserByEmail nonexistent", func(t *testing.T) {
		got, err := store.GetUserByID("nonexistent-email")
		var nf *model.ErrNotFound
		require.ErrorAs(t, err, &nf)
		require.Nil(t, got)
	})
}

func testGetUsersList(t *testing.T, store store.Store) {
	for _, id := range []string{"user1", "user2"} {
		user := &model.User{
			ID:       id,
			Username: fmt.Sprintf("%s-username", id),
			Email:    fmt.Sprintf("%s@sample.com", id),
		}
		err := store.CreateUser(user)
		require.NoError(t, err)
	}

	testCases := []struct {
		Name          string
		UserIDs       []string
		ExpectedError bool
		ExpectedIDs   []string
	}{
		{
			Name:          "all of the IDs are found",
			UserIDs:       []string{"user1", "user2"},
			ExpectedError: false,
			ExpectedIDs:   []string{"user1", "user2"},
		},
		{
			Name:          "some of the IDs are found",
			UserIDs:       []string{"user2", "non-existent"},
			ExpectedError: true,
			ExpectedIDs:   []string{"user2"},
		},
		{
			Name:          "none of the IDs are found",
			UserIDs:       []string{"non-existent-1", "non-existent-2"},
			ExpectedError: true,
			ExpectedIDs:   []string{},
		},
	}

	for _, tc := range testCases {
		t.Run(tc.Name, func(t *testing.T) {
			users, err := store.GetUsersList(tc.UserIDs)
			if tc.ExpectedError {
				require.Error(t, err)
				require.True(t, model.IsErrNotFound(err))
			} else {
				require.NoError(t, err)
			}

			userIDs := []string{}
			for _, user := range users {
				userIDs = append(userIDs, user.ID)
			}
			require.ElementsMatch(t, tc.ExpectedIDs, userIDs)
		})
	}
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

	// Only update props
	patch := model.UserPropPatch{
		UpdatedFields: map[string]string{
			"new_key_1": "new_value_1",
			"new_key_2": "new_value_2",
			"new_key_3": "new_value_3",
		},
	}

	err = store.PatchUserProps(user.ID, patch)
	require.NoError(t, err)
	fetchedUser, err := store.GetUserByID(user.ID)
	require.NoError(t, err)
	require.Equal(t, fetchedUser.Props["new_key_1"], "new_value_1")
	require.Equal(t, fetchedUser.Props["new_key_2"], "new_value_2")
	require.Equal(t, fetchedUser.Props["new_key_3"], "new_value_3")

	// Delete a prop
	patch = model.UserPropPatch{
		DeletedFields: []string{
			"new_key_1",
		},
	}

	err = store.PatchUserProps(user.ID, patch)
	require.NoError(t, err)
	fetchedUser, err = store.GetUserByID(user.ID)
	require.NoError(t, err)
	_, ok := fetchedUser.Props["new_key_1"]
	require.False(t, ok)
	require.Equal(t, fetchedUser.Props["new_key_2"], "new_value_2")
	require.Equal(t, fetchedUser.Props["new_key_3"], "new_value_3")

	// update and delete together
	patch = model.UserPropPatch{
		UpdatedFields: map[string]string{
			"new_key_3": "new_value_3_new_again",
		},
		DeletedFields: []string{
			"new_key_2",
		},
	}
	err = store.PatchUserProps(user.ID, patch)
	require.NoError(t, err)
	fetchedUser, err = store.GetUserByID(user.ID)
	require.NoError(t, err)
	_, ok = fetchedUser.Props["new_key_2"]
	require.False(t, ok)
	require.Equal(t, fetchedUser.Props["new_key_3"], "new_value_3_new_again")
}
