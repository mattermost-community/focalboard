package sqlstore

import (
	"bytes"
	"context"
	"database/sql"
	"embed"
	"fmt"
	"path/filepath"
	"text/template"

	"github.com/mattermost/morph"
	drivers "github.com/mattermost/morph/drivers"
	mysql "github.com/mattermost/morph/drivers/mysql"
	postgres "github.com/mattermost/morph/drivers/postgres"
	sqlite "github.com/mattermost/morph/drivers/sqlite"
	mbindata "github.com/mattermost/morph/sources/go_bindata"

	mysqldriver "github.com/go-sql-driver/mysql"
	_ "github.com/lib/pq" // postgres driver

	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/mattermost-plugin-api/cluster"
)

//go:embed migrations
var assets embed.FS

const (
	uniqueIDsMigrationRequiredVersion = 14
)

func appendMultipleStatementsFlag(connectionString string) (string, error) {
	config, err := mysqldriver.ParseDSN(connectionString)
	if err != nil {
		return "", err
	}

	if config.Params == nil {
		config.Params = map[string]string{}
	}

	config.Params["multiStatements"] = "true"
	return config.FormatDSN(), nil
}

// migrations in MySQL need to run with the multiStatements flag
// enabled, so this method creates a new connection ensuring that it's
// enabled.
func (s *SQLStore) getMigrationConnection() (*sql.DB, error) {
	connectionString := s.connectionString
	if s.dbType == model.MysqlDBType {
		var err error
		connectionString, err = appendMultipleStatementsFlag(s.connectionString)
		if err != nil {
			return nil, err
		}
	}

	db, err := sql.Open(s.dbType, connectionString)
	if err != nil {
		return nil, err
	}

	if err = db.Ping(); err != nil {
		return nil, err
	}

	return db, nil
}

func (s *SQLStore) Migrate() error {
	var driver drivers.Driver
	var err error

	migrationConfig := drivers.Config{
		StatementTimeoutInSecs: 1000000,
		MigrationsTable:        fmt.Sprintf("%sschema_migrations", s.tablePrefix),
	}

	if s.dbType == model.SqliteDBType {
		driver, err = sqlite.WithInstance(s.db, &sqlite.Config{Config: migrationConfig})
		if err != nil {
			return err
		}
	}

	var db *sql.DB
	if s.dbType != model.SqliteDBType {
		db, err = s.getMigrationConnection()
		if err != nil {
			return err
		}

		defer db.Close()
	}

	if s.dbType == model.PostgresDBType {
		driver, err = postgres.WithInstance(db, &postgres.Config{Config: migrationConfig})
		if err != nil {
			return err
		}
	}

	if s.dbType == model.MysqlDBType {
		driver, err = mysql.WithInstance(db, &mysql.Config{Config: migrationConfig})
		if err != nil {
			return err
		}
	}

	assetsList, err := assets.ReadDir("migrations")
	if err != nil {
		return err
	}
	assetNamesForDriver := make([]string, len(assetsList))
	for i, dirEntry := range assetsList {
		assetNamesForDriver[i] = dirEntry.Name()
	}

	params := map[string]interface{}{
		"prefix":   s.tablePrefix,
		"postgres": s.dbType == model.PostgresDBType,
		"sqlite":   s.dbType == model.SqliteDBType,
		"mysql":    s.dbType == model.MysqlDBType,
		"plugin":   s.isPlugin,
	}

	src, err := mbindata.WithInstance(&mbindata.AssetSource{
		Names: assetNamesForDriver,
		AssetFunc: func(name string) ([]byte, error) {
			asset, mErr := assets.ReadFile(filepath.Join("migrations", name))
			if mErr != nil {
				return nil, mErr
			}

			tmpl, pErr := template.New("sql").Parse(string(asset))
			if pErr != nil {
				return nil, pErr
			}
			buffer := bytes.NewBufferString("")

			err = tmpl.Execute(buffer, params)
			if err != nil {
				return nil, err
			}

			return buffer.Bytes(), nil
		},
	})
	if err != nil {
		return err
	}
	defer src.Close()

	opts := []morph.EngineOption{
		morph.WithLock("mm-lock-key"),
	}

	if s.dbType == model.SqliteDBType {
		opts = opts[:0] // sqlite driver does not support locking, it doesn't need to anyway.
	}

	engine, err := morph.New(context.Background(), driver, src, opts...)
	if err != nil {
		return err
	}
	defer engine.Close()

	var mutex *cluster.Mutex
	if s.isPlugin {
		var mutexErr error
		mutex, mutexErr = s.NewMutexFn("Boards_dbMutex")
		if mutexErr != nil {
			return fmt.Errorf("error creating database mutex: %w", mutexErr)
		}
	}

	if s.isPlugin {
		s.logger.Debug("Acquiring cluster lock for Unique IDs migration")
		mutex.Lock()
	}

	if err := ensureMigrationsAppliedUpToVersion(engine, driver, uniqueIDsMigrationRequiredVersion); err != nil {
		return err
	}

	if err := s.runUniqueIDsMigration(); err != nil {
		if s.isPlugin {
			s.logger.Debug("Releasing cluster lock for Unique IDs migration")
			mutex.Unlock()
		}
		return fmt.Errorf("error running unique IDs migration: %w", err)
	}

	if err := ensureMigrationsAppliedUpToVersion(engine, driver, categoriesUUIDIDMigrationRequiredVersion); err != nil {
		return err
	}

	if err := s.runCategoryUUIDIDMigration(); err != nil {
		if s.isPlugin {
			s.logger.Debug("Releasing cluster lock for Unique IDs migration")
			mutex.Unlock()
		}
		return fmt.Errorf("error running categoryID migration: %w", err)
	}

	if s.isPlugin {
		s.logger.Debug("Releasing cluster lock for Unique IDs migration")
		mutex.Unlock()
	}

	return engine.ApplyAll()
}

func ensureMigrationsAppliedUpToVersion(engine *morph.Morph, driver drivers.Driver, version int) error {
	applied, err := driver.AppliedMigrations()
	if err != nil {
		return err
	}
	currentVersion := len(applied)

	// if the target version is below or equal to the current one, do
	// not migrate either because is not needed (both are equal) or
	// because it would downgrade the database (is below)
	if version <= currentVersion {
		return nil
	}

	if _, err = engine.Apply(version - currentVersion); err != nil {
		return err
	}

	return nil
}
