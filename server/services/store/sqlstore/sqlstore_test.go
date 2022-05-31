// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package sqlstore

import (
	"testing"
	"time"

	"github.com/mattermost/focalboard/server/services/store/storetests"
	utils "github.com/mattermost/focalboard/server/utils"
	"github.com/stretchr/testify/require"
)

func TestBlocksStore(t *testing.T) {
	t.Run("BlocksStore", func(t *testing.T) { storetests.StoreTestBlocksStore(t, SetupTests) })
	t.Run("SharingStore", func(t *testing.T) { storetests.StoreTestSharingStore(t, SetupTests) })
	t.Run("SystemStore", func(t *testing.T) { storetests.StoreTestSystemStore(t, SetupTests) })
	t.Run("UserStore", func(t *testing.T) { storetests.StoreTestUserStore(t, SetupTests) })
	t.Run("SessionStore", func(t *testing.T) { storetests.StoreTestSessionStore(t, SetupTests) })
	t.Run("WorkspaceStore", func(t *testing.T) { storetests.StoreTestWorkspaceStore(t, SetupTests) })
	t.Run("SubscriptionStore", func(t *testing.T) { storetests.StoreTestSubscriptionsStore(t, SetupTests) })
	t.Run("NotificationHintStore", func(t *testing.T) { storetests.StoreTestNotificationHintsStore(t, SetupTests) })
	t.Run("CloudStore", func(t *testing.T) { storetests.StoreTestCloudStore(t, SetupTests) })
	t.Run("BoardsInsightsStore", func(t *testing.T) { storetests.StoreTestBoardsInsightsStore(t, SetupTests) })
}

//  tests for  utility functions inside sqlstore.go
func TestDurationSelector(t *testing.T) {
	store, tearDown := SetupTests(t)
	sqlStore := store.(*SQLStore)
	defer tearDown()

	t.Run("Test day", func(t *testing.T) {
		timeResultMillis, err := sqlStore.durationSelector("2 days")
		require.NoError(t, err)
		timeResult := utils.GetTimeForMillis(timeResultMillis)
		timeAfter := time.Now().AddDate(0, 0, -1)
		timeBefore := time.Now().AddDate(0, 0, -3)
		require.Equal(t, timeResult.Before(timeAfter), true)
		require.Equal(t, timeResult.After(timeBefore), true)
	})

	t.Run("Test month", func(t *testing.T) {
		timeResultMillis, err := sqlStore.durationSelector("2 months")
		require.NoError(t, err)
		timeResult := utils.GetTimeForMillis(timeResultMillis)
		timeAfter := time.Now().AddDate(0, -2, 1)
		timeBefore := time.Now().AddDate(0, -2, -1)
		require.Equal(t, timeResult.Before(timeAfter), true)
		require.Equal(t, timeResult.After(timeBefore), true)
	})

	t.Run("Test year", func(t *testing.T) {
		timeResultMillis, err := sqlStore.durationSelector("2 years")
		require.NoError(t, err)
		timeResult := utils.GetTimeForMillis(timeResultMillis)
		timeAfter := time.Now().AddDate(-2, 0, 1)
		timeBefore := time.Now().AddDate(-2, 0, -1)
		require.Equal(t, timeResult.Before(timeAfter), true)
		require.Equal(t, timeResult.After(timeBefore), true)
	})
}

func TestConcatenationSelector(t *testing.T) {
	store, tearDown := SetupTests(t)
	sqlStore := store.(*SQLStore)
	defer tearDown()

	concatenationString := sqlStore.concatenationSelector("a", ",")
	switch sqlStore.dbType {
	case sqliteDBType:
		require.Equal(t, concatenationString, "group_concat(a)")
	case mysqlDBType:
		require.Equal(t, concatenationString, "GROUP_CONCAT(a SEPARATOR ',')")
	case postgresDBType:
		require.Equal(t, concatenationString, "string_agg(a, ',')")
	}
}

func TestElementInColumn(t *testing.T) {
	store, tearDown := SetupTests(t)
	sqlStore := store.(*SQLStore)
	defer tearDown()

	inLiteral := sqlStore.elementInColumn(1, "test_column")
	switch sqlStore.dbType {
	case sqliteDBType:
		require.Equal(t, inLiteral, "instr(test_column, $1) > 0")
	case mysqlDBType:
		require.Equal(t, inLiteral, "instr(test_column, ?) > 0")
	case postgresDBType:
		require.Equal(t, inLiteral, "position($1 in test_column) > 0")
	}
}

func TestParameterPlaceholder(t *testing.T) {
	store, tearDown := SetupTests(t)
	sqlStore := store.(*SQLStore)
	defer tearDown()

	parameterPlaceholder := sqlStore.parameterPlaceholder(2)
	switch sqlStore.dbType {
	case sqliteDBType:
		require.Equal(t, parameterPlaceholder, "$2")
	case postgresDBType:
		require.Equal(t, parameterPlaceholder, "$2")
	case mysqlDBType:
		require.Equal(t, parameterPlaceholder, "?")
	}
}
