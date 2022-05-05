// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package sqlstore

import (
	"testing"
	"time"

	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/services/store/storetests"
	"github.com/stretchr/testify/require"
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

//  tests for  utility functions inside sqlstore.go
func TestDurationSelector(t *testing.T) {
	store, tearDown := SetupTests(t)
	sqlStore := store.(*SQLStore)
	defer tearDown()

	t.Run("Test day", func(t *testing.T) {
		timeString := sqlStore.durationSelector("2 days")
		timeFromTestTarget, err := time.Parse(time.RFC3339, timeString)
		require.NoError(t, err)
		timeAfter := time.Now().AddDate(0, 0, -1)
		timeBefore := time.Now().AddDate(0, 0, -3)
		require.Equal(t, timeFromTestTarget.Before(timeAfter), true)
		require.Equal(t, timeFromTestTarget.After(timeBefore), true)
	})

	t.Run("Test month", func(t *testing.T) {
		timeString := sqlStore.durationSelector("2 months")
		timeFromTestTarget, err := time.Parse(time.RFC3339, timeString)
		require.NoError(t, err)
		timeAfter := time.Now().AddDate(0, -2, 1)
		timeBefore := time.Now().AddDate(0, -2, -1)
		require.Equal(t, timeFromTestTarget.Before(timeAfter), true)
		require.Equal(t, timeFromTestTarget.After(timeBefore), true)
	})

	t.Run("Test year", func(t *testing.T) {
		timeString := sqlStore.durationSelector("2 years")
		timeFromTestTarget, err := time.Parse(time.RFC3339, timeString)
		require.NoError(t, err)
		timeAfter := time.Now().AddDate(-2, 0, 1)
		timeBefore := time.Now().AddDate(-2, 0, -1)
		require.Equal(t, timeFromTestTarget.Before(timeAfter), true)
		require.Equal(t, timeFromTestTarget.After(timeBefore), true)
	})
}

func TestConcatenationSelector(t *testing.T) {
	store, tearDown := SetupTests(t)
	sqlStore := store.(*SQLStore)
	defer tearDown()

	concatenationString := sqlStore.concatenationSelector("a", ",")
	switch sqlStore.dbType {
	case model.SqliteDBType:
		require.Equal(t, concatenationString, "group_concat(a)")
	case model.MysqlDBType:
		require.Equal(t, concatenationString, "GROUP_CONCAT(a SEPARATOR ',')")
	case model.PostgresDBType:
		require.Equal(t, concatenationString, "string_agg(a, ',')")
	}
}

func TestElementInColumn(t *testing.T) {
	store, tearDown := SetupTests(t)
	sqlStore := store.(*SQLStore)
	defer tearDown()

	inLiteral := sqlStore.elementInColumn(1, "test_column")
	switch sqlStore.dbType {
	case model.SqliteDBType:
		require.Equal(t, inLiteral, "instr(test_column, $1) > 0")
	case model.MysqlDBType:
		require.Equal(t, inLiteral, "instr(test_column, ?) > 0")
	case model.PostgresDBType:
		require.Equal(t, inLiteral, "position($1 in test_column) > 0")
	}
}

func TestParameterPlaceholder(t *testing.T) {
	store, tearDown := SetupTests(t)
	sqlStore := store.(*SQLStore)
	defer tearDown()

	parameterPlaceholder := sqlStore.parameterPlaceholder(2)
	switch sqlStore.dbType {
	case model.SqliteDBType:
		require.Equal(t, parameterPlaceholder, "$2")
	case model.PostgresDBType:
		require.Equal(t, parameterPlaceholder, "$2")
	case model.MysqlDBType:
		require.Equal(t, parameterPlaceholder, "?")
	}
}
