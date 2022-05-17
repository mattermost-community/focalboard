// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package sqlstore

import (
	"database/sql"
	"errors"

	sq "github.com/Masterminds/squirrel"
	"github.com/mattermost/focalboard/server/model"
)

func parentIsNotTemplateFilter(dbtype string) string {
	switch(dbtype) {
	case mysqlDBType:
		return "COALESCE(JSON_EXTRACT(pb.fields, '$.isTemplate'), 'false') = 'false'"
	case postgresDBType:
		return "COALESCE((pb.fields->'isTemplate')::text::boolean, false) = false"
	default:
		return "COALESCE(json_extract(pb.fields, '$.isTemplate'), false) = false"
	}
}

// activeCardsQuery applies the necessary filters to the query for it
// to fetch an active cards window if the cardLimit is set, or all the
// active cards if it's 0
func (s *SQLStore) activeCardsQuery(db sq.BaseRunner, selectStr string, cardLimit int) sq.SelectBuilder {
	query := s.getQueryBuilder(db).
		Select(selectStr).
		From(s.tablePrefix + "blocks b").
		Join(s.tablePrefix + "blocks pb on b.parent_id=pb.id").
		Where(sq.Eq{
			"b.delete_at": 0,
			"b.type": model.TypeCard,
			"pb.type": model.TypeBoard,
		}).
		Where(parentIsNotTemplateFilter(s.dbType)).
		OrderBy("b.update_at DESC")

	if cardLimit != 0 {
		query = query.
			Limit(1).
			Offset(uint64(cardLimit-1))
	}

	return query
}

// getUsedCardsCount returns the amount of active cards in the server
func (s *SQLStore) getUsedCardsCount(db sq.BaseRunner) (int, error) {
	row := s.activeCardsQuery(db, "count(b.id)", 0).
		QueryRow()

	var usedCards int
	err := row.Scan(&usedCards)
	if err != nil {
		return 0, err
	}

	return usedCards, nil
}

// getCardLimitTimestamp returns the timestamp of the last active
// card, being the limit determined by the cardLimit parameter
func (s *SQLStore) getCardLimitTimestamp(db sq.BaseRunner, cardLimit int) (int64, error) {
	row := s.activeCardsQuery(db, "b.update_at", cardLimit).
		QueryRow()

	var cardLimitTimestamp int64
	scanErr := row.Scan(&cardLimitTimestamp)
	if errors.Is(scanErr, sql.ErrNoRows) {
		return 0, nil
	}
	if scanErr != nil {
		return 0, scanErr
	}

	return cardLimitTimestamp, nil
}
