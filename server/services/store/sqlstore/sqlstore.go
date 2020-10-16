package sqlstore

import (
	"database/sql"
	"log"
)

// SQLStore is a SQL database
type SQLStore struct {
	db     *sql.DB
	dbType string
}

// New creates a new SQL implementation of the store
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
		log.Println(`Database Ping failed`)
		return nil, err
	}

	store := &SQLStore{
		db:     db,
		dbType: dbType,
	}

	// err = store.createTablesIfNotExists()
	err = store.Migrate()
	if err != nil {
		log.Println(`Table creation failed`)
		return nil, err
	}
	return store, nil
}

func (s *SQLStore) Shutdown() error {
	return s.db.Close()
}
