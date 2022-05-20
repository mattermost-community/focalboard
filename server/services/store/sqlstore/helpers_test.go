package sqlstore

import (
	"database/sql"
	"testing"

	"github.com/mattermost/focalboard/server/services/store"
	"github.com/stretchr/testify/require"

	"github.com/mattermost/mattermost-server/v6/shared/mlog"
)

func SetupTests(t *testing.T) (store.Store, func()) {
	dbType, connectionString, err := PrepareNewTestDatabase()
	require.NoError(t, err)

	logger := mlog.CreateConsoleTestLogger(false, mlog.LvlDebug)

	sqlDB, err := sql.Open(dbType, connectionString)
	require.NoError(t, err)
	err = sqlDB.Ping()
	require.NoError(t, err)

	// create channels, publicchannels test tables to be used by insights store
	err = createTestChannelsTable(sqlDB)

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

func createTestChannelsTable(db *sql.DB) error {
	/*
		create channels, publicchannels table, and seed data
		channels: id, teamid
	*/

	query := `
		create table Channels(
			id varchar(26) primary key,
			teamid varchar(26),
			type varchar(1)
		);
		create table PublicChannels(
			id varchar(26) primary key,
			teamid varchar(26)
		);

		insert into channels(id, teamid, type) values ('channel-id-1','team-id-1', 'P'), ('channel-id-2','team-id-1', 'P');
	`

	_, err := db.Query(query)
	if err != nil {
		return err
	}
	return nil
}
