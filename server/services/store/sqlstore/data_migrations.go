package sqlstore

import (
	"context"
	"fmt"
	"os"
	"strconv"
	"strings"

	sq "github.com/Masterminds/squirrel"
	"github.com/wiggin77/merror"

	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/utils"

	"github.com/mattermost/mattermost/server/public/shared/mlog"
)

const (
	// we group the inserts on batches of 1000 because PostgreSQL
	// supports a limit of around 64K values (not rows) on an insert
	// query, so we want to stay safely below.
	CategoryInsertBatch = 1000

	TemplatesToTeamsMigrationKey              = "TemplatesToTeamsMigrationComplete"
	UniqueIDsMigrationKey                     = "UniqueIDsMigrationComplete"
	CategoryUUIDIDMigrationKey                = "CategoryUuidIdMigrationComplete"
	TeamLessBoardsMigrationKey                = "TeamLessBoardsMigrationComplete"
	DeletedMembershipBoardsMigrationKey       = "DeletedMembershipBoardsMigrationComplete"
	DeDuplicateCategoryBoardTableMigrationKey = "DeDuplicateCategoryBoardTableComplete"
)

func (s *SQLStore) getBlocksWithSameID(db sq.BaseRunner) ([]*model.Block, error) {
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

func (s *SQLStore) RunUniqueIDsMigration() error {
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

	blocksByID := map[string][]*model.Block{}
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

// RunCategoryUUIDIDMigration takes care of deriving the categories
// from the boards and its memberships. The name references UUID
// because of the preexisting purpose of this migration, and has been
// preserved for compatibility with already migrated instances.
func (s *SQLStore) RunCategoryUUIDIDMigration() error {
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

	if err := s.setSystemSetting(tx, CategoryUUIDIDMigrationKey, strconv.FormatBool(true)); err != nil {
		if rollbackErr := tx.Rollback(); rollbackErr != nil {
			s.logger.Error("category UUIDs transaction rollback error", mlog.Err(rollbackErr), mlog.String("methodName", "setSystemSetting"))
		}
		return fmt.Errorf("cannot mark migration as completed: %w", err)
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("cannot commit category UUIDs transaction: %w", err)
	}

	s.logger.Debug("category UUIDs migration finished successfully")
	return nil
}

func (s *SQLStore) RunFixCollationsAndCharsetsMigration() error {
	// This is for MySQL only
	if s.dbType != model.MysqlDBType {
		return nil
	}

	// get collation and charSet setting that Channels is using.
	// when personal server or unit testing, no channels tables exist so just set to a default.
	var collation string
	var charSet string
	var err error
	if os.Getenv("FOCALBOARD_UNIT_TESTING") == "1" {
		collation = "utf8mb4_general_ci"
		charSet = "utf8mb4"
	} else {
		collation, charSet, err = s.getCollationAndCharset("Channels")
		if err != nil {
			return err
		}
	}

	// get all FocalBoard tables
	tableNames, err := s.getFocalBoardTableNames()
	if err != nil {
		return err
	}

	merr := merror.New()

	// alter each table if there is a collation or charset mismatch
	for _, name := range tableNames {
		tableCollation, tableCharSet, err := s.getCollationAndCharset(name)
		if err != nil {
			return err
		}

		if collation == tableCollation && charSet == tableCharSet {
			// nothing to do
			continue
		}

		s.logger.Warn(
			"found collation/charset mismatch, fixing table",
			mlog.String("tableName", name),
			mlog.String("tableCollation", tableCollation),
			mlog.String("tableCharSet", tableCharSet),
			mlog.String("collation", collation),
			mlog.String("charSet", charSet),
		)

		sql := fmt.Sprintf("ALTER TABLE %s CONVERT TO CHARACTER SET '%s' COLLATE '%s'", name, charSet, collation)
		result, err := s.db.Exec(sql)
		if err != nil {
			merr.Append(err)
			continue
		}
		num, err := result.RowsAffected()
		if err != nil {
			merr.Append(err)
		}
		if num > 0 {
			s.logger.Debug("table collation and/or charSet fixed",
				mlog.String("table_name", name),
			)
		}
	}
	return merr.ErrorOrNil()
}

func (s *SQLStore) getFocalBoardTableNames() ([]string, error) {
	if s.dbType != model.MysqlDBType {
		return nil, newErrInvalidDBType("getFocalBoardTableNames requires MySQL")
	}

	query := s.getQueryBuilder(s.db).
		Select("table_name").
		From("information_schema.tables").
		Where(sq.Like{"table_name": s.tablePrefix + "%"}).
		Where("table_schema=(SELECT DATABASE())")

	rows, err := query.Query()
	if err != nil {
		return nil, fmt.Errorf("error fetching FocalBoard table names: %w", err)
	}
	defer rows.Close()

	names := make([]string, 0)

	for rows.Next() {
		var tableName string

		err := rows.Scan(&tableName)
		if err != nil {
			return nil, fmt.Errorf("cannot scan result while fetching table names: %w", err)
		}

		names = append(names, tableName)
	}

	return names, nil
}

func (s *SQLStore) getCollationAndCharset(tableName string) (string, string, error) {
	if s.dbType != model.MysqlDBType {
		return "", "", newErrInvalidDBType("getCollationAndCharset requires MySQL")
	}

	query := s.getQueryBuilder(s.db).
		Select("table_collation").
		From("information_schema.tables").
		Where(sq.Eq{"table_name": tableName}).
		Where("table_schema=(SELECT DATABASE())")

	row := query.QueryRow()

	var collation string
	err := row.Scan(&collation)
	if err != nil {
		return "", "", fmt.Errorf("error fetching collation for table %s: %w", tableName, err)
	}

	// obtains the charset from the first column that has it set
	query = s.getQueryBuilder(s.db).
		Select("CHARACTER_SET_NAME").
		From("information_schema.columns").
		Where(sq.Eq{
			"table_name": tableName,
		}).
		Where("table_schema=(SELECT DATABASE())").
		Where(sq.NotEq{"CHARACTER_SET_NAME": "NULL"}).
		Limit(1)

	row = query.QueryRow()

	var charSet string
	err = row.Scan(&charSet)
	if err != nil {
		return "", "", fmt.Errorf("error fetching charSet: %w", err)
	}

	return collation, charSet, nil
}

func (s *SQLStore) RunDeDuplicateCategoryBoardsMigration(currentMigration int) error {
	// not supported for SQLite
	if s.dbType == model.SqliteDBType {
		if mErr := s.setSystemSetting(s.db, DeDuplicateCategoryBoardTableMigrationKey, strconv.FormatBool(true)); mErr != nil {
			return fmt.Errorf("cannot mark migration %s as completed: %w", "RunDeDuplicateCategoryBoardsMigration", mErr)
		}
		return nil
	}

	setting, err := s.GetSystemSetting(DeDuplicateCategoryBoardTableMigrationKey)
	if err != nil {
		return fmt.Errorf("cannot get DeDuplicateCategoryBoardTableMigration state: %w", err)
	}

	// If the migration is already completed, do not run it again.
	if hasAlreadyRun, _ := strconv.ParseBool(setting); hasAlreadyRun {
		return nil
	}

	if currentMigration >= (deDuplicateCategoryBoards + 1) {
		// if the migration for which we're fixing the data is already applied,
		// no need to check fix anything

		if mErr := s.setSystemSetting(s.db, DeDuplicateCategoryBoardTableMigrationKey, strconv.FormatBool(true)); mErr != nil {
			return fmt.Errorf("cannot mark migration %s as completed: %w", "RunDeDuplicateCategoryBoardsMigration", mErr)
		}
		return nil
	}

	needed, err := s.doesDuplicateCategoryBoardsExist()
	if err != nil {
		return err
	}

	if !needed {
		if mErr := s.setSystemSetting(s.db, DeDuplicateCategoryBoardTableMigrationKey, strconv.FormatBool(true)); mErr != nil {
			return fmt.Errorf("cannot mark migration %s as completed: %w", "RunDeDuplicateCategoryBoardsMigration", mErr)
		}
	}

	if s.dbType == model.MysqlDBType {
		return s.runMySQLDeDuplicateCategoryBoardsMigration()
	} else if s.dbType == model.PostgresDBType {
		return s.runPostgresDeDuplicateCategoryBoardsMigration()
	}

	if mErr := s.setSystemSetting(s.db, DeDuplicateCategoryBoardTableMigrationKey, strconv.FormatBool(true)); mErr != nil {
		return fmt.Errorf("cannot mark migration %s as completed: %w", "RunDeDuplicateCategoryBoardsMigration", mErr)
	}

	return nil
}

func (s *SQLStore) doesDuplicateCategoryBoardsExist() (bool, error) {
	subQuery := s.getQueryBuilder(s.db).
		Select("user_id", "board_id", "count(*) AS count").
		From(s.tablePrefix+"category_boards").
		GroupBy("user_id", "board_id").
		Having("count(*) > 1")

	query := s.getQueryBuilder(s.db).
		Select("COUNT(user_id)").
		FromSelect(subQuery, "duplicate_dataset")

	row := query.QueryRow()

	count := 0
	if err := row.Scan(&count); err != nil {
		s.logger.Error("Error occurred reading number of duplicate records in category_boards table", mlog.Err(err))
		return false, err
	}

	return count > 0, nil
}

func (s *SQLStore) runMySQLDeDuplicateCategoryBoardsMigration() error {
	tablePrefix := s.tablePrefix

	var queryBuilder strings.Builder
	queryBuilder.WriteString("DELETE FROM ")
	queryBuilder.WriteString(tablePrefix)
	queryBuilder.WriteString("category_boards WHERE id NOT IN ")
	queryBuilder.WriteString("(SELECT * FROM ( SELECT min(id) FROM ")
	queryBuilder.WriteString(tablePrefix)
	queryBuilder.WriteString("category_boards GROUP BY user_id, board_id ) as data)")

	query := queryBuilder.String()
	if _, err := s.db.Exec(query); err != nil {
		s.logger.Error("Failed to de-duplicate data in category_boards table", mlog.Err(err))
	}

	return nil
}

func (s *SQLStore) runPostgresDeDuplicateCategoryBoardsMigration() error {
	tablePrefix := s.tablePrefix

	var queryBuilder strings.Builder
	queryBuilder.WriteString("WITH duplicates AS (SELECT id, ROW_NUMBER() OVER(PARTITION BY user_id, board_id) AS rownum ")
	queryBuilder.WriteString("FROM ")
	queryBuilder.WriteString(tablePrefix)
	queryBuilder.WriteString("category_boards) ")
	queryBuilder.WriteString("DELETE FROM ")
	queryBuilder.WriteString(tablePrefix)
	queryBuilder.WriteString("category_boards USING duplicates ")
	queryBuilder.WriteString("WHERE ")
	queryBuilder.WriteString(tablePrefix)
	queryBuilder.WriteString("category_boards.id = duplicates.id AND duplicates.rownum > 1;")

	query := queryBuilder.String()

	if _, err := s.db.Exec(query); err != nil {
		s.logger.Error("Failed to de-duplicate data in category_boards table", mlog.Err(err))
	}

	return nil
}
