package sqlstore

import (
	"errors"

	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database"
	"github.com/golang-migrate/migrate/v4/database/postgres"
	"github.com/golang-migrate/migrate/v4/database/sqlite3"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	bindata "github.com/golang-migrate/migrate/v4/source/go_bindata"
	_ "github.com/lib/pq"
	pgmigrations "github.com/mattermost/mattermost-octo-tasks/server/services/store/sqlstore/migrations/postgres"
	"github.com/mattermost/mattermost-octo-tasks/server/services/store/sqlstore/migrations/sqlite"
)

func (s *SQLStore) Migrate() error {
	var bresource *bindata.AssetSource
	var driver database.Driver
	var err error

	if s.dbType == "sqlite3" {
		driver, err = sqlite3.WithInstance(s.db, &sqlite3.Config{})
		if err != nil {
			return err
		}
		bresource = bindata.Resource(sqlite.AssetNames(), sqlite.Asset)
	}

	if s.dbType == "postgres" {
		driver, err = postgres.WithInstance(s.db, &postgres.Config{})
		if err != nil {
			return err
		}
		bresource = bindata.Resource(pgmigrations.AssetNames(), pgmigrations.Asset)
	}

	d, err := bindata.WithInstance(bresource)
	if err != nil {
		return err
	}

	m, err := migrate.NewWithInstance("go-bindata", d, s.dbType, driver)
	if err != nil {
		return err
	}

	err = m.Up()
	if err != nil && !errors.Is(err, migrate.ErrNoChange) {
		return err
	}

	return nil
}
