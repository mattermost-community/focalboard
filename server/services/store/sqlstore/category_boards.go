package sqlstore

import (
	"database/sql"
	"errors"

	sq "github.com/Masterminds/squirrel"
	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/utils"

	"github.com/mattermost/mattermost-server/v6/shared/mlog"
)

var (
	errDuplicateCategoryEntries = errors.New("duplicate entries found for user-board-category mapping")
)

func (s *SQLStore) getUserCategoryBlocks(db sq.BaseRunner, userID, teamID string) ([]model.CategoryBlocks, error) {
	categories, err := s.getUserCategories(db, userID, teamID)
	if err != nil {
		return nil, err
	}

	userCategoryBlocks := []model.CategoryBlocks{}
	for _, category := range categories {
		blockIDs, err := s.getCategoryBlockAttributes(db, category.ID)
		if err != nil {
			return nil, err
		}

		userCategoryBlock := model.CategoryBlocks{
			Category: category,
			BlockIDs: blockIDs,
		}

		userCategoryBlocks = append(userCategoryBlocks, userCategoryBlock)
	}

	return userCategoryBlocks, nil
}

func (s *SQLStore) getCategoryBlockAttributes(db sq.BaseRunner, categoryID string) ([]string, error) {
	query := s.getQueryBuilder(db).
		Select("block_id").
		From(s.tablePrefix + "category_blocks").
		Where(sq.Eq{
			"category_id": categoryID,
			"delete_at":   0,
		})

	rows, err := query.Query()
	if err != nil {
		s.logger.Error("getCategoryBlocks error fetching categoryblocks", mlog.String("categoryID", categoryID), mlog.Err(err))
		return nil, err
	}

	return s.categoryBlocksFromRows(rows)
}

func (s *SQLStore) addUpdateCategoryBlock(db sq.BaseRunner, userID, categoryID, blockID string) error {
	if categoryID == "0" {
		return s.deleteUserCategoryBlock(db, userID, blockID)
	}

	rowsAffected, err := s.updateUserCategoryBlock(db, userID, blockID, categoryID)
	if err != nil {
		return err
	}

	if rowsAffected > 1 {
		return errDuplicateCategoryEntries
	}

	if rowsAffected == 0 {
		// user-block mapping didn't already exist. So we'll create a new entry
		return s.addUserCategoryBlock(db, userID, categoryID, blockID)
	}

	return nil
}

/*
func (s *SQLStore) userCategoryBlockExists(db sq.BaseRunner, userID, teamID, categoryID, blockID string) (bool, error) {
	query := s.getQueryBuilder(db).
		Select("blocks.id").
		From(s.tablePrefix + "categories AS categories").
		Join(s.tablePrefix + "category_blocks AS blocks ON blocks.category_id = categories.id").
		Where(sq.Eq{
			"user_id":       userID,
			"team_id":       teamID,
			"categories.id": categoryID,
			"block_id":      blockID,
		})

	rows, err := query.Query()
	if err != nil {
		s.logger.Error("getCategoryBlock error", mlog.Err(err))
		return false, err
	}

	return rows.Next(), nil
}
*/

func (s *SQLStore) updateUserCategoryBlock(db sq.BaseRunner, userID, blockID, categoryID string) (int64, error) {
	result, err := s.getQueryBuilder(db).
		Update(s.tablePrefix+"category_blocks").
		Set("category_id", categoryID).
		Set("delete_at", 0).
		Where(sq.Eq{
			"block_id": blockID,
			"user_id":  userID,
		}).
		Exec()

	if err != nil {
		s.logger.Error("updateUserCategoryBlock error", mlog.Err(err))
		return 0, err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		s.logger.Error("updateUserCategoryBlock affected row count error", mlog.Err(err))
		return 0, err
	}

	return rowsAffected, nil
}

func (s *SQLStore) addUserCategoryBlock(db sq.BaseRunner, userID, categoryID, blockID string) error {
	_, err := s.getQueryBuilder(db).
		Insert(s.tablePrefix+"category_blocks").
		Columns(
			"id",
			"user_id",
			"category_id",
			"block_id",
			"create_at",
			"update_at",
			"delete_at",
		).
		Values(
			utils.NewID(utils.IDTypeNone),
			userID,
			categoryID,
			blockID,
			utils.GetMillis(),
			utils.GetMillis(),
			0,
		).Exec()

	if err != nil {
		s.logger.Error("addUserCategoryBlock error", mlog.Err(err))
		return err
	}
	return nil
}

func (s *SQLStore) deleteUserCategoryBlock(db sq.BaseRunner, userID, blockID string) error {
	_, err := s.getQueryBuilder(db).
		Update(s.tablePrefix+"category_blocks").
		Set("delete_at", utils.GetMillis()).
		Where(sq.Eq{
			"user_id":   userID,
			"block_id":  blockID,
			"delete_at": 0,
		}).Exec()

	if err != nil {
		s.logger.Error(
			"deleteUserCategoryBlock delete error",
			mlog.String("userID", userID),
			mlog.String("blockID", blockID),
			mlog.Err(err),
		)
		return err
	}

	return nil
}

func (s *SQLStore) categoryBlocksFromRows(rows *sql.Rows) ([]string, error) {
	blocks := []string{}

	for rows.Next() {
		blockID := ""
		if err := rows.Scan(&blockID); err != nil {
			s.logger.Error("categoryBlocksFromRows row scan error", mlog.Err(err))
			return nil, err
		}

		blocks = append(blocks, blockID)
	}

	return blocks, nil
}
