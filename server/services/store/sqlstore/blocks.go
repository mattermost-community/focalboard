package sqlstore

import (
	"database/sql"
	"encoding/json"
	"log"
	"time"

	sq "github.com/Masterminds/squirrel"
	_ "github.com/lib/pq"
	"github.com/mattermost/mattermost-octo-tasks/server/model"
	_ "github.com/mattn/go-sqlite3"
)

func (s *SQLStore) latestsBlocksSubquery() sq.SelectBuilder {
	internalQuery := sq.Select("*", "ROW_NUMBER() OVER (PARTITION BY id ORDER BY insert_at DESC) AS rn").From("blocks")

	return sq.Select("*").FromSelect(internalQuery, "a").Where(sq.Eq{"rn": 1})
}

func (s *SQLStore) GetBlocksWithParentAndType(parentID string, blockType string) ([]model.Block, error) {
	query := s.getQueryBuilder().
		Select("id", "parent_id", "schema", "type", "title",
			"COALESCE(\"fields\", '{}')", "create_at", "update_at",
			"delete_at").
		FromSelect(s.latestsBlocksSubquery(), "latest").
		Where(sq.Eq{"delete_at": 0}).
		Where(sq.Eq{"parent_id": parentID}).
		Where(sq.Eq{"type": blockType})

	rows, err := query.Query()
	if err != nil {
		log.Printf(`getBlocksWithParentAndType ERROR: %v`, err)

		return nil, err
	}

	return blocksFromRows(rows)
}

func (s *SQLStore) GetBlocksWithParent(parentID string) ([]model.Block, error) {
	query := s.getQueryBuilder().
		Select("id", "parent_id", "schema", "type", "title",
			"COALESCE(\"fields\", '{}')", "create_at", "update_at",
			"delete_at").
		FromSelect(s.latestsBlocksSubquery(), "latest").
		Where(sq.Eq{"delete_at": 0}).
		Where(sq.Eq{"parent_id": parentID})

	rows, err := query.Query()
	if err != nil {
		log.Printf(`getBlocksWithParent ERROR: %v`, err)

		return nil, err
	}

	return blocksFromRows(rows)
}

func (s *SQLStore) GetBlocksWithType(blockType string) ([]model.Block, error) {
	query := s.getQueryBuilder().
		Select("id", "parent_id", "schema", "type", "title",
			"COALESCE(\"fields\", '{}')", "create_at", "update_at",
			"delete_at").
		FromSelect(s.latestsBlocksSubquery(), "latest").
		Where(sq.Eq{"delete_at": 0}).
		Where(sq.Eq{"type": blockType})

	rows, err := query.Query()
	if err != nil {
		log.Printf(`getBlocksWithParentAndType ERROR: %v`, err)

		return nil, err
	}

	return blocksFromRows(rows)
}

func (s *SQLStore) GetSubTree(blockID string) ([]model.Block, error) {
	query := s.getQueryBuilder().
		Select("id", "parent_id", "schema", "type", "title",
			"COALESCE(\"fields\", '{}')", "create_at", "update_at",
			"delete_at").
		FromSelect(s.latestsBlocksSubquery(), "latest").
		Where(sq.Eq{"delete_at": 0}).
		Where(sq.Or{sq.Eq{"id": blockID}, sq.Eq{"parent_id": blockID}})

	rows, err := query.Query()
	if err != nil {
		log.Printf(`getSubTree ERROR: %v`, err)

		return nil, err
	}

	return blocksFromRows(rows)
}

func (s *SQLStore) GetAllBlocks() ([]model.Block, error) {
	query := s.getQueryBuilder().
		Select("id", "parent_id", "schema", "type", "title",
			"COALESCE(\"fields\", '{}')", "create_at", "update_at",
			"delete_at").
		FromSelect(s.latestsBlocksSubquery(), "latest").
		Where(sq.Eq{"delete_at": 0})

	rows, err := query.Query()
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
	query := s.getQueryBuilder().Select("parent_id").
		FromSelect(s.latestsBlocksSubquery(), "latest").
		Where(sq.Eq{"delete_at": 0}).
		Where(sq.Eq{"id": blockID})

	row := query.QueryRow()

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

	query := s.getQueryBuilder().Insert("blocks").
		Columns("id", "parent_id", "schema", "type", "title", "fields", "create_at", "update_at", "delete_at").
		Values(block.ID, block.ParentID, block.Schema, block.Type, block.Title,
			fieldsJSON, block.CreateAt, block.UpdateAt, block.DeleteAt)

	_, err = query.Exec()
	if err != nil {
		return err
	}

	return nil
}

func (s *SQLStore) DeleteBlock(blockID string) error {
	now := time.Now().Unix()
	query := s.getQueryBuilder().Insert("blocks").Columns("id", "update_at", "delete_at").Values(blockID, now, now)

	_, err := query.Exec()
	if err != nil {
		return err
	}

	return nil
}
