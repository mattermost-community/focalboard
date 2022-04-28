package sqlstore

import (
	"database/sql"

	"github.com/mattermost/focalboard/server/model"

	sq "github.com/Masterminds/squirrel"

	"github.com/mattermost/mattermost-server/v6/shared/mlog"
)

func (s *SQLStore) getTeamBoardsInsights(db sq.BaseRunner, teamID string) ([]*model.BoardInsight, error) {

	boardsHistoryQuery := s.getQueryBuilder(db).Select("boards.id", "boards.title", "count(boards_history.id) as count", "boards_history.modified_by", "boards.created_by").
		From("focalboard_boards_history as boards_history").
		Join("focalboard_boards as boards on boards_history.id = boards.id").
		Where(sq.And{
			sq.Lt{"boards_history.insert_at": "now() - interval '28 day'"},
			sq.Eq{"boards.team_id": "team_id"},
			sq.NotEq{"boards_history.modified_by": "system"},
			sq.Eq{"boards.delete_at": 0},
		}).
		GroupBy("boards_history.id, boards.id, boards_history.modified_by")
	blocksHistoryQuery := s.getQueryBuilder(db).Select("boards.id", "boards.title", "count(blocks_history.id) as count", "blocks_history.modified_by", "boards.created_by").
		From("focalboard_blocks_history as blocks_history").
		Join("focalboard_boards as boards on blocks_history.board_id = boards.id").
		Where(sq.And{
			sq.Lt{"boards_history.insert_at": "now() - interval '28 day'"},
			sq.Eq{"boards.team_id": "team_id"},
			sq.NotEq{"boards_history.modified_by": "system"},
			sq.Eq{"boards.delete_at": 0},
		}).
		GroupBy("boards_history.id, boards.id, boards_history.modified_by")
	blocksHistoryQueryString, blocksHistoryQueryargs, err := blocksHistoryQuery.ToSql()

	if err != nil {
		return nil, err
	}
	boardsAndBlocksHistoryQuery := boardsHistoryQuery.Suffix("UNION ALL "+blocksHistoryQueryString, blocksHistoryQueryargs...)
	insights := s.getQueryBuilder(db).Select("id", "title", "sum(count) as activity_count", "string_agg(distinct modified_by, ',') as active_users", "created_by").
		FromSelect(boardsAndBlocksHistoryQuery, "boards_and_blocks_history").
		GroupBy("id, title, created_by").
		OrderBy("activity_count desc").
		Limit(4)

	rows, err := insights.Query()

	if err != nil {
		s.logger.Error(`Team insights query ERROR`, mlog.Err(err))
		return nil, err
	}
	defer s.CloseRows(rows)

	boardsInsights, err := boardsInsightsFromRows(rows)
	if err != nil {
		return nil, err
	}
	return boardsInsights, nil
}

func (s *SQLStore) getUserBoardsInsights(db sq.BaseRunner, userID string) ([]*model.BoardInsight, error) {

	boardsHistoryQuery := s.getQueryBuilder(db).Select("boards.id", "boards.title", "count(boards_history.id) as count", "boards_history.modified_by", "boards.created_by").
		From("focalboard_boards_history as boards_history").
		Join("focalboard_boards as boards on boards_history.id = boards.id").
		Where(sq.And{
			sq.Lt{"boards_history.insert_at": "now() - interval '28 day'"},
			sq.Eq{"boards.team_id": "team_id"},
			sq.NotEq{"boards_history.modified_by": "system"},
			sq.Eq{"boards.delete_at": 0},
		}).
		GroupBy("boards_history.id, boards.id, boards_history.modified_by")
	blocksHistoryQuery := s.getQueryBuilder(db).Select("boards.id", "boards.title", "count(blocks_history.id) as count", "blocks_history.modified_by", "boards.created_by").
		From("focalboard_blocks_history as blocks_history").
		Join("focalboard_boards as boards on blocks_history.board_id = boards.id").
		Where(sq.And{
			sq.Lt{"boards_history.insert_at": "now() - interval '28 day'"},
			sq.Eq{"boards.team_id": "team_id"},
			sq.NotEq{"boards_history.modified_by": "system"},
			sq.Eq{"boards.delete_at": 0},
		}).
		GroupBy("boards_history.id, boards.id, boards_history.modified_by")
	blocksHistoryQueryString, blocksHistoryQueryargs, err := blocksHistoryQuery.ToSql()

	if err != nil {
		return nil, err
	}
	boardsAndBlocksHistoryQuery := boardsHistoryQuery.Suffix("UNION ALL "+blocksHistoryQueryString, blocksHistoryQueryargs...)
	insights := s.getQueryBuilder(db).Select("id", "title", "sum(count) as activity_count", "string_agg(distinct modified_by, ',') as active_users", "created_by").
		FromSelect(boardsAndBlocksHistoryQuery, "boards_and_blocks_history").
		GroupBy("id, title, created_by").
		OrderBy("activity_count desc").
		Limit(4)

	userInsights := s.getQueryBuilder(db).Select("*").
		FromSelect(insights, "insights").
		// TODO: clean the following where clause, couldn't find appropriate nested conditions with 'in' operator in squirrel
		Where("created_by = '" + userID + "' or position('58wh73bt1inkdbnzyjciboe8ic' in active_users) > 0").
		Limit(4)

	rows, err := userInsights.Query()

	if err != nil {
		s.logger.Error(`User insights query ERROR`, mlog.Err(err))
		return nil, err
	}
	defer s.CloseRows(rows)

	boardsInsights, err := boardsInsightsFromRows(rows)
	if err != nil {
		return nil, err
	}
	return boardsInsights, nil
}

func boardsInsightsFromRows(rows *sql.Rows) ([]*model.BoardInsight, error) {

	boardsInsights := []*model.BoardInsight{}
	for rows.Next() {
		var boardInsight model.BoardInsight

		err := rows.Scan(
			&boardInsight.BoardID,
			&boardInsight.Title,
			&boardInsight.ActivityCount,
			&boardInsight.ActiveUsers,
			&boardInsight.CreatedBy,
		)
		if err != nil {
			return nil, err
		}
		if err != nil {
			return nil, err
		}

		boardsInsights = append(boardsInsights, &boardInsight)
	}
	return boardsInsights, nil
}
