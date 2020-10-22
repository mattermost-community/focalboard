package sqlstore

import (
	"database/sql"
	"log"

	sq "github.com/Masterminds/squirrel"
)

// SQLStore is a SQL database.
type SQLStore struct {
	db     *sql.DB
	dbType string
}

// New creates a new SQL implementation of the store.
func New(dbType, connectionString string) (*SQLStore, error) {
	log.Println("connectDatabase")
	var err error

	db, err := sql.Open(dbType, connectionString)
	if err != nil {
		log.Fatal("connectDatabase: ", err)

		return nil, err
	}

	err = db.Ping()
	if err != nil {
		log.Printf(`Database Ping failed: %v`, err)

		return nil, err
	}

	store := &SQLStore{
		db:     db,
		dbType: dbType,
	}

	err = store.Migrate()
	if err != nil {
		log.Printf(`Table creation / migration failed: %v`, err)

		return nil, err
	}

	return store, nil
}

// Shutdown close the connection with the store.
func (s *SQLStore) Shutdown() error {
	return s.db.Close()
}

func (s *SQLStore) getQueryBuilder() sq.StatementBuilderType {
	builder := sq.StatementBuilder.PlaceholderFormat(sq.Dollar)

	return builder.RunWith(s.db)
}
