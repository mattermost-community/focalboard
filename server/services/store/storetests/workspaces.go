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

func StoreTestWorkspaceStore(t *testing.T, setup func(t *testing.T) (store.Store, func())) {
	t.Run("UpsertWorkspaceSignupToken", func(t *testing.T) {
		store, tearDown := setup(t)
		defer tearDown()
		testUpsertWorkspaceSignupToken(t, store)
	})

	t.Run("UpsertWorkspaceSettings", func(t *testing.T) {
		store, tearDown := setup(t)
		defer tearDown()
		testUpsertWorkspaceSettings(t, store)
	})

	t.Run("GetWorkspaceCount", func(t *testing.T) {
		store, tearDown := setup(t)
		defer tearDown()
		testGetWorkspaceCount(t, store)
	})
}

func testUpsertWorkspaceSignupToken(t *testing.T, store store.Store) {
	t.Run("Insert and update workspace with signup token", func(t *testing.T) {
		workspaceID := "0"
		workspace := &model.Workspace{
			ID:          workspaceID,
			SignupToken: utils.NewID(utils.IDTypeToken),
		}

		// insert
		err := store.UpsertWorkspaceSignupToken(*workspace)
		require.NoError(t, err)

		got, err := store.GetWorkspace(workspaceID)
		require.NoError(t, err)
		require.Equal(t, workspace.ID, got.ID)
		require.Equal(t, workspace.SignupToken, got.SignupToken)

		// update signup token
		workspace.SignupToken = utils.NewID(utils.IDTypeToken)
		err = store.UpsertWorkspaceSignupToken(*workspace)
		require.NoError(t, err)

		got, err = store.GetWorkspace(workspaceID)
		require.NoError(t, err)
		require.Equal(t, workspace.ID, got.ID)
		require.Equal(t, workspace.SignupToken, got.SignupToken)
	})
}

func testUpsertWorkspaceSettings(t *testing.T, store store.Store) {
	t.Run("Insert and update workspace with settings", func(t *testing.T) {
		workspaceID := "0"
		workspace := &model.Workspace{
			ID: workspaceID,
			Settings: map[string]interface{}{
				"field1": "A",
			},
		}

		// insert
		err := store.UpsertWorkspaceSettings(*workspace)
		require.NoError(t, err)

		got, err := store.GetWorkspace(workspaceID)
		require.NoError(t, err)
		require.Equal(t, workspace.ID, got.ID)
		require.Equal(t, workspace.Settings, got.Settings)

		// update settings
		workspace.Settings = map[string]interface{}{
			"field1": "B",
		}
		err = store.UpsertWorkspaceSettings(*workspace)
		require.NoError(t, err)

		got2, err := store.GetWorkspace(workspaceID)
		require.NoError(t, err)
		require.Equal(t, workspace.ID, got2.ID)
		require.Equal(t, workspace.Settings, got2.Settings)
		require.Equal(t, got.SignupToken, got2.SignupToken)
	})
}

func testGetWorkspaceCount(t *testing.T, store store.Store) {
	t.Run("Insert multiple workspace and get workspace count", func(t *testing.T) {
		// insert
		n := time.Now().Unix() % 10
		for i := 0; i < int(n); i++ {
			workspaceID := fmt.Sprintf("%d", i)
			workspace := &model.Workspace{
				ID:          workspaceID,
				SignupToken: utils.NewID(utils.IDTypeToken),
			}

			err := store.UpsertWorkspaceSignupToken(*workspace)
			require.NoError(t, err)
		}

		got, err := store.GetWorkspaceCount()
		require.NoError(t, err)
		require.Equal(t, n, got)
	})
}
