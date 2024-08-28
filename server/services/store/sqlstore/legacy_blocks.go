package sqlstore

import (
	"database/sql"
	"encoding/json"

	"github.com/mattermost/focalboard/server/utils"

	sq "github.com/Masterminds/squirrel"
	"github.com/mattermost/focalboard/server/model"

	"github.com/mattermost/mattermost/server/public/shared/mlog"
)

// legacyBlocksFromRows is the old getBlock version that still uses
// the old block model. This method is kept to enable the unique IDs
// data migration.
func (s *SQLStore) legacyBlocksFromRows(rows *sql.Rows) ([]*model.Block, error) {
	results := []*model.Block{}

	for rows.Next() {
		var block model.Block
		var fieldsJSON string
		var modifiedBy sql.NullString
		var insertAt string

		err := rows.Scan(
			&block.ID,
			&block.ParentID,
			&block.BoardID,
			&block.CreatedBy,
			&modifiedBy,
			&block.Schema,
			&block.Type,
			&block.Title,
			&fieldsJSON,
			&insertAt,
			&block.CreateAt,
			&block.UpdateAt,
			&block.DeleteAt,
			&block.WorkspaceID)
		if err != nil {
			// handle this error
			s.logger.Error(`ERROR blocksFromRows`, mlog.Err(err))

			return nil, err
		}

		if modifiedBy.Valid {
			block.ModifiedBy = modifiedBy.String
		}

		err = json.Unmarshal([]byte(fieldsJSON), &block.Fields)
		if err != nil {
			// handle this error
			s.logger.Error(`ERROR blocksFromRows fields`, mlog.Err(err))

			return nil, err
		}

		results = append(results, &block)
	}

	return results, nil
}

// getLegacyBlock is the old getBlock version that still uses the old
// block model. This method is kept to enable the unique IDs data
// migration.
func (s *SQLStore) getLegacyBlock(db sq.BaseRunner, workspaceID string, blockID string) (*model.Block, error) {
	query := s.getQueryBuilder(db).
		Select(
			"id",
			"parent_id",
			"root_id",
			"created_by",
			"modified_by",
			s.escapeField("schema"),
			"type",
			"title",
			"COALESCE(fields, '{}')",
			"insert_at",
			"create_at",
			"update_at",
			"delete_at",
			"COALESCE(workspace_id, '0')",
		).
		From(s.tablePrefix + "blocks").
		Where(sq.Eq{"id": blockID}).
		Where(sq.Eq{"coalesce(workspace_id, '0')": workspaceID})

	rows, err := query.Query()
	if err != nil {
		s.logger.Error(`GetBlock ERROR`, mlog.Err(err))
		return nil, err
	}

	blocks, err := s.legacyBlocksFromRows(rows)
	if err != nil {
		return nil, err
	}

	if len(blocks) == 0 {
		return nil, nil
	}

	return blocks[0], nil
}

// insertLegacyBlock is the old insertBlock version that still uses
// the old block model. This method is kept to enable the unique IDs
// data migration.
func (s *SQLStore) insertLegacyBlock(db sq.BaseRunner, workspaceID string, block *model.Block, userID string) error {
	if block.BoardID == "" {
		return model.ErrBlockEmptyBoardID
	}

	fieldsJSON, err := json.Marshal(block.Fields)
	if err != nil {
		return err
	}

	existingBlock, err := s.getLegacyBlock(db, workspaceID, block.ID)
	if err != nil {
		return err
	}

	block.UpdateAt = utils.GetMillis()
	block.ModifiedBy = userID

	insertQuery := s.getQueryBuilder(db).Insert("").
		Columns(
			"workspace_id",
			"id",
			"parent_id",
			"root_id",
			"created_by",
			"modified_by",
			s.escapeField("schema"),
			"type",
			"title",
			"fields",
			"create_at",
			"update_at",
			"delete_at",
		)

	insertQueryValues := map[string]interface{}{
		"workspace_id":          workspaceID,
		"id":                    block.ID,
		"parent_id":             block.ParentID,
		"root_id":               block.BoardID,
		s.escapeField("schema"): block.Schema,
		"type":                  block.Type,
		"title":                 block.Title,
		"fields":                fieldsJSON,
		"delete_at":             block.DeleteAt,
		"created_by":            block.CreatedBy,
		"modified_by":           block.ModifiedBy,
		"create_at":             block.CreateAt,
		"update_at":             block.UpdateAt,
	}

	if existingBlock != nil {
		// block with ID exists, so this is an update operation
		query := s.getQueryBuilder(db).Update(s.tablePrefix+"blocks").
			Where(sq.Eq{"id": block.ID}).
			Where(sq.Eq{"COALESCE(workspace_id, '0')": workspaceID}).
			Set("parent_id", block.ParentID).
			Set("root_id", block.BoardID).
			Set("modified_by", block.ModifiedBy).
			Set(s.escapeField("schema"), block.Schema).
			Set("type", block.Type).
			Set("title", block.Title).
			Set("fields", fieldsJSON).
			Set("update_at", block.UpdateAt).
			Set("delete_at", block.DeleteAt)

		if _, err := query.Exec(); err != nil {
			s.logger.Error(`InsertBlock error occurred while updating existing block`, mlog.String("blockID", block.ID), mlog.Err(err))
			return err
		}
	} else {
		block.CreatedBy = userID
		block.CreateAt = utils.GetMillis()

		insertQueryValues["created_by"] = block.CreatedBy
		insertQueryValues["create_at"] = block.CreateAt
		insertQueryValues["update_at"] = block.UpdateAt
		insertQueryValues["modified_by"] = block.ModifiedBy

		query := insertQuery.SetMap(insertQueryValues).Into(s.tablePrefix + "blocks")
		if _, err := query.Exec(); err != nil {
			return err
		}
	}

	// writing block history
	query := insertQuery.SetMap(insertQueryValues).Into(s.tablePrefix + "blocks_history")
	if _, err := query.Exec(); err != nil {
		return err
	}

	return nil
}
