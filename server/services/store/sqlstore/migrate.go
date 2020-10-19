package sqlstore

import (
	"fmt"

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
	fmt.Println("HOLA")
	var driver database.Driver
	var err error
	var bresource *bindata.AssetSource
	if s.dbType == "sqlite3" {
		driver, err = sqlite3.WithInstance(s.db, &sqlite3.Config{})
		if err != nil {
			return err
		}
		bresource = bindata.Resource(sqlite.AssetNames(),
			func(name string) ([]byte, error) {
				return sqlite.Asset(name)
			})
	}
	if s.dbType == "postgres" {
		driver, err = postgres.WithInstance(s.db, &postgres.Config{})
		if err != nil {
			return err
		}
		bresource = bindata.Resource(pgmigrations.AssetNames(),
			func(name string) ([]byte, error) {
				return pgmigrations.Asset(name)
			})
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
	if err != nil && err != migrate.ErrNoChange {
		return err
	}
	return nil
}
