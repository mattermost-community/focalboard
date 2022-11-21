package sqlstore

import (
	"bytes"
	"context"
	"database/sql"
	"embed"
	"errors"
	"fmt"

	"text/template"

	"github.com/mattermost/mattermost-server/v6/shared/mlog"
	"github.com/mattermost/mattermost-server/v6/store/sqlstore"

	"github.com/mattermost/morph"
	drivers "github.com/mattermost/morph/drivers"
	mysql "github.com/mattermost/morph/drivers/mysql"
	postgres "github.com/mattermost/morph/drivers/postgres"
	sqlite "github.com/mattermost/morph/drivers/sqlite"
	embedded "github.com/mattermost/morph/sources/embedded"

	_ "github.com/lib/pq" // postgres driver

	"github.com/mattermost/focalboard/server/model"
)

//go:embed migrations
var Assets embed.FS

const (
	uniqueIDsMigrationRequiredVersion        = 14
	teamLessBoardsMigrationRequiredVersion   = 18
	categoriesUUIDIDMigrationRequiredVersion = 20

	tempSchemaMigrationTableName = "temp_schema_migration"
)

var errChannelCreatorNotInTeam = errors.New("channel creator not found in user teams")

// migrations in MySQL need to run with the multiStatements flag
// enabled, so this method creates a new connection ensuring that it's
// enabled.
func (s *SQLStore) getMigrationConnection() (*sql.DB, error) {
	connectionString := s.connectionString
	if s.dbType == model.MysqlDBType {
		var err error
		connectionString, err = sqlstore.ResetReadTimeout(connectionString)
		if err != nil {
			return nil, err
		}

		connectionString, err = sqlstore.AppendMultipleStatementsFlag(connectionString)
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
	if s.isPlugin {
		mutex, mutexErr := s.NewMutexFn("Boards_dbMutex")
		if mutexErr != nil {
			return fmt.Errorf("error creating database mutex: %w", mutexErr)
		}

		s.logger.Debug("Acquiring cluster lock for Focalboard migrations")
		mutex.Lock()
		defer func() {
			s.logger.Debug("Releasing cluster lock for Focalboard migrations")
			mutex.Unlock()
		}()
	}

	if err := s.EnsureSchemaMigrationFormat(); err != nil {
		return err
	}
	defer func() {
		// the old schema migration table deletion happens after the
		// migrations have run, to be able to recover its information
		// in case there would be errors during the process.
		if err := s.deleteOldSchemaMigrationTable(); err != nil {
			s.logger.Error("cannot delete the old schema migration table", mlog.Err(err))
		}
	}()

	var driver drivers.Driver
	var err error

	if s.dbType == model.SqliteDBType {
		driver, err = sqlite.WithInstance(s.db)
		if err != nil {
			return err
		}
	}

	var db *sql.DB
	if s.dbType != model.SqliteDBType {
		s.logger.Debug("Getting migrations connection")
		db, err = s.getMigrationConnection()
		if err != nil {
			return err
		}

		defer func() {
			s.logger.Debug("Closing migrations connection")
			db.Close()
		}()
	}

	if s.dbType == model.PostgresDBType {
		driver, err = postgres.WithInstance(db)
		if err != nil {
			return err
		}
	}

	if s.dbType == model.MysqlDBType {
		driver, err = mysql.WithInstance(db)
		if err != nil {
			return err
		}
	}

	assetsList, err := Assets.ReadDir("migrations")
	if err != nil {
		return err
	}
	assetNamesForDriver := make([]string, len(assetsList))
	for i, dirEntry := range assetsList {
		assetNamesForDriver[i] = dirEntry.Name()
	}

	params := map[string]interface{}{
		"prefix":     s.tablePrefix,
		"postgres":   s.dbType == model.PostgresDBType,
		"sqlite":     s.dbType == model.SqliteDBType,
		"mysql":      s.dbType == model.MysqlDBType,
		"plugin":     s.isPlugin,
		"singleUser": s.isSingleUser,
	}

	migrationAssets := &embedded.AssetSource{
		Names: assetNamesForDriver,
		AssetFunc: func(name string) ([]byte, error) {
			asset, mErr := Assets.ReadFile("migrations/" + name)
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
	}

	src, err := embedded.WithInstance(migrationAssets)
	if err != nil {
		return err
	}

	opts := []morph.EngineOption{
		morph.WithLock("boards-lock-key"),
		morph.SetMigrationTableName(fmt.Sprintf("%sschema_migrations", s.tablePrefix)),
		morph.SetStatementTimeoutInSeconds(1000000),
	}

	if s.dbType == model.SqliteDBType {
		opts = opts[:0] // sqlite driver does not support locking, it doesn't need to anyway.
	}

	s.logger.Debug("Creating migration engine")
	engine, err := morph.New(context.Background(), driver, src, opts...)
	if err != nil {
		return err
	}
	defer func() {
		s.logger.Debug("Closing migration engine")
		engine.Close()
	}()

	return s.runMigrationSequence(engine, driver)
}

// runMigrationSequence executes all the migrations in order, both
// plain SQL and data migrations.
func (s *SQLStore) runMigrationSequence(engine *morph.Morph, driver drivers.Driver) error {
	if mErr := s.ensureMigrationsAppliedUpToVersion(engine, driver, uniqueIDsMigrationRequiredVersion); mErr != nil {
		return mErr
	}

	if mErr := s.RunUniqueIDsMigration(); mErr != nil {
		return fmt.Errorf("error running unique IDs migration: %w", mErr)
	}

	if mErr := s.ensureMigrationsAppliedUpToVersion(engine, driver, teamLessBoardsMigrationRequiredVersion); mErr != nil {
		return mErr
	}

	if mErr := s.RunTeamLessBoardsMigration(); mErr != nil {
		return fmt.Errorf("error running teamless boards migration: %w", mErr)
	}

	if mErr := s.RunDeletedMembershipBoardsMigration(); mErr != nil {
		return fmt.Errorf("error running deleted membership boards migration: %w", mErr)
	}

	if mErr := s.ensureMigrationsAppliedUpToVersion(engine, driver, categoriesUUIDIDMigrationRequiredVersion); mErr != nil {
		return mErr
	}

	if mErr := s.RunCategoryUUIDIDMigration(); mErr != nil {
		return fmt.Errorf("error running categoryID migration: %w", mErr)
	}

	appliedMigrations, err := driver.AppliedMigrations()
	if err != nil {
		return err
	}

	s.logger.Debug("== Applying all remaining migrations ====================",
		mlog.Int("current_version", len(appliedMigrations)),
	)

	if err := engine.ApplyAll(); err != nil {
		return err
	}

	// always run the collations & charset fix-ups
	if mErr := s.RunFixCollationsAndCharsetsMigration(); mErr != nil {
		return fmt.Errorf("error running fix collations and charsets migration: %w", mErr)
	}
	return nil
}

func (s *SQLStore) ensureMigrationsAppliedUpToVersion(engine *morph.Morph, driver drivers.Driver, version int) error {
	applied, err := driver.AppliedMigrations()
	if err != nil {
		return err
	}
	currentVersion := len(applied)

	s.logger.Debug("== Ensuring migrations applied up to version ====================",
		mlog.Int("version", version),
		mlog.Int("current_version", currentVersion))

	// if the target version is below or equal to the current one, do
	// not migrate either because is not needed (both are equal) or
	// because it would downgrade the database (is below)
	if version <= currentVersion {
		s.logger.Debug("-- There is no need of applying any migration --------------------")
		return nil
	}

	for _, migration := range applied {
		s.logger.Debug("-- Found applied migration --------------------", mlog.Uint32("version", migration.Version), mlog.String("name", migration.Name))
	}

	if _, err = engine.Apply(version - currentVersion); err != nil {
		return err
	}

	return nil
}
