package sqlstore

import (
	"bytes"
	"database/sql"
	"errors"
	"fmt"
	"io"
	"io/ioutil"
	"os"
	"text/template"

	mysqldriver "github.com/go-sql-driver/mysql"
	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database"
	"github.com/golang-migrate/migrate/v4/database/mysql"
	"github.com/golang-migrate/migrate/v4/database/postgres"
	"github.com/golang-migrate/migrate/v4/database/sqlite3"
	"github.com/golang-migrate/migrate/v4/source"
	_ "github.com/golang-migrate/migrate/v4/source/file" // fileystem driver
	bindata "github.com/golang-migrate/migrate/v4/source/go_bindata"
	_ "github.com/lib/pq" // postgres driver

	"github.com/mattermost/focalboard/server/services/store/sqlstore/migrations"
	"github.com/mattermost/mattermost-plugin-api/cluster"
)

const (
	uniqueIDsMigrationRequiredVersion = 14
)

type PrefixedMigration struct {
	*bindata.Bindata
	prefix   string
	postgres bool
	sqlite   bool
	mysql    bool
	plugin   bool
}

func init() {
	source.Register("prefixed-migrations", &PrefixedMigration{})
}

func (pm *PrefixedMigration) executeTemplate(r io.ReadCloser, identifier string) (io.ReadCloser, string, error) {
	data, err := ioutil.ReadAll(r)
	if err != nil {
		return nil, "", err
	}
	tmpl, err := template.New("sql").Parse(string(data))
	if err != nil {
		return nil, "", err
	}
	buffer := bytes.NewBufferString("")
	params := map[string]interface{}{
		"prefix":   pm.prefix,
		"postgres": pm.postgres,
		"sqlite":   pm.sqlite,
		"mysql":    pm.mysql,
		"plugin":   pm.plugin,
	}
	err = tmpl.Execute(buffer, params)
	if err != nil {
		return nil, "", err
	}

	return ioutil.NopCloser(bytes.NewReader(buffer.Bytes())), identifier, nil
}

func (pm *PrefixedMigration) ReadUp(version uint) (io.ReadCloser, string, error) {
	r, identifier, err := pm.Bindata.ReadUp(version)
	if err != nil {
		return nil, "", err
	}
	return pm.executeTemplate(r, identifier)
}

func (pm *PrefixedMigration) ReadDown(version uint) (io.ReadCloser, string, error) {
	r, identifier, err := pm.Bindata.ReadDown(version)
	if err != nil {
		return nil, "", err
	}
	return pm.executeTemplate(r, identifier)
}

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
	var driver database.Driver
	var err error
	migrationsTable := fmt.Sprintf("%sschema_migrations", s.tablePrefix)

	if s.dbType == sqliteDBType {
		driver, err = sqlite3.WithInstance(s.db, &sqlite3.Config{MigrationsTable: migrationsTable})
		if err != nil {
			return err
		}
	}

	db, err := s.getMigrationConnection()
	if err != nil {
		return err
	}
	defer db.Close()

	if s.dbType == postgresDBType {
		driver, err = postgres.WithInstance(db, &postgres.Config{MigrationsTable: migrationsTable})
		if err != nil {
			return err
		}
	}

	if s.dbType == mysqlDBType {
		driver, err = mysql.WithInstance(db, &mysql.Config{MigrationsTable: migrationsTable})
		if err != nil {
			return err
		}
	}

	bresource := bindata.Resource(migrations.AssetNames(), migrations.Asset)

	d, err := bindata.WithInstance(bresource)
	if err != nil {
		return err
	}

	prefixedData := &PrefixedMigration{
		Bindata:  d.(*bindata.Bindata),
		prefix:   s.tablePrefix,
		plugin:   s.isPlugin,
		postgres: s.dbType == postgresDBType,
		sqlite:   s.dbType == sqliteDBType,
		mysql:    s.dbType == mysqlDBType,
	}

	m, err := migrate.NewWithInstance("prefixed-migration", prefixedData, s.dbType, driver)
	if err != nil {
		return err
	}

	var mutex *cluster.Mutex
	if s.isPlugin {
		var mutexErr error
		mutex, mutexErr = s.NewMutexFn("Boards_dbMutex")
		if mutexErr != nil {
			return fmt.Errorf("error creating database mutex: %w", mutexErr)
		}
	}

	if err := ensureMigrationsAppliedUpToVersion(m, uniqueIDsMigrationRequiredVersion); err != nil {
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

	if err := m.Up(); err != nil && !errors.Is(err, migrate.ErrNoChange) && !errors.Is(err, os.ErrNotExist) {
		return err
	}

	return nil
}

func ensureMigrationsAppliedUpToVersion(m *migrate.Migrate, version uint) error {
	currentVersion, _, err := m.Version()
	if err != nil && !errors.Is(err, migrate.ErrNilVersion) {
		return err
	}

	// if the target version is below or equal to the current one, do
	// not migrate either because is not needed (both are equal) or
	// because it would downgrade the database (is below)
	if version <= currentVersion {
		return nil
	}

	if err := m.Migrate(version); err != nil && !errors.Is(err, migrate.ErrNoChange) && !errors.Is(err, os.ErrNotExist) {
		return err
	}

	return nil
}
