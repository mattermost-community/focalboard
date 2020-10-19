package sqlstore

import (
	"database/sql"
	"encoding/json"
	"log"
	"time"

	_ "github.com/lib/pq"
	"github.com/mattermost/mattermost-octo-tasks/server/model"
	_ "github.com/mattn/go-sqlite3"
)

func (s *SQLStore) GetBlocksWithParentAndType(parentID string, blockType string) ([]model.Block, error) {
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
		return nil, err
	}

	return blocksFromRows(rows)
}

func (s *SQLStore) GetBlocksWithParent(parentID string) ([]model.Block, error) {
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
		return nil, err
	}

	return blocksFromRows(rows)
}

func (s *SQLStore) GetBlocksWithType(blockType string) ([]model.Block, error) {
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
		return nil, err
	}

	return blocksFromRows(rows)
}

func (s *SQLStore) GetSubTree(blockID string) ([]model.Block, error) {
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
		return nil, err
	}

	return blocksFromRows(rows)
}

func (s *SQLStore) GetAllBlocks() ([]model.Block, error) {
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
		return nil, err
	}

	return blocksFromRows(rows)
}

func blocksFromRows(rows *sql.Rows) ([]model.Block, error) {
	defer rows.Close()

	var results []model.Block

	for rows.Next() {
		var block model.Block
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
			return nil, err
		}

		err = json.Unmarshal([]byte(fieldsJSON), &block.Fields)
		if err != nil {
			// handle this error
			log.Printf(`ERROR blocksFromRows fields: %v`, err)
			return nil, err
		}

		results = append(results, block)
	}

	return results, nil
}

func (s *SQLStore) GetParentID(blockID string) (string, error) {
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
		return "", err
	}

	return parentID, nil
}

func (s *SQLStore) InsertBlock(block model.Block) error {
	fieldsJSON, err := json.Marshal(block.Fields)
	if err != nil {
		return err
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
		return err
	}
	return nil
}

func (s *SQLStore) DeleteBlock(blockID string) error {
	now := time.Now().Unix()
	statement := `INSERT INTO blocks(id, update_at, delete_at) VALUES($1, $2, $3)`
	_, err := s.db.Exec(statement, blockID, now, now)
	if err != nil {
		return err
	}
	return nil
}
