package sqlstore

import (
	"database/sql"

	sq "github.com/Masterminds/squirrel"

	"github.com/mattermost/mattermost-plugin-api/cluster"
	"github.com/mattermost/mattermost-server/v6/shared/mlog"
)

const (
	mysqlDBType    = "mysql"
	sqliteDBType   = "sqlite3"
	postgresDBType = "postgres"
)

// SQLStore is a SQL database.
type SQLStore struct {
	db               *sql.DB
	dbType           string
	tablePrefix      string
	connectionString string
	isPlugin         bool
	logger           *mlog.Logger
	NewMutexFn       MutexFactory
}

// MutexFactory is used by the store in plugin mode to generate
// a cluster mutex.
type MutexFactory func(name string) (*cluster.Mutex, error)

// New creates a new SQL implementation of the store.
func New(params Params) (*SQLStore, error) {
	if err := params.CheckValid(); err != nil {
		return nil, err
	}

	params.Logger.Info("connectDatabase", mlog.String("dbType", params.DBType))
	store := &SQLStore{
		// TODO: add replica DB support too.
		db:               params.DB,
		dbType:           params.DBType,
		tablePrefix:      params.TablePrefix,
		connectionString: params.ConnectionString,
		logger:           params.Logger,
		isPlugin:         params.IsPlugin,
		NewMutexFn:       params.NewMutexFn,
	}

	err := store.Migrate()
	if err != nil {
		params.Logger.Error(`Table creation / migration failed`, mlog.Err(err))

		return nil, err
	}

	if err := store.InitializeTemplates(); err != nil {
		params.Logger.Error(`InitializeTemplates failed`, mlog.Err(err))
	}

	return store, nil
}

// Shutdown close the connection with the store.
func (s *SQLStore) Shutdown() error {
	return s.db.Close()
}

// DBHandle returns the raw sql.DB handle.
// It is used by the mattermostauthlayer to run their own
// raw SQL queries.
func (s *SQLStore) DBHandle() *sql.DB {
	return s.db
}

func (s *SQLStore) getQueryBuilder(db sq.BaseRunner) sq.StatementBuilderType {
	builder := sq.StatementBuilder
	if s.dbType == postgresDBType || s.dbType == sqliteDBType {
		builder = builder.PlaceholderFormat(sq.Dollar)
	}

	return builder.RunWith(db)
}

func (s *SQLStore) escapeField(fieldName string) string { //nolint:unparam
	if s.dbType == mysqlDBType {
		return "`" + fieldName + "`"
	}
	if s.dbType == postgresDBType || s.dbType == sqliteDBType {
		return "\"" + fieldName + "\""
	}
	return fieldName
}
