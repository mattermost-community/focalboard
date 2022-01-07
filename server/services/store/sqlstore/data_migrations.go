package sqlstore

import (
	"context"
	"encoding/json"
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

	categoriesUUIDIDMigrationRequiredVersion = 17
)

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

func (s *SQLStore) runTemplatesToTeamsMigration() error {
	setting, err := s.GetSystemSetting(TemplatesToTeamsMigrationKey)
	if err != nil {
		return fmt.Errorf("cannot get migration state: %w", err)
	}

	// If the migration is already completed, do not run it again.
	if hasAlreadyRun, _ := strconv.ParseBool(setting); hasAlreadyRun {
		return nil
	}

	s.logger.Debug("Running Templates to Teams migration")

	tx, txErr := s.db.BeginTx(context.Background(), nil)
	if txErr != nil {
		return txErr
	}

	// get all teams
	teams, err := s.getAllTeams(tx)
	if err != nil {
		if rollbackErr := tx.Rollback(); rollbackErr != nil {
			s.logger.Error("Templates to Teams transaction rollback error", mlog.Err(rollbackErr), mlog.String("methodName", "getAllTeams"))
		}
		return fmt.Errorf("cannot get all teams: %w", err)
	}

	// get all board templates
	// ToDo: do we need history blocks here?
	// boardTemplateBlocks, boardTemplateHistoryBlocks, err := s.getAllBoardTemplateBlocks(tx)
	boardTemplateBlocks, _, err := s.getAllBoardTemplateBlocks(tx)
	if err != nil {
		if rollbackErr := tx.Rollback(); rollbackErr != nil {
			s.logger.Error("Templates to Teams transaction rollback error", mlog.Err(rollbackErr), mlog.String("methodName", "getAllBoardTemplateBlocks"))
		}
		return fmt.Errorf("cannot get all board template blocks: %w", err)
	}

	// ToDo: refactor these methods onto something like
	// createBoardTemplateFromBlock? some go to utils maybe?
	getStrProperty := func(m map[string]interface{}, k string) string {
		if v, ok := m[k].(string); ok {
			return v
		}
		return ""
	}

	getBoolProperty := func(m map[string]interface{}, k string) bool {
		v := getStrProperty(m, k)
		b, _ := strconv.ParseBool(v)
		return b
	}

	getMapProperty := func(m map[string]interface{}, k string) map[string]interface{} {
		v := map[string]interface{}{}
		s := getStrProperty(m, k)
		if s == "" {
			return v
		}
		_ = json.Unmarshal([]byte(s), &v)
		return v
	}

	getArrayProperty := func(m map[string]interface{}, k string) []map[string]interface{} {
		v := []map[string]interface{}{}
		s := getStrProperty(m, k)
		if s == "" {
			return v
		}
		_ = json.Unmarshal([]byte(s), &v)
		return v
	}

	// add all templates for each team
	for _, templateBlock := range boardTemplateBlocks {
		newBoardTemplate := &model.Board{
			CreatedBy:          templateBlock.CreatedBy,
			Type:               model.BoardTypeOpen,
			Title:              templateBlock.Title,
			Description:        getStrProperty(templateBlock.Fields, "description"),
			Icon:               getStrProperty(templateBlock.Fields, "icon"),
			ShowDescription:    getBoolProperty(templateBlock.Fields, "showDescription"),
			IsTemplate:         getBoolProperty(templateBlock.Fields, "isTemplate"),
			Properties:         map[string]interface{}{},
			CardProperties:     getArrayProperty(templateBlock.Fields, "cardProperties"),
			ColumnCalculations: getMapProperty(templateBlock.Fields, "columnCalculations"),
			CreateAt:           templateBlock.CreateAt,
			UpdateAt:           templateBlock.UpdateAt,
			DeleteAt:           templateBlock.DeleteAt,
		}

		for _, team := range teams {
			newBoardTemplate.ID = utils.NewID(utils.IDTypeBoard) //ToDo: new uuid ?? created on insert??
			newBoardTemplate.TeamID = team.ID

			if _, err := s.insertBoard(tx, newBoardTemplate, newBoardTemplate.CreatedBy); err != nil {
				if rollbackErr := tx.Rollback(); rollbackErr != nil {
					s.logger.Error("Templates to Teams transaction rollback error", mlog.Err(rollbackErr), mlog.String("methodName", "insertBoard"))
				}
				return fmt.Errorf("cannot insert new board template: %w", err)
			}

			// ToDo: migrate its history
			// if err := s.migrateBoardHistory()

			// ToDo: make n copies of template cards and point them to each template
		}
	}

	// remove all board templates after migration to the boards table
	if err := s.deleteAllBoardTemplateBlocks(tx); err != nil {
		if rollbackErr := tx.Rollback(); rollbackErr != nil {
			s.logger.Error("Templates to Teams transaction rollback error", mlog.Err(rollbackErr), mlog.String("methodName", "deleteAllBoardTemplateBlocks"))
		}
		return fmt.Errorf("cannot delete all board template blocks: %w", err)
	}

	if err := s.setSystemSetting(tx, TemplatesToTeamsMigrationKey, strconv.FormatBool(true)); err != nil {
		if rollbackErr := tx.Rollback(); rollbackErr != nil {
			s.logger.Error("Templates to Teams transaction rollback error", mlog.Err(rollbackErr), mlog.String("methodName", "setSystemSetting"))
		}
		return fmt.Errorf("cannot mark migration as completed: %w", err)
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("cannot commit Templates to Teams transaction: %w", err)
	}

	s.logger.Debug("Templates to Teams migration finished successfully")
	return nil
}

func (s *SQLStore) runCategoryUuidIdMigration() error {
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
	for _, oldId := range oldCategoryIDs {
		newID := utils.NewID(utils.IDTypeNone)
		categoryIDs[oldId] = newID
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

	if err := rows.Close(); err != nil {
		s.logger.Error("updateCategoryID error closing rows after updating categories table IDs", mlog.Err(err))
		return err
	}

	// update category boards table

	rows, err = s.getQueryBuilder(db).
		Update(s.tablePrefix+"category_blocks").
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
	oldCategoryIDs, err := s.getIDs(db, "category_blocks")
	if err != nil {
		return err
	}

	// map old category ID to new ID
	categoryIDs := map[string]string{}
	for _, oldId := range oldCategoryIDs {
		newID := utils.NewID(utils.IDTypeNone)
		categoryIDs[oldId] = newID
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
		Update(s.tablePrefix+"category_blocks").
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
