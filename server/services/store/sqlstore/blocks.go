package sqlstore

import (
	"database/sql"
	"encoding/json"
	"errors"
	"log"
	"time"

	sq "github.com/Masterminds/squirrel"
	_ "github.com/lib/pq"
	"github.com/mattermost/focalboard/server/model"
	_ "github.com/mattn/go-sqlite3"
)

func (s *SQLStore) latestsBlocksSubquery() sq.SelectBuilder {
	internalQuery := sq.Select("*", "ROW_NUMBER() OVER (PARTITION BY id ORDER BY insert_at DESC) AS rn").From("blocks")

	return sq.Select("*").
		FromSelect(internalQuery, "a").
		Where(sq.Eq{"rn": 1}).
		Where(sq.Eq{"delete_at": 0})
}

func (s *SQLStore) GetBlocksWithParentAndType(parentID string, blockType string) ([]model.Block, error) {
	query := s.getQueryBuilder().
		Select(
			"id",
			"parent_id",
			"root_id",
			"modified_by",
			"schema",
			"type",
			"title",
			"COALESCE(\"fields\", '{}')",
			"create_at",
			"update_at",
			"delete_at",
		).
		FromSelect(s.latestsBlocksSubquery(), "latest").
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
		Select(
			"id",
			"parent_id",
			"root_id",
			"modified_by",
			"schema",
			"type",
			"title",
			"COALESCE(\"fields\", '{}')",
			"create_at",
			"update_at",
			"delete_at",
		).
		FromSelect(s.latestsBlocksSubquery(), "latest").
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
		Select(
			"id",
			"parent_id",
			"root_id",
			"modified_by",
			"schema",
			"type",
			"title",
			"COALESCE(\"fields\", '{}')",
			"create_at",
			"update_at",
			"delete_at",
		).
		FromSelect(s.latestsBlocksSubquery(), "latest").
		Where(sq.Eq{"type": blockType})

	rows, err := query.Query()
	if err != nil {
		log.Printf(`getBlocksWithParentAndType ERROR: %v`, err)

		return nil, err
	}

	return blocksFromRows(rows)
}

// GetSubTree2 returns blocks within 2 levels of the given blockID
func (s *SQLStore) GetSubTree2(blockID string) ([]model.Block, error) {
	query := s.getQueryBuilder().
		Select(
			"id",
			"parent_id",
			"root_id",
			"modified_by",
			"schema",
			"type",
			"title",
			"COALESCE(\"fields\", '{}')",
			"create_at",
			"update_at",
			"delete_at",
		).
		FromSelect(s.latestsBlocksSubquery(), "latest").
		Where(sq.Or{sq.Eq{"id": blockID}, sq.Eq{"parent_id": blockID}})

	rows, err := query.Query()
	if err != nil {
		log.Printf(`getSubTree ERROR: %v`, err)

		return nil, err
	}

	return blocksFromRows(rows)
}

// GetSubTree3 returns blocks within 3 levels of the given blockID
func (s *SQLStore) GetSubTree3(blockID string) ([]model.Block, error) {
	// This first subquery returns repeated blocks
	subquery1 := sq.Select(
		"l3.id",
		"l3.parent_id",
		"l3.root_id",
		"l3.modified_by",
		"l3.schema",
		"l3.type",
		"l3.title",
		"l3.fields",
		"l3.create_at",
		"l3.update_at",
		"l3.delete_at",
	).
		FromSelect(s.latestsBlocksSubquery(), "l1").
		JoinClause(s.latestsBlocksSubquery().Prefix("JOIN (").Suffix(") l2 on l2.parent_id = l1.id or l2.id = l1.id")).
		JoinClause(s.latestsBlocksSubquery().Prefix("JOIN (").Suffix(") l3 on l3.parent_id = l2.id or l3.id = l2.id")).
		Where(sq.Eq{"l1.id": blockID})

	// This second subquery is used to return distinct blocks
	// We can't use DISTINCT because JSON columns in Postgres don't support it, and SQLite doesn't support DISTINCT ON
	subquery2 := sq.Select("*", "ROW_NUMBER() OVER (PARTITION BY id) AS rn").
		FromSelect(subquery1, "sub1")

	query := s.getQueryBuilder().Select(
		"id",
		"parent_id",
		"root_id",
		"modified_by",
		"schema",
		"type",
		"title",
		"COALESCE(\"fields\", '{}')",
		"create_at",
		"update_at",
		"delete_at",
	).
		FromSelect(subquery2, "sub2").
		Where(sq.Eq{"rn": 1})

	rows, err := query.Query()
	if err != nil {
		log.Printf(`getSubTree3 ERROR: %v`, err)

		return nil, err
	}

	return blocksFromRows(rows)
}

func (s *SQLStore) GetAllBlocks() ([]model.Block, error) {
	query := s.getQueryBuilder().
		Select(
			"id",
			"parent_id",
			"root_id",
			"modified_by",
			"schema",
			"type",
			"title",
			"COALESCE(\"fields\", '{}')",
			"create_at",
			"update_at",
			"delete_at",
		).
		FromSelect(s.latestsBlocksSubquery(), "latest")

	rows, err := query.Query()
	if err != nil {
		log.Printf(`getAllBlocks ERROR: %v`, err)

		return nil, err
	}

	return blocksFromRows(rows)
}

func blocksFromRows(rows *sql.Rows) ([]model.Block, error) {
	defer rows.Close()

	var results = []model.Block{}

	for rows.Next() {
		var block model.Block
		var fieldsJSON string
		var modifiedBy sql.NullString

		err := rows.Scan(
			&block.ID,
			&block.ParentID,
			&block.RootID,
			&modifiedBy,
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

		if modifiedBy.Valid {
			block.ModifiedBy = modifiedBy.String
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

func (s *SQLStore) GetRootID(blockID string) (string, error) {
	query := s.getQueryBuilder().Select("root_id").
		FromSelect(s.latestsBlocksSubquery(), "latest").
		Where(sq.Eq{"id": blockID})

	row := query.QueryRow()

	var rootID string

	err := row.Scan(&rootID)
	if err != nil {
		return "", err
	}

	return rootID, nil
}

func (s *SQLStore) GetParentID(blockID string) (string, error) {
	query := s.getQueryBuilder().Select("parent_id").
		FromSelect(s.latestsBlocksSubquery(), "latest").
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
	if block.RootID == "" {
		return errors.New("rootId is nil")
	}

	fieldsJSON, err := json.Marshal(block.Fields)
	if err != nil {
		return err
	}

	query := s.getQueryBuilder().Insert("blocks").
		Columns(
			"id",
			"parent_id",
			"root_id",
			"modified_by",
			"schema",
			"type",
			"title",
			"fields",
			"create_at",
			"update_at",
			"delete_at",
		).Values(
		block.ID,
		block.ParentID,
		block.RootID,
		block.ModifiedBy,
		block.Schema,
		block.Type,
		block.Title,
		fieldsJSON,
		block.CreateAt,
		block.UpdateAt,
		block.DeleteAt,
	)

	_, err = query.Exec()
	if err != nil {
		return err
	}

	return nil
}

func (s *SQLStore) DeleteBlock(blockID string, modifiedBy string) error {
	now := time.Now().Unix()
	query := s.getQueryBuilder().Insert("blocks").
		Columns(
			"id",
			"modified_by",
			"update_at",
			"delete_at",
		).
		Values(
			blockID,
			modifiedBy,
			now,
			now,
		)

	_, err := query.Exec()
	if err != nil {
		return err
	}

	return nil
}
