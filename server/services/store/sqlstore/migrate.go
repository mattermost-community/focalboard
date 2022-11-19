package sqlstore

import (
	"bytes"
	"context"
	"database/sql"
	"embed"
	"errors"
	"fmt"
	"strings"

	"text/template"

	sq "github.com/Masterminds/squirrel"

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

	assetsList, err := Assets.ReadDir("migrations")
	if err != nil {
		return err
	}
	assetNamesForDriver := make([]string, len(assetsList))
	for i, dirEntry := range assetsList {
		assetNamesForDriver[i] = dirEntry.Name()
	}

	schemaName, err := s.getSchemaName()
	if err != nil {
		return fmt.Errorf("error getting schema name: %w", err)
	}

	params := map[string]interface{}{
		"prefix":     s.tablePrefix,
		"postgres":   s.dbType == model.PostgresDBType,
		"sqlite":     s.dbType == model.SqliteDBType,
		"mysql":      s.dbType == model.MysqlDBType,
		"plugin":     s.isPlugin,
		"singleUser": s.isSingleUser,
		"schemaName": schemaName,
	}

	migrationAssets := &embedded.AssetSource{
		Names: assetNamesForDriver,
		AssetFunc: func(name string) ([]byte, error) {
			asset, mErr := Assets.ReadFile("migrations/" + name)
			if mErr != nil {
				return nil, mErr
			}

			tmpl, pErr := template.New("sql").Funcs(s.getTemplateHelperFuncs()).Parse(string(asset))
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

func (s *SQLStore) getTemplateHelperFuncs() template.FuncMap {
	funcs := template.FuncMap{
		"addColumnIfNeeded":    s.genAddColumnIfNeeded,
		"dropColumnIfNeeded":   s.genDropColumnIfNeeded,
		"createIndexIfNeeded":  s.genCreateIndexIfNeeded,
		"renameTableIfNeeded":  s.genRenameTableIfNeeded,
		"renameColumnIfNeeded": s.genRenameColumnIfNeeded,
		"doesTableExist":       s.doesTableExist,
		"doesColumnExist":      s.doesColumnExist,
	}
	return funcs
}

func (s *SQLStore) genAddColumnIfNeeded(schemaName, tableName, columnName, datatype, constraint string) (string, error) {
	tableName = addPrefixIfNeeded(tableName, s.tablePrefix)
	normTableName := normalizeTablename(schemaName, tableName)

	exists, err := s.doesColumnExist(schemaName, tableName, columnName)
	if err != nil {
		return "", err
	}

	if exists {
		return fmt.Sprintf("\n-- column '%s' already exists in table '%s'; add column skipped\n", columnName, tableName), nil
	}

	return fmt.Sprintf("\nALTER TABLE %s ADD COLUMN %s %s %s;\n", normTableName, columnName, datatype, constraint), nil
}

func (s *SQLStore) genDropColumnIfNeeded(schemaName, tableName, columnName string) (string, error) {
	tableName = addPrefixIfNeeded(tableName, s.tablePrefix)
	normTableName := normalizeTablename(schemaName, tableName)

	exists, err := s.doesColumnExist(schemaName, tableName, columnName)
	if err != nil {
		return "", err
	}

	if !exists {
		return fmt.Sprintf("\n-- column '%s' already dropped in table '%s'; drop column skipped\n", columnName, tableName), nil
	}

	if s.dbType == model.SqliteDBType {
		return fmt.Sprintf("\n-- Sqlite3 cannot drop columns for versions less than 3.35.0; drop column '%s' in table '%s' skipped\n", columnName, tableName), nil
	}

	return fmt.Sprintf("\nALTER TABLE %s DROP COLUMN %s;\n", normTableName, columnName), nil
}

func (s *SQLStore) genCreateIndexIfNeeded(schemaName, tableName, columns string) (string, error) {
	indexName := getIndexName(tableName, columns)
	tableName = addPrefixIfNeeded(tableName, s.tablePrefix)
	normTableName := normalizeTablename(schemaName, tableName)

	exists, err := s.doesIndexExist(schemaName, tableName, indexName)
	if err != nil {
		return "", err
	}

	if exists {
		return fmt.Sprintf("\n-- index '%s' already exists for table '%s'; create index skipped\n", indexName, tableName), nil
	}

	return fmt.Sprintf("\nCREATE INDEX %s ON %s (%s);\n", indexName, normTableName, columns), nil
}

func (s *SQLStore) genRenameTableIfNeeded(schemaName, oldTableName, newTableName string) (string, error) {
	oldTableName = addPrefixIfNeeded(oldTableName, s.tablePrefix)
	newTableName = addPrefixIfNeeded(newTableName, s.tablePrefix)

	exists, err := s.doesTableExist(schemaName, newTableName)
	if err != nil {
		return "", err
	}

	if exists {
		return fmt.Sprintf("\n-- table '%s' already exists; rename skipped\n", newTableName), nil
	}

	switch s.dbType {
	case model.MysqlDBType:
		return fmt.Sprintf("\nRENAME TABLE %s TO %s;\n", oldTableName, newTableName), nil
	case model.PostgresDBType, model.SqliteDBType:
		return fmt.Sprintf("\nALTER TABLE %s RENAME TO %s;\n", oldTableName, newTableName), nil
	default:
		return "", ErrUnsupportedDatabaseType
	}
}

func (s *SQLStore) genRenameColumnIfNeeded(schemaName, tableName, oldColumnName, newColumnName, dataType string) (string, error) {
	tableName = addPrefixIfNeeded(tableName, s.tablePrefix)

	exists, err := s.doesColumnExist(schemaName, tableName, newColumnName)
	if err != nil {
		return "", err
	}

	if exists {
		return fmt.Sprintf("\n-- column '%s' already exists for table '%s'; rename column skipped\n", newColumnName, tableName), nil
	}

	switch s.dbType {
	case model.MysqlDBType:
		return fmt.Sprintf("\nALTER TABLE %s CHANGE %s %s %s;\n", tableName, oldColumnName, newColumnName, dataType), nil
	case model.PostgresDBType, model.SqliteDBType:
		return fmt.Sprintf("\nALTER TABLE %s RENAME COLUMN %s TO %s;\n", tableName, oldColumnName, newColumnName), nil
	default:
		return "", ErrUnsupportedDatabaseType
	}
}

func (s *SQLStore) doesTableExist(schemaName, tableName string) (bool, error) {
	tableName = removePrefixIfNeeded(tableName, s.tablePrefix)
	var query sq.SelectBuilder

	switch s.dbType {
	case model.MysqlDBType, model.PostgresDBType:
		query = s.getQueryBuilder(s.db).
			Select("column_name").
			From("INFORMATION_SCHEMA.TABLES").
			Where(sq.Eq{
				"table_name":   tableName,
				"table_schema": schemaName,
			})
	case model.SqliteDBType:
		query = s.getQueryBuilder(s.db).
			Select("name").
			From("sqlite_master").
			Where(sq.Eq{
				"name": tableName,
				"type": "table",
			})
	default:
		return false, ErrUnsupportedDatabaseType
	}

	rows, err := query.Query()
	if err != nil {
		s.logger.Error(`doesTableExist ERROR`, mlog.Err(err))
		return false, err
	}
	defer s.CloseRows(rows)

	exists := rows.Next()
	sql, _, _ := query.ToSql()

	s.logger.Debug("doesTableExist",
		mlog.String("table", tableName),
		mlog.Bool("exists", exists),
		mlog.String("sql", sql),
	)
	return exists, nil
}

func (s *SQLStore) doesColumnExist(schemaName, tableName, columnName string) (bool, error) {
	tableName = removePrefixIfNeeded(tableName, s.tablePrefix)
	var query sq.SelectBuilder

	switch s.dbType {
	case model.MysqlDBType, model.PostgresDBType:
		query = s.getQueryBuilder(s.db).
			Select("column_name").
			From("INFORMATION_SCHEMA.COLUMNS").
			Where(sq.Eq{
				"table_name":   tableName,
				"table_schema": schemaName,
				"column_name":  columnName,
			})
	case model.SqliteDBType:
		query = s.getQueryBuilder(s.db).
			Select("name").
			From(fmt.Sprintf("pragma_table_info('%s')", tableName)).
			Where(sq.Eq{
				"name": columnName,
			})
	default:
		return false, ErrUnsupportedDatabaseType
	}

	rows, err := query.Query()
	if err != nil {
		s.logger.Error(`doesColumnExist ERROR`, mlog.Err(err))
		return false, err
	}
	defer s.CloseRows(rows)

	exists := rows.Next()
	sql, _, _ := query.ToSql()

	s.logger.Debug("doesColumnExist",
		mlog.String("table", tableName),
		mlog.String("column", columnName),
		mlog.Bool("exists", exists),
		mlog.String("sql", sql),
	)
	return exists, nil
}

func (s *SQLStore) doesIndexExist(schemaName, tableName, indexName string) (bool, error) {
	tableName = removePrefixIfNeeded(tableName, s.tablePrefix)
	var query sq.SelectBuilder

	switch s.dbType {
	case model.MysqlDBType, model.PostgresDBType:
		query = s.getQueryBuilder(s.db).
			Select("column_name").
			From("INFORMATION_SCHEMA.STATISTICS").
			Where(sq.Eq{
				"table_name":   tableName,
				"table_schema": schemaName,
				"index_name":   indexName,
			})
	case model.SqliteDBType:
		query = s.getQueryBuilder(s.db).
			Select("name").
			From(fmt.Sprintf("pragma_index_list('%s')", tableName)).
			Where(sq.Eq{
				"name": indexName,
			})
	default:
		return false, ErrUnsupportedDatabaseType
	}

	rows, err := query.Query()
	if err != nil {
		s.logger.Error(`doesIndexExist ERROR`, mlog.Err(err))
		return false, err
	}
	defer s.CloseRows(rows)

	exists := rows.Next()
	sql, _, _ := query.ToSql()

	s.logger.Debug("doesIndexExist",
		mlog.String("table", tableName),
		mlog.String("index", indexName),
		mlog.Bool("exists", exists),
		mlog.String("sql", sql),
	)
	return exists, nil
}

func addPrefixIfNeeded(s, prefix string) string {
	if !strings.HasPrefix(s, prefix) {
		return prefix + s
	}
	return s
}

func removePrefixIfNeeded(s, prefix string) string {
	if strings.HasPrefix(s, prefix) {
		return s[len(prefix):]
	}
	return s
}

func normalizeTablename(schemaName, tableName string) string {
	if schemaName != "" && !strings.HasPrefix(tableName, schemaName+".") {
		tableName = schemaName + "." + tableName
	}
	return tableName
}

func getIndexName(tableName string, columns string) string {
	var sb strings.Builder

	_, _ = sb.WriteString("idx_")
	_, _ = sb.WriteString(tableName)

	// allow developers to separate column names with spaces and/or commas
	columns = strings.ReplaceAll(columns, ",", " ")
	cols := strings.Split(columns, " ")

	for _, s := range cols {
		sub := strings.TrimSpace(s)
		if sub == "" {
			continue
		}

		_, _ = sb.WriteString("_")
		_, _ = sb.WriteString(s)
	}
	return sb.String()
}
