package sqlstore

import (
	"database/sql"

	sq "github.com/Masterminds/squirrel"
	"github.com/mattermost/focalboard/server/services/mlog"
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
	logger           *mlog.Logger
}

// New creates a new SQL implementation of the store.
func New(dbType, connectionString string, tablePrefix string, logger *mlog.Logger) (*SQLStore, error) {
	logger.Info("connectDatabase", mlog.String("dbType", dbType), mlog.String("connStr", connectionString))
	var err error

	db, err := sql.Open(dbType, connectionString)
	if err != nil {
		logger.Error("connectDatabase failed", mlog.Err(err))

		return nil, err
	}

	err = db.Ping()
	if err != nil {
		logger.Error(`Database Ping failed`, mlog.Err(err))

		return nil, err
	}

	store := &SQLStore{
		db:               db,
		dbType:           dbType,
		tablePrefix:      tablePrefix,
		connectionString: connectionString,
		logger:           logger,
	}

	err = store.Migrate()
	if err != nil {
		logger.Error(`Table creation / migration failed`, mlog.Err(err))

		return nil, err
	}

	err = store.InitializeTemplates()
	if err != nil {
		logger.Error(`InitializeTemplates failed`, mlog.Err(err))

		return nil, err
	}

	return store, nil
}

// Shutdown close the connection with the store.
func (s *SQLStore) Shutdown() error {
	return s.db.Close()
}

func (s *SQLStore) getQueryBuilder() sq.StatementBuilderType {
	builder := sq.StatementBuilder
	if s.dbType == postgresDBType || s.dbType == sqliteDBType {
		builder = builder.PlaceholderFormat(sq.Dollar)
	}

	return builder.RunWith(s.db)
}

func (s *SQLStore) escapeField(fieldName string) string {
	if s.dbType == mysqlDBType {
		return "`" + fieldName + "`"
	}
	if s.dbType == postgresDBType || s.dbType == sqliteDBType {
		return "\"" + fieldName + "\""
	}
	return fieldName
}
