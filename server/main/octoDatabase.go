package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"time"

	_ "github.com/lib/pq"
	_ "github.com/mattn/go-sqlite3"
)

// SQLStore is a SQL database
type SQLStore struct {
	db     *sql.DB
	dbType string
}

// NewSQLStore creates a new SQLStore
func NewSQLStore(dbType, connectionString string) (*SQLStore, error) {
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

	err = store.createTablesIfNotExists()
	if err != nil {
		log.Println(`Table creation failed`)
		return nil, err
	}
	return store, nil
}

// Block is the basic data unit
type Block struct {
	ID       string                 `json:"id"`
	ParentID string                 `json:"parentId"`
	Schema   int64                  `json:"schema"`
	Type     string                 `json:"type"`
	Title    string                 `json:"title"`
	Fields   map[string]interface{} `json:"fields"`
	CreateAt int64                  `json:"createAt"`
	UpdateAt int64                  `json:"updateAt"`
	DeleteAt int64                  `json:"deleteAt"`
}

func (s *SQLStore) createTablesIfNotExists() error {
	// TODO: Add update_by with the user's ID
	// TODO: Consolidate insert_at and update_at, decide if the server of DB should set it
	var query string
	if s.dbType == "sqlite3" {
		query = `CREATE TABLE IF NOT EXISTS blocks (
			id VARCHAR(36),
			insert_at DATETIME NOT NULL DEFAULT(STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW')),
			parent_id VARCHAR(36),
			schema BIGINT,
			type TEXT,
			title TEXT,
			fields TEXT,
			create_at BIGINT,
			update_at BIGINT,
			delete_at BIGINT,
			PRIMARY KEY (id, insert_at)
		);`
	} else {
		query = `CREATE TABLE IF NOT EXISTS blocks (
			id VARCHAR(36),
			insert_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			parent_id VARCHAR(36),
			schema BIGINT,
			type TEXT,
			title TEXT,
			fields TEXT,
			create_at BIGINT,
			update_at BIGINT,
			delete_at BIGINT,
			PRIMARY KEY (id, insert_at)
		);`
	}

	_, err := s.db.Exec(query)
	if err != nil {
		log.Fatal("createTablesIfNotExists: ", err)
		return err
	}
	log.Printf("createTablesIfNotExists(%s)", s.dbType)
	return nil
}

func (s *SQLStore) getBlocksWithParentAndType(parentID string, blockType string) []Block {
	query := `WITH latest AS
		(
			SELECT * FROM
			(
				SELECT
					*,
					ROW_NUMBER() OVER (PARTITION BY id ORDER BY insert_at DESC) AS rn
				FROM blocks
			) a
			WHERE rn = 1
		)

		SELECT id, parent_id, schema, type, title, COALESCE("fields", '{}'), create_at, update_at, delete_at
		FROM latest
		WHERE delete_at = 0 and parent_id = $1 and type = $2`

	rows, err := s.db.Query(query, parentID, blockType)
	if err != nil {
		log.Printf(`getBlocksWithParentAndType ERROR: %v`, err)
		panic(err)
	}

	return blocksFromRows(rows)
}

func (s *SQLStore) getBlocksWithParent(parentID string) []Block {
	query := `WITH latest AS
		(
			SELECT * FROM
			(
				SELECT
					*,
					ROW_NUMBER() OVER (PARTITION BY id ORDER BY insert_at DESC) AS rn
				FROM blocks
			) a
			WHERE rn = 1
		)

		SELECT id, parent_id, schema, type, title, COALESCE("fields", '{}'), create_at, update_at, delete_at
		FROM latest
		WHERE delete_at = 0 and parent_id = $1`

	rows, err := s.db.Query(query, parentID)
	if err != nil {
		log.Printf(`getBlocksWithParent ERROR: %v`, err)
		panic(err)
	}

	return blocksFromRows(rows)
}

func (s *SQLStore) getBlocksWithType(blockType string) []Block {
	query := `WITH latest AS
		(
			SELECT * FROM
			(
				SELECT
					*,
					ROW_NUMBER() OVER (PARTITION BY id ORDER BY insert_at DESC) AS rn
				FROM blocks
			) a
			WHERE rn = 1
		)

		SELECT id, parent_id, schema, type, title, COALESCE("fields", '{}'), create_at, update_at, delete_at
		FROM latest
		WHERE delete_at = 0 and type = $1`

	rows, err := s.db.Query(query, blockType)
	if err != nil {
		log.Printf(`getBlocksWithParentAndType ERROR: %v`, err)
		panic(err)
	}

	return blocksFromRows(rows)
}

func (s *SQLStore) getSubTree(blockID string) []Block {
	query := `WITH latest AS
	(
		SELECT * FROM
		(
			SELECT
				*,
				ROW_NUMBER() OVER (PARTITION BY id ORDER BY insert_at DESC) AS rn
			FROM blocks
		) a
		WHERE rn = 1
	)

	SELECT id, parent_id, schema, type, title, COALESCE("fields", '{}'), create_at, update_at, delete_at
	FROM latest
	WHERE delete_at = 0
		AND (id = $1
			OR parent_id = $1)`

	rows, err := s.db.Query(query, blockID)
	if err != nil {
		log.Printf(`getSubTree ERROR: %v`, err)
		panic(err)
	}

	return blocksFromRows(rows)
}

func (s *SQLStore) getAllBlocks() []Block {
	query := `WITH latest AS
	(
		SELECT * FROM
		(
			SELECT
				*,
				ROW_NUMBER() OVER (PARTITION BY id ORDER BY insert_at DESC) AS rn
			FROM blocks
		) a
		WHERE rn = 1
	)

	SELECT id, parent_id, schema, type, title, COALESCE("fields", '{}'), create_at, update_at, delete_at
	FROM latest
	WHERE delete_at = 0`

	rows, err := s.db.Query(query)
	if err != nil {
		log.Printf(`getAllBlocks ERROR: %v`, err)
		panic(err)
	}

	return blocksFromRows(rows)
}

func blocksFromRows(rows *sql.Rows) []Block {
	defer rows.Close()

	var results []Block

	for rows.Next() {
		var block Block
		var fieldsJSON string
		err := rows.Scan(
			&block.ID,
			&block.ParentID,
			&block.Schema,
			&block.Type,
			&block.Title,
			&fieldsJSON,
			&block.CreateAt,
			&block.UpdateAt,
			&block.DeleteAt)
		if err != nil {
			// handle this error
			log.Printf(`ERROR blocksFromRows: %v`, err)
			panic(err)
		}

		err = json.Unmarshal([]byte(fieldsJSON), &block.Fields)
		if err != nil {
			// handle this error
			log.Printf(`ERROR blocksFromRows fields: %v`, err)
			panic(err)
		}

		results = append(results, block)
	}

	return results
}

func (s *SQLStore) getParentID(blockID string) string {
	statement :=
		`WITH latest AS
		(
			SELECT * FROM
			(
				SELECT
					*,
					ROW_NUMBER() OVER (PARTITION BY id ORDER BY insert_at DESC) AS rn
				FROM blocks
			) a
			WHERE rn = 1
		)

		SELECT parent_id
		FROM latest
		WHERE delete_at = 0
			AND id = $1`

	row := s.db.QueryRow(statement, blockID)

	var parentID string
	err := row.Scan(&parentID)
	if err != nil {
		return ""
	}

	return parentID
}

func (s *SQLStore) insertBlock(block Block) {
	fieldsJSON, err := json.Marshal(block.Fields)
	if err != nil {
		panic(err)
	}

	statement := `INSERT INTO blocks(
		id,
		parent_id,
		schema,
		type,
		title,
		fields,
		create_at,
		update_at,
		delete_at
	)
	VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9)`
	_, err = s.db.Exec(
		statement,
		block.ID,
		block.ParentID,
		block.Schema,
		block.Type,
		block.Title,
		fieldsJSON,
		block.CreateAt,
		block.UpdateAt,
		block.DeleteAt)
	if err != nil {
		panic(err)
	}
}

func (s *SQLStore) deleteBlock(blockID string) {
	now := time.Now().Unix()
	json := fmt.Sprintf(`{"id":"%s","updateAt":%d,"deleteAt":%d}`, blockID, now, now)
	statement := `INSERT INTO blocks(id, json, update_at, delete_at) VALUES($1, $2, $3, $4)`
	_, err := s.db.Exec(statement, blockID, json, now, now)
	if err != nil {
		panic(err)
	}
}
