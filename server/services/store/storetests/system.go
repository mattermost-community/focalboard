package storetests

import (
	"testing"

	"github.com/mattermost/focalboard/server/services/store"
	"github.com/stretchr/testify/require"
)

func StoreTestSystemStore(t *testing.T, setup func(t *testing.T) (store.Store, func())) {
	container := store.Container{
		WorkspaceID: "0",
	}

	t.Run("SetGetSystemSettings", func(t *testing.T) {
		store, tearDown := setup(t)
		defer tearDown()
		testSetGetSystemSettings(t, store, container)
	})
}

func testSetGetSystemSettings(t *testing.T, store store.Store, _ /*container*/ store.Container) {
	t.Run("Get empty settings", func(t *testing.T) {
		settings, err := store.GetSystemSettings()
		require.NoError(t, err)
		require.Equal(t, map[string]string{}, settings)
	})

	t.Run("Set, update and get multiple settings", func(t *testing.T) {
		err := store.SetSystemSetting("test-1", "test-value-1")
		require.NoError(t, err)
		err = store.SetSystemSetting("test-2", "test-value-2")
		require.NoError(t, err)
		settings, err := store.GetSystemSettings()
		require.NoError(t, err)
		require.Equal(t, map[string]string{"test-1": "test-value-1", "test-2": "test-value-2"}, settings)

		err = store.SetSystemSetting("test-2", "test-value-updated-2")
		require.NoError(t, err)
		settings, err = store.GetSystemSettings()
		require.NoError(t, err)
		require.Equal(t, map[string]string{"test-1": "test-value-1", "test-2": "test-value-updated-2"}, settings)
	})
}
