package sqlstore

import (
	"database/sql"
	"fmt"

	"github.com/mattermost/focalboard/server/model"

	sq "github.com/Masterminds/squirrel"

	"github.com/mattermost/mattermost-server/v6/shared/mlog"
)

func (s *SQLStore) getTeamBoardsInsights(db sq.BaseRunner, teamID string, duration string) ([]*model.BoardInsight, error) {
	/**
	Some squirrel issues to note here are
	1. https://github.com/Masterminds/squirrel/issues/285 - since we're using 1+ sub queries. When placeholders are counted for second query, the placeholder names are repeated.
		This is the reason to not use conditional operators in Where clauses which would eventually parametrize the variables.
	*/

	boardsHistoryQuery := s.getQueryBuilder(db).Select("boards.id", "boards.title", "count(boards_history.id) as count", "boards_history.modified_by", "boards.created_by").
		From(s.tablePrefix + "boards_history as boards_history").
		Join(s.tablePrefix + "boards as boards on boards_history.id = boards.id").
		Where(fmt.Sprintf("boards_history.insert_at > %s and boards.team_id = '%s' and boards_history.modified_by != 'system' and boards.delete_at = 0",
			s.durationSelector(duration), teamID)).
		GroupBy("boards_history.id, boards.id, boards_history.modified_by")
	blocksHistoryQuery := s.getQueryBuilder(db).Select("boards.id", "boards.title", "count(blocks_history.id) as count", "blocks_history.modified_by", "boards.created_by").
		From(s.tablePrefix + "blocks_history as blocks_history").
		Join(s.tablePrefix + "boards as boards on blocks_history.board_id = boards.id").
		Where(fmt.Sprintf("blocks_history.insert_at > %s and boards.team_id = '%s' and blocks_history.modified_by != 'system' and boards.delete_at = 0",
			s.durationSelector(duration), teamID)).
		GroupBy("blocks_history.id, boards.id, blocks_history.modified_by")
	blocksHistoryQueryString, blocksHistoryQueryargs, err := blocksHistoryQuery.ToSql()

	if err != nil {
		return nil, err
	}
	boardsAndBlocksHistoryQuery := boardsHistoryQuery.Suffix("UNION ALL "+blocksHistoryQueryString, blocksHistoryQueryargs...)
	insights := s.getQueryBuilder(db).Select("id", "title", "sum(count) as activity_count",
		fmt.Sprintf("%s as active_users", s.concatenationSelector("distinct modified_by", ",")), "created_by").
		FromSelect(boardsAndBlocksHistoryQuery, "boards_and_blocks_history").
		GroupBy("id, title, created_by").
		OrderBy("activity_count desc").
		Limit(100)

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

func (s *SQLStore) getUserBoardsInsights(db sq.BaseRunner, userID string, duration string) ([]*model.BoardInsight, error) {
	/**
	Some squirrel issues to note here are
	1. https://github.com/Masterminds/squirrel/issues/285 - since we're using 1+ sub queries. When placeholders are counted for second query, the placeholder names are repeated.
	2. No handlers at the moment for nested conditions with 'in' operator in squirrel - for the final where clause to shortlist user's boards.
	*/

	boardsHistoryQuery := s.getQueryBuilder(db).Select("boards.id", "boards.title", "count(boards_history.id) as count", "boards_history.modified_by", "boards.created_by").
		From(s.tablePrefix + "boards_history as boards_history").
		Join(s.tablePrefix + "boards as boards on boards_history.id = boards.id").
		Where(fmt.Sprintf("boards_history.insert_at > %s and boards_history.modified_by != 'system' and boards.delete_at = 0", s.durationSelector(duration))).
		GroupBy("boards_history.id, boards.id, boards_history.modified_by")
	blocksHistoryQuery := s.getQueryBuilder(db).Select("boards.id", "boards.title", "count(blocks_history.id) as count", "blocks_history.modified_by", "boards.created_by").
		From(s.tablePrefix + "blocks_history as blocks_history").
		Join(s.tablePrefix + "boards as boards on blocks_history.board_id = boards.id").
		Where(fmt.Sprintf("blocks_history.insert_at > %s and blocks_history.modified_by != 'system' and boards.delete_at = 0", s.durationSelector(duration))).
		GroupBy("blocks_history.id, boards.id, blocks_history.modified_by")
	blocksHistoryQueryString, blocksHistoryQueryargs, err := blocksHistoryQuery.ToSql()

	if err != nil {
		return nil, err
	}
	boardsAndBlocksHistoryQuery := boardsHistoryQuery.Suffix("UNION ALL "+blocksHistoryQueryString, blocksHistoryQueryargs...)
	insights := s.getQueryBuilder(db).Select("id", "title", "sum(count) as activity_count",
		fmt.Sprintf("%s as active_users", s.concatenationSelector("distinct modified_by", ",")), "created_by").
		FromSelect(boardsAndBlocksHistoryQuery, "boards_and_blocks_history").
		GroupBy("id, title, created_by").
		OrderBy("activity_count desc")

	userInsights := s.getQueryBuilder(db).Select("*").
		FromSelect(insights, "insights").
		// TODO: clean the following where clause
		Where(fmt.Sprintf("created_by = '%s' or %s", userID, s.elementInColumn(userID, "active_users"))).
		Limit(100)

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
		boardsInsights = append(boardsInsights, &boardInsight)
	}
	return boardsInsights, nil
}
