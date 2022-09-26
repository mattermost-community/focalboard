package sqlstore

import (
	"database/sql"
	"fmt"

	sq "github.com/Masterminds/squirrel"
	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/utils"

	"github.com/mattermost/mattermost-server/v6/shared/mlog"
)

const categorySortOrderGap = 10

func (s *SQLStore) getCategory(db sq.BaseRunner, id string) (*model.Category, error) {
	query := s.getQueryBuilder(db).
		Select("id", "name", "user_id", "team_id", "create_at", "update_at", "delete_at", "collapsed", "sort_order").
		From(s.tablePrefix + "categories").
		Where(sq.Eq{"id": id})

	rows, err := query.Query()
	if err != nil {
		s.logger.Error("getCategory error", mlog.Err(err))
		return nil, err
	}

	categories, err := s.categoriesFromRows(rows)
	if err != nil {
		s.logger.Error("getCategory row scan error", mlog.Err(err))
		return nil, err
	}

	if len(categories) == 0 {
		return nil, model.NewErrNotFound("category ID=" + id)
	}

	return &categories[0], nil
}

func (s *SQLStore) createCategory(db sq.BaseRunner, category model.Category) error {
	// A new category should always end up at the top.
	// So we first insert the provided category, then bump up
	// existing user-team categories' order

	// creating provided category
	query := s.getQueryBuilder(db).
		Insert(s.tablePrefix+"categories").
		Columns(
			"id",
			"name",
			"user_id",
			"team_id",
			"create_at",
			"update_at",
			"delete_at",
			"collapsed",
			"sort_order",
		).
		Values(
			category.ID,
			category.Name,
			category.UserID,
			category.TeamID,
			category.CreateAt,
			category.UpdateAt,
			category.DeleteAt,
			category.Collapsed,
			category.SortOrder,
		)

	_, err := query.Exec()
	if err != nil {
		s.logger.Error("Error creating category", mlog.String("category name", category.Name), mlog.Err(err))
		return err
	}

	// bumping up order of existing categories
	updateQuery := s.getQueryBuilder(db).
		Update(s.tablePrefix+"categories").
		Set("sort_order", sq.Expr(fmt.Sprintf("sort_order + %d", categorySortOrderGap))).
		Where(
			sq.Eq{
				"user_id":   category.UserID,
				"team_id":   category.TeamID,
				"delete_at": 0,
			},
		)

	if _, err := updateQuery.Exec(); err != nil {
		s.logger.Error(
			"createCategory failed to update sort order of existing user-team categories",
			mlog.String("user_id", category.UserID),
			mlog.String("team_id", category.TeamID),
			mlog.Err(err),
		)

		return err
	}

	return nil
}

func (s *SQLStore) updateCategory(db sq.BaseRunner, category model.Category) error {
	query := s.getQueryBuilder(db).
		Update(s.tablePrefix+"categories").
		Set("name", category.Name).
		Set("update_at", category.UpdateAt).
		Set("collapsed", category.Collapsed).
		Where(sq.Eq{"id": category.ID})

	_, err := query.Exec()
	if err != nil {
		s.logger.Error("Error updating category", mlog.String("category_id", category.ID), mlog.String("category_name", category.Name), mlog.Err(err))
		return err
	}
	return nil
}

func (s *SQLStore) deleteCategory(db sq.BaseRunner, categoryID, userID, teamID string) error {
	query := s.getQueryBuilder(db).
		Update(s.tablePrefix+"categories").
		Set("delete_at", utils.GetMillis()).
		Where(sq.Eq{
			"id":      categoryID,
			"user_id": userID,
			"team_id": teamID,
		})

	_, err := query.Exec()
	if err != nil {
		s.logger.Error(
			"Error updating category",
			mlog.String("category_id", categoryID),
			mlog.String("user_id", userID),
			mlog.String("team_id", teamID),
			mlog.Err(err),
		)
		return err
	}
	return nil
}

func (s *SQLStore) getUserCategories(db sq.BaseRunner, userID, teamID string) ([]model.Category, error) {
	query := s.getQueryBuilder(db).
		Select("id", "name", "user_id", "team_id", "create_at", "update_at", "delete_at", "collapsed", "sort_order").
		From(s.tablePrefix+"categories").
		Where(sq.Eq{
			"user_id":   userID,
			"team_id":   teamID,
			"delete_at": 0,
		}).
		OrderBy("sort_order", "name")

	rows, err := query.Query()
	if err != nil {
		s.logger.Error("getUserCategories error", mlog.Err(err))
		return nil, err
	}

	return s.categoriesFromRows(rows)
}

func (s *SQLStore) categoriesFromRows(rows *sql.Rows) ([]model.Category, error) {
	var categories []model.Category

	for rows.Next() {
		category := model.Category{}
		err := rows.Scan(
			&category.ID,
			&category.Name,
			&category.UserID,
			&category.TeamID,
			&category.CreateAt,
			&category.UpdateAt,
			&category.DeleteAt,
			&category.Collapsed,
			&category.SortOrder,
		)

		if err != nil {
			s.logger.Error("categoriesFromRows row parsing error", mlog.Err(err))
			return nil, err
		}

		categories = append(categories, category)
	}

	return categories, nil
}
