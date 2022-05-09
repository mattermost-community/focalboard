// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package sqlstore

import (
	"testing"

	"github.com/mattermost/focalboard/server/services/store/storetests"
)

func TestSQLStore(t *testing.T) {
	t.Run("BlocksStore", func(t *testing.T) { storetests.StoreTestBlocksStore(t, SetupTests) })
	t.Run("SharingStore", func(t *testing.T) { storetests.StoreTestSharingStore(t, SetupTests) })
	t.Run("SystemStore", func(t *testing.T) { storetests.StoreTestSystemStore(t, SetupTests) })
	t.Run("UserStore", func(t *testing.T) { storetests.StoreTestUserStore(t, SetupTests) })
	t.Run("SessionStore", func(t *testing.T) { storetests.StoreTestSessionStore(t, SetupTests) })
	t.Run("TeamStore", func(t *testing.T) { storetests.StoreTestTeamStore(t, SetupTests) })
	t.Run("BoardStore", func(t *testing.T) { storetests.StoreTestBoardStore(t, SetupTests) })
	t.Run("BoardsAndBlocksStore", func(t *testing.T) { storetests.StoreTestBoardsAndBlocksStore(t, SetupTests) })
	t.Run("SubscriptionStore", func(t *testing.T) { storetests.StoreTestSubscriptionsStore(t, SetupTests) })
	t.Run("NotificationHintStore", func(t *testing.T) { storetests.StoreTestNotificationHintsStore(t, SetupTests) })
	t.Run("DataRetention", func(t *testing.T) { storetests.StoreTestDataRetention(t, SetupTests) })
}
