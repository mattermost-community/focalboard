package sqlstore

import (
	"testing"

	"github.com/mattermost/focalboard/server/services/store/storetests"
)

func TestBlocksStore(t *testing.T) {
	t.Run("BlocksStore", func(t *testing.T) { storetests.StoreTestBlocksStore(t, SetupTests) })
	t.Run("SharingStore", func(t *testing.T) { storetests.StoreTestSharingStore(t, SetupTests) })
	t.Run("SystemStore", func(t *testing.T) { storetests.StoreTestSystemStore(t, SetupTests) })
	t.Run("UserStore", func(t *testing.T) { storetests.StoreTestUserStore(t, SetupTests) })
	t.Run("SessionStore", func(t *testing.T) { storetests.StoreTestSessionStore(t, SetupTests) })
	t.Run("WorkspaceStore", func(t *testing.T) { storetests.StoreTestWorkspaceStore(t, SetupTests) })
}
