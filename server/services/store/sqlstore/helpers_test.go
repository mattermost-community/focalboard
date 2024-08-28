package sqlstore

import (
	"database/sql"
	"os"
	"testing"

	"github.com/mattermost/focalboard/server/services/store"
	"github.com/stretchr/testify/require"

	"github.com/mattermost/mattermost/server/public/shared/mlog"
)

func SetupTests(t *testing.T) (store.Store, func()) {
	origUnitTesting := os.Getenv("FOCALBOARD_UNIT_TESTING")
	os.Setenv("FOCALBOARD_UNIT_TESTING", "1")

	dbType, connectionString, err := PrepareNewTestDatabase()
	require.NoError(t, err)

	logger, _ := mlog.NewLogger()

	sqlDB, err := sql.Open(dbType, connectionString)
	require.NoError(t, err)
	err = sqlDB.Ping()
	require.NoError(t, err)

	storeParams := Params{
		DBType:           dbType,
		ConnectionString: connectionString,
		DBPingAttempts:   5,
		TablePrefix:      "test_",
		Logger:           logger,
		DB:               sqlDB,
	}
	store, err := New(storeParams)
	require.NoError(t, err)

	tearDown := func() {
		defer func() { _ = logger.Shutdown() }()
		err = store.Shutdown()
		require.Nil(t, err)
		if err = os.Remove(connectionString); err == nil {
			logger.Debug("Removed test database", mlog.String("file", connectionString))
		}
		os.Setenv("FOCALBOARD_UNIT_TESTING", origUnitTesting)
	}

	return store, tearDown
}
