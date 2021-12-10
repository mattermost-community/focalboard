package sqlstore

import (
	"database/sql"
	sq "github.com/Masterminds/squirrel"
	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/utils"
	"github.com/mattermost/mattermost-server/v6/shared/mlog"
)

func (s *SQLStore) getUserCategoryBoards(db sq.BaseRunner, userID, teamID string) ([]model.CategoryBlocks, error) {
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
		Select("board_id").
		From(s.tablePrefix + "category_boards").
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

func (s *SQLStore) addUpdateCategoryBlock(db sq.BaseRunner, userID, teamID, oldCategoryID, newCategoryID, blockID string) error {
	// Check if block already belongs to a category.
	// Update or insert accordingly.
	exists, err := s.userCategoryBlockExists(db, userID, teamID, oldCategoryID, blockID)
	if err != nil {
		return err
	}

	if exists {
		return s.updateUserCategoryBlock(db, blockID, oldCategoryID, newCategoryID)
	}

	return s.addUserCategoryBlock(db, newCategoryID, blockID)
}

func (s *SQLStore) userCategoryBlockExists(db sq.BaseRunner, userID, teamID, categoryID, blockID string) (bool, error) {
	// TODO rename category_boards to category_blocks

	query := s.getQueryBuilder(db).
		Select("blocks.id").
		From(s.tablePrefix + "categories AS categories").
		Join(s.tablePrefix + "category_boards AS blocks ON blocks.category_id = categories.id").
		Where(sq.Eq{
			"user_id":       userID,
			"team_id":       teamID,
			"categories.id": categoryID,
			"board_id":      blockID,
		})

	rows, err := query.Query()
	if err != nil {
		s.logger.Error("getCategoryBlock error", mlog.Err(err))
		return false, err
	}

	return rows.Next(), nil
}

func (s *SQLStore) updateUserCategoryBlock(db sq.BaseRunner, blockID, oldCategoryID, newCategoryID string) error {
	_, err := s.getQueryBuilder(db).
		Update(s.tablePrefix+"category_boards").
		Set("category_id", newCategoryID).
		Where(sq.Eq{
			"category_id": oldCategoryID,
			"board_id":    blockID,
		}).
		Exec()

	if err != nil {
		s.logger.Error("updateUserCategoryBlock error", mlog.Err(err))
		return err
	}
	return nil
}

func (s *SQLStore) addUserCategoryBlock(db sq.BaseRunner, categoryID, blockID string) error {
	_, err := s.getQueryBuilder(db).
		Insert(s.tablePrefix+"category_boards").
		Columns(
			"id",
			"category_id",
			"board_id",
			"create_at",
			"update_at",
			"delete_at",
		).
		Values(
			utils.NewID(utils.IDTypeNone),
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
