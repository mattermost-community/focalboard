package sqlstore

import (
	"database/sql"
	"fmt"

	"github.com/mattermost/focalboard/server/model"

	sq "github.com/Masterminds/squirrel"

	"github.com/mattermost/mattermost-server/v6/shared/mlog"
)

func (s *SQLStore) getTeamBoardsInsights(db sq.BaseRunner, teamID string, duration string) ([]*model.BoardInsight, error) {
	/*
		Get top private, public boards, combine the list and filter the top 10. Note we can't limit 10 for subqueries.
	*/

	// safe to use channels, channelmembers here since we're checking that user belongs to team, and without mm-auth, the auth-check returns false and
	// store function won't be called.
	qb := s.getQueryBuilder(db)
	publicBoards := qb.Select(`blocks.id, blocks.fields->>'icon' as icon, blocks.title,
		count(blocks_history.id) as count, blocks_history.modified_by, blocks.created_by`).
		Prefix("(").
		From(s.tablePrefix + "blocks_history as blocks_history").
		Join(s.tablePrefix + "blocks as blocks on blocks_history.root_id = blocks.id").
		Join("PublicChannels as ch on ch.id = blocks_history.workspace_id").
		Where(sq.Gt{"blocks_history.update_at": s.durationSelector(duration)}).
		Where(sq.Eq{"ch.teamid": teamID}).
		Where(sq.NotEq{"blocks_history.modified_by": "system"}).
		Where(sq.Eq{"blocks.delete_at": 0}).
		GroupBy("blocks.title, blocks.created_by, blocks.id, blocks_history.modified_by, icon")

	privateBoards := qb.Select(`blocks.id, blocks.fields->>'icon' as icon, blocks.title,
		count(blocks_history.id) as count, blocks_history.modified_by, blocks.created_by`).
		Prefix(") UNION ALL (").
		From(s.tablePrefix + "blocks_history as blocks_history").
		Join(s.tablePrefix + "blocks as blocks on blocks_history.root_id = blocks.id").
		Join("channels as ch on ch.id = blocks_history.workspace_id").
		Where(sq.Gt{"blocks_history.update_at": s.durationSelector(duration)}).
		Where(sq.Eq{"ch.teamid": teamID}).
		Where(sq.Eq{"ch.type": "P"}).
		Where(sq.NotEq{"blocks_history.modified_by": "system"}).
		Where(sq.Eq{"blocks.delete_at": 0}).
		GroupBy("blocks.title, blocks.created_by, blocks.id, blocks_history.modified_by, icon").
		Suffix(")")

	boardsActivity := publicBoards.SuffixExpr(privateBoards)

	insightsQuery := qb.Select(fmt.Sprintf("id, title, icon, sum(count) as activity_count, %s as active_users, created_by",
		s.concatenationSelector("distinct modified_by", ","))).
		FromSelect(boardsActivity, "boards_and_blocks_history").
		GroupBy("id, title, icon, created_by").
		OrderBy("activity_count desc").
		Limit(10)

	insightsQuery = insightsQuery.PlaceholderFormat(sq.Dollar)
	rows, err := insightsQuery.Query()

	if err != nil {
		s.logger.Debug(`Team insights query ERROR`, mlog.Err(err))
		return nil, err
	}
	defer s.CloseRows(rows)

	boardInsights, err := boardsInsightsFromRows(rows)
	if err != nil {
		s.logger.Debug(`Team insights parsing error`, mlog.Err(err))
		return nil, err
	}

	return boardInsights, nil
}

func (s *SQLStore) getUserBoardsInsights(db sq.BaseRunner, userID string, teamID string, duration string) ([]*model.BoardInsight, error) {
	/**
	Get top 10 private, public boards, combine the list and filter the top 10
	*/
	qb := s.getQueryBuilder(db)
	publicBoards := qb.Select(`blocks.id, blocks.fields->>'icon' as icon, blocks.title,
		count(blocks_history.id) as count, blocks_history.modified_by, blocks.created_by`).
		Prefix("(").
		From(s.tablePrefix + "blocks_history as blocks_history").
		Join(s.tablePrefix + "blocks as blocks on blocks_history.root_id = blocks.id").
		Join("PublicChannels as ch on ch.id = blocks_history.workspace_id").
		Where(sq.Gt{"blocks_history.update_at": s.durationSelector(duration)}).
		Where(sq.Eq{"ch.teamid": teamID}).
		Where(sq.NotEq{"blocks_history.modified_by": "system"}).
		Where(sq.Eq{"blocks.delete_at": 0}).
		GroupBy("blocks.title, blocks.created_by, blocks.id, blocks_history.modified_by, icon").
		Limit(10)

	privateBoards := qb.Select(`blocks.id, blocks.fields->>'icon' as icon, blocks.title,
		count(blocks_history.id) as count, blocks_history.modified_by, blocks.created_by`).
		Prefix(") UNION ALL (").
		From(s.tablePrefix + "blocks_history as blocks_history").
		Join(s.tablePrefix + "blocks as blocks on blocks_history.root_id = blocks.id").
		Join("channels as ch on ch.id = blocks_history.workspace_id").
		Where(sq.Gt{"blocks_history.update_at": s.durationSelector(duration)}).
		Where(sq.Eq{"ch.teamid": teamID}).
		Where(sq.Eq{"ch.type": "P"}).
		Where(sq.NotEq{"blocks_history.modified_by": "system"}).
		Where(sq.Eq{"blocks.delete_at": 0}).
		GroupBy("blocks.title, blocks.created_by, blocks.id, blocks_history.modified_by, icon").
		Limit(10).
		Suffix(")")

	boardsActivity := publicBoards.SuffixExpr(privateBoards)

	userInsightsQuery := qb.Select("*").FromSelect(qb.Select(fmt.Sprintf("id, title, icon, sum(count) as activity_count, %s as active_users, created_by",
		s.concatenationSelector("distinct modified_by", ","))).
		FromSelect(boardsActivity, "boards_and_blocks_history").
		GroupBy("id, title, icon, created_by").
		OrderBy("activity_count desc"), "team_insights").
		Where(sq.Eq{
			"created_by": userID,
		}).
		// due to lack of position operator, we have to hardcode arguments, and placeholder here
		Where(s.elementInColumn(11, "active_users")).
		Limit(10)
	userInsightsQueryStr, args, err := userInsightsQuery.ToSql()
	if err != nil {
		s.logger.Debug(`User insights query parsing ERROR`, mlog.Err(err))
		return nil, err
	}

	// adding the 11th argument
	args = append(args, userID)

	rows, err := db.Query(userInsightsQueryStr, args...)

	if err != nil {
		s.logger.Debug(`User insights query ERROR`, mlog.Err(err))
		return nil, err
	}
	defer s.CloseRows(rows)

	boardInsights, err := boardsInsightsFromRows(rows)
	if err != nil {
		s.logger.Debug(`User insights rows parsing error`, mlog.Err(err))
		return nil, err
	}

	return boardInsights, nil
}

func boardsInsightsFromRows(rows *sql.Rows) ([]*model.BoardInsight, error) {
	boardsInsights := []*model.BoardInsight{}
	for rows.Next() {
		var boardInsight model.BoardInsight

		err := rows.Scan(
			&boardInsight.BoardID,
			&boardInsight.Title,
			&boardInsight.Icon,
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
