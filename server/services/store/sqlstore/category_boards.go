package sqlstore

import (
	"database/sql"
	"fmt"

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
		}).
		OrderBy("sort_order")

	rows, err := query.Query()
	if err != nil {
		s.logger.Error("getCategoryBoards error fetching categoryblocks", mlog.String("categoryID", categoryID), mlog.Err(err))
		return nil, err
	}

	return s.categoryBoardsFromRows(rows)
}

func (s *SQLStore) addUpdateCategoryBoard(db sq.BaseRunner, userID string, boardCategoryMapping map[string]string) error {
	boardIDs := []string{}
	for boardID := range boardCategoryMapping {
		boardIDs = append(boardIDs, boardID)
	}

	if err := s.deleteUserCategoryBoards(db, userID, boardIDs); err != nil {
		return err
	}

	return s.addUserCategoryBoard(db, userID, boardCategoryMapping)
}

func (s *SQLStore) addUserCategoryBoard(db sq.BaseRunner, userID string, boardCategoryMapping map[string]string) error {
	if len(boardCategoryMapping) == 0 {
		return nil
	}

	query := s.getQueryBuilder(db).
		Insert(s.tablePrefix+"category_boards").
		Columns(
			"id",
			"user_id",
			"category_id",
			"board_id",
			"create_at",
			"update_at",
			"delete_at",
			"sort_order",
		)

	now := utils.GetMillis()
	for boardID, categoryID := range boardCategoryMapping {
		query = query.
			Values(
				utils.NewID(utils.IDTypeNone),
				userID,
				categoryID,
				boardID,
				now,
				now,
				0,
				0,
			)
	}

	if _, err := query.Exec(); err != nil {
		s.logger.Error("addUserCategoryBoard error", mlog.Err(err))
		return err
	}
	return nil
}

func (s *SQLStore) deleteUserCategoryBoards(db sq.BaseRunner, userID string, boardIDs []string) error {
	if len(boardIDs) == 0 {
		return nil
	}

	_, err := s.getQueryBuilder(db).
		Update(s.tablePrefix+"category_boards").
		Set("delete_at", utils.GetMillis()).
		Where(sq.Eq{
			"user_id":   userID,
			"board_id":  boardIDs,
			"delete_at": 0,
		}).Exec()

	if err != nil {
		s.logger.Error(
			"deleteUserCategoryBoards delete error",
			mlog.String("userID", userID),
			mlog.Array("boardID", boardIDs),
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

func (s *SQLStore) reorderCategoryBoards(db sq.BaseRunner, categoryID string, newBoardsOrder []string) ([]string, error) {
	if len(newBoardsOrder) == 0 {
		return nil, nil
	}

	updateCase := sq.Case("board_id")
	for i, boardID := range newBoardsOrder {
		updateCase = updateCase.When("'"+boardID+"'", sq.Expr(fmt.Sprintf("%d", i+model.CategoryBoardsSortOrderGap)))
	}
	updateCase.Else("sort_order")

	query := s.getQueryBuilder(db).
		Update(s.tablePrefix+"category_boards").
		Set("sort_order", updateCase).
		Where(sq.Eq{
			"category_id": categoryID,
			"delete_at":   0,
		})

	if _, err := query.Exec(); err != nil {
		s.logger.Error(
			"reorderCategoryBoards failed to update category board order",
			mlog.String("category_id", categoryID),
			mlog.Err(err),
		)

		return nil, err
	}

	return newBoardsOrder, nil
}
