// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package sqlstore

import (
	"database/sql"
	"time"

	sq "github.com/Masterminds/squirrel"
	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/utils"

	"github.com/mattermost/mattermost-server/v6/shared/mlog"
)

func notificationHintFields() []string {
	return []string{
		"block_type",
		"block_id",
		"create_at",
		"notify_at",
	}
}

func valuesForNotificationHint(hint *model.NotificationHint) []interface{} {
	return []interface{}{
		hint.BlockType,
		hint.BlockID,
		hint.CreateAt,
		hint.NotifyAt,
	}
}

func (s *SQLStore) notificationHintFromRows(rows *sql.Rows) ([]*model.NotificationHint, error) {
	hints := []*model.NotificationHint{}

	for rows.Next() {
		var hint model.NotificationHint
		err := rows.Scan(
			&hint.BlockType,
			&hint.BlockID,
			&hint.CreateAt,
			&hint.NotifyAt,
		)
		if err != nil {
			return nil, err
		}
		hints = append(hints, &hint)
	}
	return hints, nil
}

// UpsertNotificationHint creates or updates a notification hint. When updating the `notify_at` is set
// to the current time plus `notificationFreq`.
func (s *SQLStore) UpsertNotificationHint(hint *model.NotificationHint, notificationFreq time.Duration) (*model.NotificationHint, error) {
	if err := hint.IsValid(); err != nil {
		return nil, err
	}

	hintRet, err := s.GetNotificationHint(hint.BlockID)
	if err != nil {
		return nil, err
	}

	now := model.GetMillis()
	notifyAt := utils.GetMillisForTime(time.Now().Add(notificationFreq))

	if hintRet == nil {
		// insert
		hintRet = hint.Copy()
		hintRet.CreateAt = now
		hintRet.NotifyAt = notifyAt

		query := s.getQueryBuilder().Insert(s.tablePrefix + "notification_hints").
			Columns(notificationHintFields()...).
			Values(valuesForNotificationHint(hintRet)...)
		_, err = query.Exec()
	} else {
		// update
		hintRet.NotifyAt = notifyAt

		query := s.getQueryBuilder().Update(s.tablePrefix+"notification_hints").
			Set("notify_at", now).
			Where(sq.Eq{"block_id": hintRet.BlockID})
		_, err = query.Exec()
	}

	if err != nil {
		s.logger.Error("Cannot upsert notification hint",
			mlog.String("block_id", hint.BlockID),
			mlog.Err(err),
		)
		return nil, err
	}
	return hintRet, nil
}

// DeleteNotificationHint deletes the notification hint for the specified block.
func (s *SQLStore) DeleteNotificationHint(blockID string) error {
	query := s.getQueryBuilder().
		Delete(s.tablePrefix + "notification_hints").
		Where(sq.Eq{"block_id": blockID})

	_, err := query.Exec()
	return err
}

// GetNotificationHint fetches the notification hint for the specified block.
func (s *SQLStore) GetNotificationHint(blockID string) (*model.NotificationHint, error) {
	query := s.getQueryBuilder().
		Select(notificationHintFields()...).
		From(s.tablePrefix + "notification_hints").
		Where(sq.Eq{"block_id": blockID})

	rows, err := query.Query()
	if err != nil {
		s.logger.Error("Cannot fetch notification hint",
			mlog.String("block_id", blockID),
			mlog.Err(err),
		)
		return nil, err
	}
	defer s.CloseRows(rows)

	hint, err := s.notificationHintFromRows(rows)
	if err != nil {
		s.logger.Error("Cannot get notification hint",
			mlog.String("block_id", blockID),
			mlog.Err(err),
		)
		return nil, err
	}
	if len(hint) == 0 {
		return nil, nil
	}
	return hint[0], nil
}

// GetNextNotificationHint fetches the next scheduled notification hint.
func (s *SQLStore) GetNextNotificationHint() (*model.NotificationHint, error) {
	query := s.getQueryBuilder().
		Select(notificationHintFields()...).
		From(s.tablePrefix + "notification_hints").
		OrderBy("notify_at").
		Limit(1)

	rows, err := query.Query()
	if err != nil {
		s.logger.Error("Cannot fetch next notification hint",
			mlog.Err(err),
		)
		return nil, err
	}
	defer s.CloseRows(rows)

	hint, err := s.notificationHintFromRows(rows)
	if err != nil {
		s.logger.Error("Cannot get next notification hint",
			mlog.Err(err),
		)
		return nil, err
	}
	if len(hint) == 0 {
		return nil, nil
	}
	return hint[0], nil
}
