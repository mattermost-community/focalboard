package sqlstore

import (
	sq "github.com/Masterminds/squirrel"
	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/utils"
	"github.com/mattermost/mattermost-server/v6/shared/mlog"
)

func (s *SQLStore) createCategory(db sq.BaseRunner, category model.Category) error {
	query := s.getQueryBuilder(db).
		Insert(s.tablePrefix+"categories").
		Columns(
			"id",
			"name",
			"user_id",
			"team_id",
		).
		Values(
			utils.NewID(utils.IDTypeNone),
			category.Name,
			category.UserID,
			category.TeamID,
		)

	_, err := query.Exec()
	if err != nil {
		s.logger.Error("Error creating category", mlog.String("category name", category.Name), mlog.Err(err))
		return err
	}
	return nil
}

func (s *SQLStore) updateCategory(db sq.BaseRunner, category model.Category) error {
	query := s.getQueryBuilder(db).
		Update(s.tablePrefix+"categories").
		Set("name", category.Name).
		Where("id", category.ID)

	_, err := query.Exec()
	if err != nil {
		s.logger.Error("Error updating category", mlog.String("category_id", category.ID), mlog.String("category_name", category.Name), mlog.Err(err))
		return err
	}
	return nil
}

func (s *SQLStore) deleteCategory(db sq.BaseRunner, categoryID, userID, teamID string) error {
	query := s.getQueryBuilder(db).
		Delete(s.tablePrefix+"categories").
		Where("id", categoryID).
		Where("user_id", userID).
		Where("team_id", teamID)

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
