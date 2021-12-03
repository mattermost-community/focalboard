package sqlstore

import (
	"database/sql"
	sq "github.com/Masterminds/squirrel"
	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/mattermost-server/v6/shared/mlog"
)

func (s *SQLStore) getUserCategoryBoards(db sq.BaseRunner, userID, teamID string) ([]model.CategoryBlocks, error) {
	categories, err := s.getUserCategories(db, userID, teamID)
	if err != nil {
		return nil, err
	}

	userCategoryBlocks := []model.CategoryBlocks{}
	for _, category := range categories {
		attributes, err := s.getCategoryBlockAttributes(db, category.ID)
		if err != nil {
			return nil, err
		}

		userCategoryBlock := model.CategoryBlocks{
			Category:        category,
			BlockAttributes: attributes,
		}

		userCategoryBlocks = append(userCategoryBlocks, userCategoryBlock)
	}

	return userCategoryBlocks, nil
}

func (s *SQLStore) getCategoryBlockAttributes(db sq.BaseRunner, categoryID string) ([]model.CategoryBlockAttributes, error) {
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

	return s.categoryBlocksAttributesFromRows(rows)
}

func (s *SQLStore) categoryBlocksAttributesFromRows(rows *sql.Rows) ([]model.CategoryBlockAttributes, error) {
	attributes := []model.CategoryBlockAttributes{}

	for rows.Next() {
		attribute := model.CategoryBlockAttributes{}
		if err := rows.Scan(&attribute.BlockID); err != nil {
			s.logger.Error("categoryBlocksAttributesFromRows row scan error", mlog.Err(err))
			return nil, err
		}

		attributes = append(attributes, attribute)
	}

	return attributes, nil
}
