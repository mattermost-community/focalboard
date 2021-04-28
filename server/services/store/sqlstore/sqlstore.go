package sqlstore

import (
	"database/sql"
	"log"

	sq "github.com/Masterminds/squirrel"
)

const (
	mysqlDBType    = "mysql"
	sqliteDBType   = "sqlite3"
	postgresDBType = "postgres"
)

// SQLStore is a SQL database.
type SQLStore struct {
	db          *sql.DB
	dbType      string
	tablePrefix string
}

// New creates a new SQL implementation of the store.
func New(dbType, connectionString string, tablePrefix string) (*SQLStore, error) {
	log.Println("connectDatabase", dbType, connectionString)
	var err error

	db, err := sql.Open(dbType, connectionString)
	if err != nil {
		log.Print("connectDatabase: ", err)

		return nil, err
	}

	err = db.Ping()
	if err != nil {
		log.Printf(`Database Ping failed: %v`, err)

		return nil, err
	}

	store := &SQLStore{
		db:          db,
		dbType:      dbType,
		tablePrefix: tablePrefix,
	}

	err = store.Migrate()
	if err != nil {
		log.Printf(`Table creation / migration failed: %v`, err)

		return nil, err
	}

	err = store.InitializeTemplates()
	if err != nil {
		log.Printf(`InitializeTemplates failed: %v`, err)

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
