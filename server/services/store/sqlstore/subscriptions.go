package sqlstore

import (
	"database/sql"
	"time"

	sq "github.com/Masterminds/squirrel"
	"github.com/google/uuid"
	"github.com/mattermost/focalboard/server/model"

	"github.com/mattermost/mattermost-server/v6/shared/mlog"
)

func subscriptionFields() []string {
	return []string{
		"id",
		"block_type",
		"block_id",
		"subscriber_type",
		"subscriber_id",
		"notified_at",
		"create_at",
		"delete_at",
	}
}

func valuesForSubscription(sub *model.Subscription) []interface{} {
	return []interface{}{
		sub.ID,
		sub.BlockType,
		sub.BlockID,
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
			&sub.ID,
			&sub.BlockType,
			&sub.BlockID,
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

	subscription, err := s.GetSubscription(sub.BlockID, sub.SubscriberID)
	if subscription != nil || err != nil {
		return subscription, err
	}

	now := time.Now().Unix()

	subAdd := *sub
	subAdd.ID = uuid.New().String()
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
			mlog.String("subscriber_id", sub.SubscriberID),
			mlog.Err(err),
		)
		return nil, err
	}
	return &subAdd, nil
}

// DeleteSubscription soft deletes the subscription for a specific block and subscriber.
func (s *SQLStore) DeleteSubscription(blockID string, subscriberID string) error {
	now := time.Now().Unix()

	query := s.getQueryBuilder().
		Update(s.tablePrefix+"subscriptions").
		Set("delete_at", now).
		Where(sq.Eq{"block_id": blockID}).
		Where(sq.Eq{"subscriber_id": subscriberID})

	_, err := query.Exec()
	return err
}

// GetSubscription fetches the subscription for a specific block and subscriber.
func (s *SQLStore) GetSubscription(blockID string, subscriberID string) (*model.Subscription, error) {
	query := s.getQueryBuilder().
		Select(subscriptionFields()...).
		From(s.tablePrefix + "subscriptions").
		Where(sq.Eq{"block_id": blockID}).
		Where(sq.Eq{"subscriber_id": subscriberID}).
		Where(sq.Eq{"delete_at": 0})

	rows, err := query.Query()
	if err != nil {
		s.logger.Error("Cannot fetch subscription for block & subscriber",
			mlog.String("block_id", blockID),
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
			mlog.String("subscriber_id", subscriberID),
			mlog.Err(err),
		)
		return nil, err
	}
	if len(subscriptions) == 0 {
		return nil, nil
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
func (s *SQLStore) GetSubscribersForBlock(blockID string) ([]*model.Subscriber, error) {
	query := s.getQueryBuilder().
		Select(
			"subscriber_type",
			"subscriber_id",
		).
		From(s.tablePrefix + "subscriptions").
		Where(sq.Eq{"block_id": blockID}).
		Where(sq.Eq{"delete_at": 0})

	rows, err := query.Query()
	if err != nil {
		s.logger.Error("Cannot fetch subscribers for block",
			mlog.String("block_id", blockID),
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
