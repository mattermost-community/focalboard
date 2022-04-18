package sqlstore

import (
	"context"
	"fmt"
	"strconv"

	sq "github.com/Masterminds/squirrel"

	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/utils"

	"github.com/mattermost/mattermost-server/v6/shared/mlog"
)

const (
	TemplatesToTeamsMigrationKey = "TemplatesToTeamsMigrationComplete"
	UniqueIDsMigrationKey        = "UniqueIDsMigrationComplete"
	CategoryUUIDIDMigrationKey   = "CategoryUuidIdMigrationComplete"

	categoriesUUIDIDMigrationRequiredVersion = 19
)

func (s *SQLStore) getBlocksWithSameID(db sq.BaseRunner) ([]model.Block, error) {
	subquery, _, _ := s.getQueryBuilder(db).
		Select("id").
		From(s.tablePrefix + "blocks").
		Having("count(id) > 1").
		GroupBy("id").
		ToSql()

	blocksFields := []string{
		"id",
		"parent_id",
		"root_id",
		"created_by",
		"modified_by",
		s.escapeField("schema"),
		"type",
		"title",
		"COALESCE(fields, '{}')",
		s.timestampToCharField("insert_at", "insertAt"),
		"create_at",
		"update_at",
		"delete_at",
		"COALESCE(workspace_id, '0')",
	}

	rows, err := s.getQueryBuilder(db).
		Select(blocksFields...).
		From(s.tablePrefix + "blocks").
		Where(fmt.Sprintf("id IN (%s)", subquery)).
		Query()
	if err != nil {
		s.logger.Error(`getBlocksWithSameID ERROR`, mlog.Err(err))
		return nil, err
	}
	defer s.CloseRows(rows)

	return s.blocksFromRows(rows)
}

func (s *SQLStore) runUniqueIDsMigration() error {
	setting, err := s.GetSystemSetting(UniqueIDsMigrationKey)
	if err != nil {
		return fmt.Errorf("cannot get migration state: %w", err)
	}

	// If the migration is already completed, do not run it again.
	if hasAlreadyRun, _ := strconv.ParseBool(setting); hasAlreadyRun {
		return nil
	}

	s.logger.Debug("Running Unique IDs migration")

	tx, txErr := s.db.BeginTx(context.Background(), nil)
	if txErr != nil {
		return txErr
	}

	blocks, err := s.getBlocksWithSameID(tx)
	if err != nil {
		if rollbackErr := tx.Rollback(); rollbackErr != nil {
			s.logger.Error("Unique IDs transaction rollback error", mlog.Err(rollbackErr), mlog.String("methodName", "getBlocksWithSameID"))
		}
		return fmt.Errorf("cannot get blocks with same ID: %w", err)
	}

	blocksByID := map[string][]model.Block{}
	for _, block := range blocks {
		blocksByID[block.ID] = append(blocksByID[block.ID], block)
	}

	for _, blocks := range blocksByID {
		for i, block := range blocks {
			if i == 0 {
				// do nothing for the first ID, only updating the others
				continue
			}

			newID := utils.NewID(model.BlockType2IDType(block.Type))
			if err := s.replaceBlockID(tx, block.ID, newID, block.WorkspaceID); err != nil {
				if rollbackErr := tx.Rollback(); rollbackErr != nil {
					s.logger.Error("Unique IDs transaction rollback error", mlog.Err(rollbackErr), mlog.String("methodName", "replaceBlockID"))
				}
				return fmt.Errorf("cannot replace blockID %s: %w", block.ID, err)
			}
		}
	}

	if err := s.setSystemSetting(tx, UniqueIDsMigrationKey, strconv.FormatBool(true)); err != nil {
		if rollbackErr := tx.Rollback(); rollbackErr != nil {
			s.logger.Error("Unique IDs transaction rollback error", mlog.Err(rollbackErr), mlog.String("methodName", "setSystemSetting"))
		}
		return fmt.Errorf("cannot mark migration as completed: %w", err)
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("cannot commit unique IDs transaction: %w", err)
	}

	s.logger.Debug("Unique IDs migration finished successfully")
	return nil
}

func (s *SQLStore) runCategoryUUIDIDMigration() error {
	setting, err := s.GetSystemSetting(CategoryUUIDIDMigrationKey)
	if err != nil {
		return fmt.Errorf("cannot get migration state: %w", err)
	}

	// If the migration is already completed, do not run it again.
	if hasAlreadyRun, _ := strconv.ParseBool(setting); hasAlreadyRun {
		return nil
	}

	s.logger.Debug("Running category UUID ID migration")

	tx, txErr := s.db.BeginTx(context.Background(), nil)
	if txErr != nil {
		return txErr
	}

	if err := s.updateCategoryIDs(tx); err != nil {
		return err
	}

	if err := s.updateCategoryBlocksIDs(tx); err != nil {
		return err
	}

	if err := s.setSystemSetting(tx, CategoryUUIDIDMigrationKey, strconv.FormatBool(true)); err != nil {
		if rollbackErr := tx.Rollback(); rollbackErr != nil {
			s.logger.Error("category IDs transaction rollback error", mlog.Err(rollbackErr), mlog.String("methodName", "setSystemSetting"))
		}
		return fmt.Errorf("cannot mark migration as completed: %w", err)
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("cannot commit category IDs transaction: %w", err)
	}

	s.logger.Debug("category IDs migration finished successfully")
	return nil
}

func (s *SQLStore) updateCategoryIDs(db sq.BaseRunner) error {
	// fetch all category IDs
	oldCategoryIDs, err := s.getIDs(db, "categories")
	if err != nil {
		return err
	}

	// map old category ID to new ID
	categoryIDs := map[string]string{}
	for _, oldID := range oldCategoryIDs {
		newID := utils.NewID(utils.IDTypeNone)
		categoryIDs[oldID] = newID
	}

	// update for each category ID.
	// Update the new ID in category table,
	// and update corresponding rows in category boards table.
	for oldID, newID := range categoryIDs {
		if err := s.updateCategoryID(db, oldID, newID); err != nil {
			return err
		}
	}

	return nil
}

func (s *SQLStore) getIDs(db sq.BaseRunner, table string) ([]string, error) {
	rows, err := s.getQueryBuilder(db).
		Select("id").
		From(s.tablePrefix + table).
		Query()

	if err != nil {
		s.logger.Error("getIDs error", mlog.String("table", table), mlog.Err(err))
		return nil, err
	}

	defer s.CloseRows(rows)
	var categoryIDs []string
	for rows.Next() {
		var id string
		err := rows.Scan(&id)
		if err != nil {
			s.logger.Error("getIDs scan row error", mlog.String("table", table), mlog.Err(err))
			return nil, err
		}

		categoryIDs = append(categoryIDs, id)
	}

	return categoryIDs, nil
}

func (s *SQLStore) updateCategoryID(db sq.BaseRunner, oldID, newID string) error {
	// update in category table
	rows, err := s.getQueryBuilder(db).
		Update(s.tablePrefix+"categories").
		Set("id", newID).
		Where(sq.Eq{"id": oldID}).
		Query()

	if err != nil {
		s.logger.Error("updateCategoryID update category error", mlog.Err(err))
		return err
	}

	if err = rows.Close(); err != nil {
		s.logger.Error("updateCategoryID error closing rows after updating categories table IDs", mlog.Err(err))
		return err
	}

	// update category boards table

	rows, err = s.getQueryBuilder(db).
		Update(s.tablePrefix+"category_boards").
		Set("category_id", newID).
		Where(sq.Eq{"category_id": oldID}).
		Query()

	if err != nil {
		s.logger.Error("updateCategoryID update category boards error", mlog.Err(err))
		return err
	}

	if err := rows.Close(); err != nil {
		s.logger.Error("updateCategoryID error closing rows after updating category boards table IDs", mlog.Err(err))
		return err
	}

	return nil
}

func (s *SQLStore) updateCategoryBlocksIDs(db sq.BaseRunner) error {
	// fetch all category IDs
	oldCategoryIDs, err := s.getIDs(db, "category_boards")
	if err != nil {
		return err
	}

	// map old category ID to new ID
	categoryIDs := map[string]string{}
	for _, oldID := range oldCategoryIDs {
		newID := utils.NewID(utils.IDTypeNone)
		categoryIDs[oldID] = newID
	}

	// update for each category ID.
	// Update the new ID in category table,
	// and update corresponding rows in category boards table.
	for oldID, newID := range categoryIDs {
		if err := s.updateCategoryBlocksID(db, oldID, newID); err != nil {
			return err
		}
	}
	return nil
}

func (s *SQLStore) updateCategoryBlocksID(db sq.BaseRunner, oldID, newID string) error {
	// update in category table
	rows, err := s.getQueryBuilder(db).
		Update(s.tablePrefix+"category_boards").
		Set("id", newID).
		Where(sq.Eq{"id": oldID}).
		Query()

	if err != nil {
		s.logger.Error("updateCategoryBlocksID update category error", mlog.Err(err))
		return err
	}
	rows.Close()

	return nil
}
