package sqlstore

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"time"

	"github.com/mattermost/focalboard/server/model"

	sq "github.com/Masterminds/squirrel"
	mmModel "github.com/mattermost/mattermost-server/v6/model"

	"github.com/mattermost/mattermost-server/v6/shared/mlog"
)

func (s *SQLStore) getTeamBoardsInsights(db sq.BaseRunner, teamID string, userID string, since int64, offset int, limit int) (*model.BoardInsightsList, error) {
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
				boards.id,
				boards.title,
				boards.icon,
				count(boards_history.id) as count,
				boards_history.modified_by,
				boards.created_by
			from
				%[2]vboards_history as boards_history
				join %[2]vboards as boards on boards_history.id = boards.id
			where
				boards_history.insert_at > %[3]s
				and boards.team_id = %[4]s
				and boards_history.modified_by != 'system'
				and boards.delete_at = 0
			group by
				boards_history.id,
				boards.id,
				boards_history.modified_by
			UNION
			ALL
			select
				boards.id,
				boards.title,
				boards.icon,
				count(blocks_history.id) as count,
				blocks_history.modified_by,
				boards.created_by
			from
				%[2]vblocks_history as blocks_history
				join %[2]vboards as boards on blocks_history.board_id = boards.id
			where
				blocks_history.insert_at > %[5]s
				and boards.team_id = %[6]s
				and blocks_history.modified_by != 'system'
				and boards.delete_at = 0
			group by
				blocks_history.board_id,
				boards.id,
				blocks_history.modified_by
		) as boards_and_blocks_history
	group by
		id,
		title,
		icon,
		created_by
	order by
		activity_count desc
	limit
		4;`,
		s.concatenationSelector("distinct modified_by", ","),
		s.tablePrefix,
		s.parameterPlaceholder(1),
		s.parameterPlaceholder(2),
		s.parameterPlaceholder(3),
		s.parameterPlaceholder(4),
	)

	var args []interface{}
	args = append(args, mmModel.GetTimeForMillis(since).Format(time.RFC3339), teamID, mmModel.GetTimeForMillis(since).Format(time.RFC3339), teamID)
	rows, err := db.Query(insightsQueryStr, args...)

	if err != nil {
		s.logger.Error(`Team insights query ERROR`, mlog.Err(err))
		return nil, err
	}
	defer s.CloseRows(rows)

	boardsInsights, err := boardsInsightsFromRows(rows)
	if err != nil {
		return nil, err
	}
	boardInsightsPaginated := model.GetTopBoardInsightsListWithPagination(boardsInsights, limit)

	return boardInsightsPaginated, nil
}

func (s *SQLStore) getUserBoardsInsights(db sq.BaseRunner, teamID string, userID string, since int64, offset int, limit int) (*model.BoardInsightsList, error) {
	/**
	Some squirrel issues to note here are
	1. https://github.com/Masterminds/squirrel/issues/285 - since we're using 1+ sub queries. When placeholders are counted for second query, the placeholder names are repeated.
	2. No handlers at the moment for nested conditions with 'in' operator in squirrel - for the final where clause to shortlist user's boards.
	*/
	insightsQueryStr := fmt.Sprintf(`select *
	from (select
			id,
			title,
			icon,
			sum(count) as activity_count,
			%[1]s as active_users,
			created_by
		from
			(
				select
					boards.id,
					boards.title,
					boards.icon,
					count(boards_history.id) as count,
					boards_history.modified_by,
					boards.created_by
				from
					%[2]vboards_history as boards_history
					join %[2]vboards as boards on boards_history.id = boards.id
				where
					boards_history.insert_at > %[3]s
					and boards_history.modified_by != 'system'
					and boards.delete_at = 0
				group by
					boards_history.id,
					boards.id,
					boards_history.modified_by
				UNION
				ALL
				select
					boards.id,
					boards.title,
					boards.icon,
					count(blocks_history.id) as count,
					blocks_history.modified_by,
					boards.created_by
				from
					%[2]vblocks_history as blocks_history
					join %[2]vboards as boards on blocks_history.board_id = boards.id
				where
					blocks_history.insert_at > %[4]s
					and blocks_history.modified_by != 'system'
					and boards.delete_at = 0
				group by
					blocks_history.board_id,
					boards.id,
					blocks_history.modified_by
			) as boards_and_blocks_history
		group by
			id,
			title,
			icon,
			created_by
		order by
			activity_count desc
		) as insights
	where created_by=%[5]s or %[6]s
	limit 4;
	`,
		s.concatenationSelector("distinct modified_by", ","),
		s.tablePrefix,
		s.parameterPlaceholder(1),
		s.parameterPlaceholder(2),
		s.parameterPlaceholder(3),
		// 4 below represents parameter count and will be '$4' or '?' depending on db type
		s.elementInColumn(4, "active_users"),
	)

	var args []interface{}
	args = append(args, mmModel.GetTimeForMillis(since).Format(time.RFC3339), mmModel.GetTimeForMillis(since).Format(time.RFC3339), userID, userID)
	rows, err := db.Query(insightsQueryStr, args...)

	if err != nil {
		s.logger.Error(`Team insights query ERROR`, mlog.Err(err))
		return nil, err
	}
	defer s.CloseRows(rows)

	boardsInsights, err := boardsInsightsFromRows(rows)
	if err != nil {
		return nil, err
	}
	boardInsightsPaginated := model.GetTopBoardInsightsListWithPagination(boardsInsights, limit)

	return boardInsightsPaginated, nil
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

func populateIcons(s *SQLStore, db sq.BaseRunner, boardsInsights []*model.BoardInsight) ([]*model.BoardInsight, error) {
	qb := s.getQueryBuilder(db)
	for _, boardInsight := range boardsInsights {
		// querying raw instead of calling store.GetBoardsFromSameID needs container, and this function has no context on channel ID
		// performance wise, this is better since 1) it's querying for only fields 2) it's querying for only one row.
		boardID := boardInsight.BoardID
		iconQuery := qb.Select("COALESCE(fields, '{}')").From(s.tablePrefix + "blocks").Where(sq.Eq{"id": boardID})
		iconQueryString, args, err := iconQuery.ToSql()
		if err != nil {
			s.logger.Error(`Query parsing error while getting icons`, mlog.Err(err))
			return nil, err
		}
		row := s.db.QueryRow(iconQueryString, args...)
		var fieldsJSON string
		var fields map[string]interface{}
		err = row.Scan(
			&fieldsJSON,
		)
		if err != nil {
			return nil, err
		}
		err = json.Unmarshal([]byte(fieldsJSON), &fields)
		if err != nil {
			s.logger.Error(`ERROR unmarshalling populateIcons fields`, mlog.Err(err))
			return nil, err
		}
		boardInsight.Icon = fields["icon"].(string)
	}
	return boardsInsights, nil
}
