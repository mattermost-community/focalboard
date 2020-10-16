package sqlstore

import (
	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database"
	"github.com/golang-migrate/migrate/v4/database/postgres"
	"github.com/golang-migrate/migrate/v4/database/sqlite3"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	_ "github.com/lib/pq"
)

func (s *SQLStore) Migrate() error {
	var driver database.Driver
	var err error
	var migrationsDir string
	if s.dbType == "sqlite3" {
		driver, err = sqlite3.WithInstance(s.db, &sqlite3.Config{})
		migrationsDir = "file://./server/services/store/sqlstore/migrations/sqlite"
	}
	if s.dbType == "postgres" {
		driver, err = postgres.WithInstance(s.db, &postgres.Config{})
		migrationsDir = "file://./server/services/store/sqlstore/migrations/postgres"
	}
	m, err := migrate.NewWithDatabaseInstance(migrationsDir, s.dbType, driver)
	if err != nil {
		return err
	}
	// defer m.Close()

	err = m.Up()
	if err != nil && err != migrate.ErrNoChange {
		return err
	}
	return nil
}
