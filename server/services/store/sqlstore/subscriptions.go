// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package sqlstore

import (
	"database/sql"

	sq "github.com/Masterminds/squirrel"
	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/services/store"

	"github.com/mattermost/mattermost-server/v6/shared/mlog"
)

func subscriptionFields() []string {
	return []string{
		"block_type",
		"block_id",
		"workspace_id",
		"subscriber_type",
		"subscriber_id",
		"notified_at",
		"create_at",
		"delete_at",
	}
}

func valuesForSubscription(sub *model.Subscription) []interface{} {
	return []interface{}{
		sub.BlockType,
		sub.BlockID,
		sub.WorkspaceID,
		sub.SubscriberType,
		sub.SubscriberID,
		sub.NotifiedAt,
		sub.CreateAt,
		sub.DeleteAt,
	}
}

func (s *SQLStore) subscriptionsFromRows(rows *sql.Rows) ([]*model.Subscription, error) {
	subscriptions := []*model.Subscription{}

	for rows.Next() {
		var sub model.Subscription
		err := rows.Scan(
			&sub.BlockType,
			&sub.BlockID,
			&sub.WorkspaceID,
			&sub.SubscriberType,
			&sub.SubscriberID,
			&sub.NotifiedAt,
			&sub.CreateAt,
			&sub.DeleteAt,
		)
		if err != nil {
			return nil, err
		}
		subscriptions = append(subscriptions, &sub)
	}
	return subscriptions, nil
}

// CreateSubscription creates a new subscription, or returns an existing subscription
// for the block & subscriber.
func (s *SQLStore) CreateSubscription(sub *model.Subscription) (*model.Subscription, error) {
	if err := sub.IsValid(); err != nil {
		return nil, err
	}

	c := store.Container{
		WorkspaceID: sub.WorkspaceID,
	}

	subscription, err := s.GetSubscription(c, sub.BlockID, sub.SubscriberID)
	if subscription != nil || (err != nil && !s.IsErrNotFound(err)) {
		return subscription, err
	}

	now := model.GetMillis()

	subAdd := *sub
	subAdd.NotifiedAt = now // notified_at set so first notification doesn't pick up all history
	subAdd.CreateAt = now
	subAdd.DeleteAt = 0

	query := s.getQueryBuilder().
		Insert(s.tablePrefix + "subscriptions").
		Columns(subscriptionFields()...).
		Values(valuesForSubscription(&subAdd)...)

	if _, err = query.Exec(); err != nil {
		s.logger.Error("Cannot create subscription",
			mlog.String("block_id", sub.BlockID),
			mlog.String("workspace_id", sub.WorkspaceID),
			mlog.String("subscriber_id", sub.SubscriberID),
			mlog.Err(err),
		)
		return nil, err
	}
	return &subAdd, nil
}

// DeleteSubscription soft deletes the subscription for a specific block and subscriber.
func (s *SQLStore) DeleteSubscription(c store.Container, blockID string, subscriberID string) error {
	now := model.GetMillis()

	query := s.getQueryBuilder().
		Update(s.tablePrefix+"subscriptions").
		Set("delete_at", now).
		Where(sq.Eq{"block_id": blockID}).
		Where(sq.Eq{"workspace_id": c.WorkspaceID}).
		Where(sq.Eq{"subscriber_id": subscriberID})

	result, err := query.Exec()
	if err != nil {
		return err
	}

	count, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if count == 0 {
		return store.NewErrNotFound(c.WorkspaceID + "," + blockID + "," + subscriberID)
	}

	return nil
}

// GetSubscription fetches the subscription for a specific block and subscriber.
func (s *SQLStore) GetSubscription(c store.Container, blockID string, subscriberID string) (*model.Subscription, error) {
	query := s.getQueryBuilder().
		Select(subscriptionFields()...).
		From(s.tablePrefix + "subscriptions").
		Where(sq.Eq{"block_id": blockID}).
		Where(sq.Eq{"workspace_id": c.WorkspaceID}).
		Where(sq.Eq{"subscriber_id": subscriberID}).
		Where(sq.Eq{"delete_at": 0})

	rows, err := query.Query()
	if err != nil {
		s.logger.Error("Cannot fetch subscription for block & subscriber",
			mlog.String("block_id", blockID),
			mlog.String("workspace_id", c.WorkspaceID),
			mlog.String("subscriber_id", subscriberID),
			mlog.Err(err),
		)
		return nil, err
	}
	defer s.CloseRows(rows)

	subscriptions, err := s.subscriptionsFromRows(rows)
	if err != nil {
		s.logger.Error("Cannot get subscription for block & subscriber",
			mlog.String("block_id", blockID),
			mlog.String("workspace_id", c.WorkspaceID),
			mlog.String("subscriber_id", subscriberID),
			mlog.Err(err),
		)
		return nil, err
	}
	if len(subscriptions) == 0 {
		return nil, store.NewErrNotFound(c.WorkspaceID + "," + blockID + "," + subscriberID)
	}
	return subscriptions[0], nil
}

// GetSubscriptions fetches all subscriptions for a specific subscriber.
func (s *SQLStore) GetSubscriptions(subscriberID string) ([]*model.Subscription, error) {
	query := s.getQueryBuilder().
		Select(subscriptionFields()...).
		From(s.tablePrefix + "subscriptions").
		Where(sq.Eq{"subscriber_id": subscriberID}).
		Where(sq.Eq{"delete_at": 0})

	rows, err := query.Query()
	if err != nil {
		s.logger.Error("Cannot fetch subscriptions for subscriber",
			mlog.String("subscriber_id", subscriberID),
			mlog.Err(err),
		)
		return nil, err
	}
	defer s.CloseRows(rows)

	return s.subscriptionsFromRows(rows)
}

// GetSubscribersForBlock fetches all subscribers for a block.
func (s *SQLStore) GetSubscribersForBlock(c store.Container, blockID string) ([]*model.Subscriber, error) {
	query := s.getQueryBuilder().
		Select(
			"subscriber_type",
			"subscriber_id",
		).
		From(s.tablePrefix + "subscriptions").
		Where(sq.Eq{"block_id": blockID}).
		Where(sq.Eq{"workspace_id": c.WorkspaceID}).
		Where(sq.Eq{"delete_at": 0})

	rows, err := query.Query()
	if err != nil {
		s.logger.Error("Cannot fetch subscribers for block",
			mlog.String("block_id", blockID),
			mlog.String("workspace_id", c.WorkspaceID),
			mlog.Err(err),
		)
		return nil, err
	}
	defer s.CloseRows(rows)

	subscribers := []*model.Subscriber{}

	for rows.Next() {
		var sub model.Subscriber
		err := rows.Scan(
			&sub.SubscriberType,
			&sub.SubscriberID,
		)
		if err != nil {
			return nil, err
		}
		subscribers = append(subscribers, &sub)
	}
	return subscribers, nil
}

// GetSubscribersCountForBlock returns a count of all subscribers for a block.
func (s *SQLStore) GetSubscribersCountForBlock(c store.Container, blockID string) (int, error) {
	query := s.getQueryBuilder().
		Select("count(subscriber_id)").
		From(s.tablePrefix + "subscriptions").
		Where(sq.Eq{"block_id": blockID}).
		Where(sq.Eq{"workspace_id": c.WorkspaceID}).
		Where(sq.Eq{"delete_at": 0})

	row := query.QueryRow()

	var count int
	err := row.Scan(&count)
	if err != nil {
		s.logger.Error("Cannot count subscribers for block",
			mlog.String("block_id", blockID),
			mlog.String("workspace_id", c.WorkspaceID),
			mlog.Err(err),
		)
		return 0, err
	}
	return count, nil
}
