// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package storetests

import (
	"fmt"
	"time"

	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/utils"

	"testing"

	"github.com/stretchr/testify/require"

	"github.com/mattermost/focalboard/server/services/store"
)

func StoreTestTeamStore(t *testing.T, setup func(t *testing.T) (store.Store, func())) {
	t.Run("UpsertTeamSignupToken", func(t *testing.T) {
		store, tearDown := setup(t)
		defer tearDown()
		testUpsertTeamSignupToken(t, store)
	})

	t.Run("UpsertTeamSettings", func(t *testing.T) {
		store, tearDown := setup(t)
		defer tearDown()
		testUpsertTeamSettings(t, store)
	})

	t.Run("GetTeamCount", func(t *testing.T) {
		store, tearDown := setup(t)
		defer tearDown()
		testGetTeamCount(t, store)
	})
}

func testUpsertTeamSignupToken(t *testing.T, store store.Store) {
	t.Run("Insert and update team with signup token", func(t *testing.T) {
		teamID := "0"
		team := &model.Team{
			ID:          teamID,
			SignupToken: utils.CreateGUID(),
		}

		// insert
		err := store.UpsertTeamSignupToken(*team)
		require.NoError(t, err)

		got, err := store.GetTeam(teamID)
		require.NoError(t, err)
		require.Equal(t, team.ID, got.ID)
		require.Equal(t, team.SignupToken, got.SignupToken)

		// update signup token
		team.SignupToken = utils.CreateGUID()
		err = store.UpsertTeamSignupToken(*team)
		require.NoError(t, err)

		got, err = store.GetTeam(teamID)
		require.NoError(t, err)
		require.Equal(t, team.ID, got.ID)
		require.Equal(t, team.SignupToken, got.SignupToken)
	})
}

func testUpsertTeamSettings(t *testing.T, store store.Store) {
	t.Run("Insert and update team with settings", func(t *testing.T) {
		teamID := "0"
		team := &model.Team{
			ID: teamID,
			Settings: map[string]interface{}{
				"field1": "A",
			},
		}

		// insert
		err := store.UpsertTeamSettings(*team)
		require.NoError(t, err)

		got, err := store.GetTeam(teamID)
		require.NoError(t, err)
		require.Equal(t, team.ID, got.ID)
		require.Equal(t, team.Settings, got.Settings)

		// update settings
		team.Settings = map[string]interface{}{
			"field1": "B",
		}
		err = store.UpsertTeamSettings(*team)
		require.NoError(t, err)

		got2, err := store.GetTeam(teamID)
		require.NoError(t, err)
		require.Equal(t, team.ID, got2.ID)
		require.Equal(t, team.Settings, got2.Settings)
		require.Equal(t, got.SignupToken, got2.SignupToken)
	})
}

func testGetTeamCount(t *testing.T, store store.Store) {
	t.Run("Insert multiple team and get team count", func(t *testing.T) {
		// insert
		n := time.Now().Unix() % 10
		for i := 0; i < int(n); i++ {
			teamID := fmt.Sprintf("%d", i)
			team := &model.Team{
				ID:          teamID,
				SignupToken: utils.CreateGUID(),
			}

			err := store.UpsertTeamSignupToken(*team)
			require.NoError(t, err)
		}

		got, err := store.GetTeamCount()
		require.NoError(t, err)
		require.Equal(t, n, got)
	})
}
