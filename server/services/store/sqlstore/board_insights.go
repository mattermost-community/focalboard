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
	insightsQueryStr := fmt.Sprintf(`select
		id,
		title,
		icon,
		sum(count) as activity_count,
		%s as active_users,
		created_by
	from
		(
			select
				blocks.id,
				blocks.fields->>'icon' as icon, blocks.title, count(blocks_history.id) as count, blocks_history.modified_by, blocks.created_by
			from
				%[2]vblocks_history as blocks_history
				join %[2]vblocks as blocks on blocks_history.root_id = blocks.id
				join channels as ch on ch.id = blocks_history.workspace_id
			where
				blocks_history.update_at > %[3]s
				and ch.teamid = %[4]s
				and blocks_history.modified_by != 'system'
				and blocks.delete_at = 0
			group by
				blocks.title,
				blocks.created_by,
				blocks.id,
				blocks_history.modified_by,
				icon
		) as boards_and_blocks_history
	group by
		id,
		title,
		icon,
		created_by
	order by
		activity_count desc
	limit 10;`,
		s.concatenationSelector("distinct modified_by", ","),
		s.tablePrefix,
		s.parameterPlaceholder(1),
		s.parameterPlaceholder(2),
	)
	args := []interface{}{s.durationSelector(duration), teamID}
	rows, err := db.Query(insightsQueryStr, args...)

	if err != nil {
		s.logger.Debug(`Team insights query ERROR`, mlog.Err(err))
		return nil, err
	}
	defer s.CloseRows(rows)

	boardInsights, err := boardsInsightsFromRows(rows)
	if err != nil {
		fmt.Println("something line 90")
		s.logger.Debug(`Rows parsing error`, mlog.Err(err))
		s.logger.Info(`Rows parsing error`, mlog.Err(err))
		return nil, err
	}
	err = rows.Err()
	if err != nil {
		fmt.Println(err)
	}
	return boardInsights, nil
}

func (s *SQLStore) getUserBoardsInsights(db sq.BaseRunner, userID string, teamID string, duration string) ([]*model.BoardInsight, error) {
	/**
	Some squirrel issues to note here are
	1. https://github.com/Masterminds/squirrel/issues/285 - since we're using 1+ sub queries. When placeholders are counted for second query, the placeholder names are repeated.
		This is the reason to not use conditional operators in Where clauses which would eventually parametrize the variables.
	*/
	insightsQueryStr := fmt.Sprintf(`select * from (select
		id,
		title,
		icon,
		sum(count) as activity_count,
		%s as active_users,
		created_by
	from
		(
			select
				blocks.id,
				blocks.fields->>'icon' as icon, blocks.title, count(blocks_history.id) as count, blocks_history.modified_by, blocks.created_by
			from
				%[2]vblocks_history as blocks_history
				join %[2]vblocks as blocks on blocks_history.root_id = blocks.id
				join channels as ch on ch.id = blocks_history.workspace_id
			where
				blocks_history.update_at > %[3]s
				and ch.teamid = %[4]s
				and blocks_history.modified_by != 'system'
				and blocks.delete_at = 0
			group by
				blocks.title,
				blocks.created_by,
				blocks.id,
				blocks_history.modified_by,
				icon
		) as boards_and_blocks_history
	group by
		id,
		title,
		icon,
		created_by
	order by
		activity_count desc) as boards_insights
	where
		created_by = %[5]s
		or %[6]s
	limit 10;`,
		s.concatenationSelector("distinct modified_by", ","),
		s.tablePrefix,
		s.parameterPlaceholder(1),
		s.parameterPlaceholder(2),
		s.parameterPlaceholder(3),
		s.elementInColumn(4, "active_users"))
	args := []interface{}{s.durationSelector(duration), teamID, userID, userID}
	rows, err := db.Query(insightsQueryStr, args...)

	if err != nil {
		s.logger.Debug(`Team insights query ERROR`, mlog.Err(err))
		return nil, err
	}
	defer s.CloseRows(rows)

	boardInsights, err := boardsInsightsFromRows(rows)
	if err != nil {
		fmt.Println("something line 90")
		s.logger.Debug(`Rows parsing error`, mlog.Err(err))
		return nil, err
	}
	err = rows.Err()
	if err != nil {
		fmt.Println(err)
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
