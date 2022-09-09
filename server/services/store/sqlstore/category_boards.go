package sqlstore

import (
	"database/sql"

	sq "github.com/Masterminds/squirrel"
	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/utils"

	"github.com/mattermost/mattermost-server/v6/shared/mlog"
)

func (s *SQLStore) getUserCategoryBoards(db sq.BaseRunner, userID, teamID string) ([]model.CategoryBoards, error) {
	categories, err := s.getUserCategories(db, userID, teamID)
	if err != nil {
		return nil, err
	}

	userCategoryBoards := []model.CategoryBoards{}
	for _, category := range categories {
		boardIDs, err := s.getCategoryBoardAttributes(db, category.ID)
		if err != nil {
			return nil, err
		}

		userCategoryBoard := model.CategoryBoards{
			Category: category,
			BoardIDs: boardIDs,
		}

		userCategoryBoards = append(userCategoryBoards, userCategoryBoard)
	}

	return userCategoryBoards, nil
}

func (s *SQLStore) getCategoryBoardAttributes(db sq.BaseRunner, categoryID string) ([]string, error) {
	query := s.getQueryBuilder(db).
		Select("board_id").
		From(s.tablePrefix + "category_boards").
		Where(sq.Eq{
			"category_id": categoryID,
			"delete_at":   0,
		})

	rows, err := query.Query()
	if err != nil {
		s.logger.Error("getCategoryBoards error fetching categoryblocks", mlog.String("categoryID", categoryID), mlog.Err(err))
		return nil, err
	}

	return s.categoryBoardsFromRows(rows)
}

func (s *SQLStore) addUpdateCategoryBoard(db sq.BaseRunner, userID, categoryID, boardID string) error {
	if err := s.deleteUserCategoryBoard(db, userID, boardID); err != nil {
		return err
	}

	if categoryID == "0" {
		// category ID "0" means user wants to move board out of
		// the custom category. Deleting the user-board-category
		// mapping achieves this.
		return nil
	}

	return s.addUserCategoryBoard(db, userID, categoryID, boardID)
}

/*
func (s *SQLStore) userCategoryBoardExists(db sq.BaseRunner, userID, teamID, categoryID, boardID string) (bool, error) {
	query := s.getQueryBuilder(db).
		Select("blocks.id").
		From(s.tablePrefix + "categories AS categories").
		Join(s.tablePrefix + "category_boards AS blocks ON blocks.category_id = categories.id").
		Where(sq.Eq{
			"user_id":       userID,
			"team_id":       teamID,
			"categories.id": categoryID,
			"board_id":      boardID,
		})

	rows, err := query.Query()
	if err != nil {
		s.logger.Error("getCategoryBoard error", mlog.Err(err))
		return false, err
	}

	return rows.Next(), nil
}
*/

func (s *SQLStore) addUserCategoryBoard(db sq.BaseRunner, userID, categoryID, boardID string) error {
	_, err := s.getQueryBuilder(db).
		Insert(s.tablePrefix+"category_boards").
		Columns(
			"id",
			"user_id",
			"category_id",
			"board_id",
			"create_at",
			"update_at",
			"delete_at",
		).
		Values(
			utils.NewID(utils.IDTypeNone),
			userID,
			categoryID,
			boardID,
			utils.GetMillis(),
			utils.GetMillis(),
			0,
		).Exec()

	if err != nil {
		s.logger.Error("addUserCategoryBoard error", mlog.Err(err))
		return err
	}
	return nil
}

func (s *SQLStore) deleteUserCategoryBoard(db sq.BaseRunner, userID, boardID string) error {
	_, err := s.getQueryBuilder(db).
		Update(s.tablePrefix+"category_boards").
		Set("delete_at", utils.GetMillis()).
		Where(sq.Eq{
			"user_id":   userID,
			"board_id":  boardID,
			"delete_at": 0,
		}).Exec()

	if err != nil {
		s.logger.Error(
			"deleteUserCategoryBoard delete error",
			mlog.String("userID", userID),
			mlog.String("boardID", boardID),
			mlog.Err(err),
		)
		return err
	}

	return nil
}

func (s *SQLStore) categoryBoardsFromRows(rows *sql.Rows) ([]string, error) {
	blocks := []string{}

	for rows.Next() {
		boardID := ""
		if err := rows.Scan(&boardID); err != nil {
			s.logger.Error("categoryBoardsFromRows row scan error", mlog.Err(err))
			return nil, err
		}

		blocks = append(blocks, boardID)
	}

	return blocks, nil
}
