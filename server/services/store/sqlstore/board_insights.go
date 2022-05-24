package sqlstore

import (
	"database/sql"
	"encoding/json"
	"fmt"

	"github.com/mattermost/focalboard/server/model"

	sq "github.com/Masterminds/squirrel"

	"github.com/mattermost/mattermost-server/v6/shared/mlog"
)

func (s *SQLStore) getTeamBoardsInsights(db sq.BaseRunner, duration string, channelIDs []string) ([]*model.BoardInsight, error) {
	/*
		Get top private, public boards, combine the list and filter the top 10. Note we can't limit 10 for subqueries.
	*/

	qb := s.getQueryBuilder(db)
	publicBoards := qb.Select(`blocks.id, blocks.title,
		count(blocks_history.id) as count, blocks_history.modified_by, blocks.created_by`).
		From(s.tablePrefix + "blocks_history as blocks_history").
		Join(s.tablePrefix + "blocks as blocks on blocks_history.root_id = blocks.id").
		Where(sq.Gt{"blocks_history.update_at": s.durationSelector(duration)}).
		Where(sq.Eq{"blocks_history.workspace_id": channelIDs}).
		Where(sq.NotEq{"blocks_history.modified_by": "system"}).
		Where(sq.Eq{"blocks.delete_at": 0}).
		GroupBy("blocks.title, blocks.created_by, blocks.id, blocks_history.modified_by")

	insightsQuery := qb.Select(fmt.Sprintf("id, title, sum(count) as activity_count, %s as active_users, created_by",
		s.concatenationSelector("distinct modified_by", ","))).
		FromSelect(publicBoards, "boards_and_blocks_history").
		GroupBy("id, title, created_by").
		OrderBy("activity_count desc").
		Limit(10)

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
	boardInsights, err = populateIcons(s, db, boardInsights)
	if err != nil {
		s.logger.Debug(`Team insights icon populate error`, mlog.Err(err))
		return nil, err
	}

	return boardInsights, nil
}

func (s *SQLStore) getUserBoardsInsights(db sq.BaseRunner, userID string,
	duration string, channelIDs []string) ([]*model.BoardInsight, error) {
	/**
	Get top 10 private, public boards, combine the list and filter the top 10
	*/
	qb := s.getQueryBuilder(db)
	publicBoards := qb.Select(`blocks.id, blocks.title,
		count(blocks_history.id) as count, blocks_history.modified_by, blocks.created_by`).
		From(s.tablePrefix + "blocks_history as blocks_history").
		Join(s.tablePrefix + "blocks as blocks on blocks_history.root_id = blocks.id").
		Where(sq.Gt{"blocks_history.update_at": s.durationSelector(duration)}).
		Where(sq.Eq{"blocks_history.workspace_id": channelIDs}).
		Where(sq.NotEq{"blocks_history.modified_by": "system"}).
		Where(sq.Eq{"blocks.delete_at": 0}).
		GroupBy("blocks.title, blocks.created_by, blocks.id, blocks_history.modified_by")

	userInsightsQuery := qb.Select("*").FromSelect(qb.Select(fmt.Sprintf("id, title, sum(count) as activity_count, %s as active_users, created_by",
		s.concatenationSelector("distinct modified_by", ","))).
		FromSelect(publicBoards, "boards_and_blocks_history").
		GroupBy("id, title, created_by").
		OrderBy("activity_count desc"), "team_insights").
		Where(sq.Eq{
			"created_by": userID,
		}).
		// due to lack of position operator, we have to hardcode arguments, and placeholder here
		Where(s.elementInColumn(5+len(channelIDs), "active_users")).
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
	boardInsights, err = populateIcons(s, db, boardInsights)
	if err != nil {
		s.logger.Debug(`User insights icon populate error`, mlog.Err(err))
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
		}
		row := s.db.QueryRow(iconQueryString, args...)
		if err != nil {
			return nil, err
		}
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
