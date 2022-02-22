package sqlstore

import (
	"bytes"
	"context"
	"database/sql"
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

	"github.com/mattermost/focalboard/server/services/store/sqlstore/migrations"
	"github.com/mattermost/mattermost-plugin-api/cluster"
)

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
	if s.dbType == mysqlDBType {
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

	if s.dbType == sqliteDBType {
		driver, err = sqlite.WithInstance(s.db, &sqlite.Config{Config: migrationConfig})
		if err != nil {
			return err
		}
	}

	var db *sql.DB
	if s.dbType != sqliteDBType {
		db, err = s.getMigrationConnection()
		if err != nil {
			return err
		}

		defer db.Close()
	}

	if s.dbType == postgresDBType {
		driver, err = postgres.WithInstance(db, &postgres.Config{Config: migrationConfig})
		if err != nil {
			return err
		}
	}

	if s.dbType == mysqlDBType {
		driver, err = mysql.WithInstance(db, &mysql.Config{Config: migrationConfig})
		if err != nil {
			return err
		}
	}

	assetNamesForDriver := make([]string, len(migrations.AssetNames()))
	for i, assetName := range migrations.AssetNames() {
		assetNamesForDriver[i] = filepath.Base(assetName)
	}
	src, err := mbindata.WithInstance(&mbindata.AssetSource{
		Names: assetNamesForDriver,
		AssetFunc: func(name string) ([]byte, error) {
			asset, mErr := migrations.Asset(name)
			if mErr != nil {
				return nil, mErr
			}

			tmpl, pErr := template.New("sql").Parse(string(asset))
			if pErr != nil {
				return nil, pErr
			}
			buffer := bytes.NewBufferString("")
			params := map[string]interface{}{
				"prefix":   s.tablePrefix,
				"postgres": s.dbType == postgresDBType,
				"sqlite":   s.dbType == sqliteDBType,
				"mysql":    s.dbType == mysqlDBType,
				"plugin":   s.isPlugin,
			}
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

	if s.dbType == sqliteDBType {
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

	if err := ensureMigrationsAppliedUpToVersion(engine, driver, uniqueIDsMigrationRequiredVersion); err != nil {
		return err
	}

	if s.isPlugin {
		s.logger.Debug("Acquiring cluster lock for Unique IDs migration")
		mutex.Lock()
	}

	if err := s.runUniqueIDsMigration(); err != nil {
		if s.isPlugin {
			s.logger.Debug("Releasing cluster lock for Unique IDs migration")
			mutex.Unlock()
		}
		return fmt.Errorf("error running unique IDs migration: %w", err)
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
