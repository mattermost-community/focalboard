package sqlstore

import (
	"database/sql"
	"os"
	"testing"

	"github.com/mattermost/focalboard/server/services/store"
	"github.com/stretchr/testify/require"

	"github.com/mattermost/mattermost-server/v6/shared/mlog"
)

func SetupTests(t *testing.T) (store.Store, func()) {
	dbType := os.Getenv("FB_STORE_TEST_DB_TYPE")
	if dbType == "" {
		dbType = sqliteDBType
	}

	connectionString := os.Getenv("FB_STORE_TEST_CONN_STRING")
	if connectionString == "" {
		connectionString = ":memory:"
	}

	logger := mlog.CreateConsoleTestLogger(false, mlog.LvlDebug)

	sqlDB, err := sql.Open(dbType, connectionString)
	require.NoError(t, err)
	err = sqlDB.Ping()
	require.NoError(t, err)

	storeParams := Params{
		DBType:           dbType,
		ConnectionString: connectionString,
		TablePrefix:      "test_",
		Logger:           logger,
		DB:               sqlDB,
		IsPlugin:         false,
	}
	store, err := New(storeParams)
	require.Nil(t, err)

	tearDown := func() {
		defer func() { _ = logger.Shutdown() }()
		err = store.Shutdown()
		require.Nil(t, err)
	}

	return store, tearDown
}
