// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package notifysubscriptions

import (
	"fmt"

	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/services/notify"
	"github.com/wiggin77/merror"

	"github.com/mattermost/mattermost-server/v6/shared/mlog"
)

const (
	backendName = "notifySubscriptions"
)

// Backend provides the notification backend for subscriptions.
type Backend struct {
	store    Store
	delivery Delivery
	notifier *notifier
	logger   *mlog.Logger
}

func New(store Store, delivery Delivery, logger *mlog.Logger) *Backend {
	return &Backend{
		store:    store,
		delivery: delivery,
		notifier: newNotifier(store, delivery),
		logger:   logger,
	}
}

func (b *Backend) Start() error {
	b.notifier.start()
	return nil
}

func (b *Backend) ShutDown() error {
	b.notifier.stop()
	_ = b.logger.Flush()
	return nil
}

func (b *Backend) Name() string {
	return backendName
}

func (b *Backend) BlockChanged(evt notify.BlockChangeEvent) error {
	merr := merror.New()
	var err error

	// notify board subscribers
	subs, err := b.store.GetSubscribersForBlock(evt.Board.ID)
	if err != nil {
		merr.Append(fmt.Errorf("cannot fetch subscribers for board %s: %w", evt.Board.ID, err))
	}
	if err = b.notifySubscribers(subs, evt.Board); err != nil {
		merr.Append(fmt.Errorf("cannot notify board subscribers for board %s: %w", evt.Board.ID, err))
	}

	// notify card subscribers
	subs, err = b.store.GetSubscribersForBlock(evt.Card.ID)
	if err != nil {
		merr.Append(fmt.Errorf("cannot fetch subscribers for card %s: %w", evt.Card.ID, err))
	}
	if err = b.notifySubscribers(subs, evt.Card); err != nil {
		merr.Append(fmt.Errorf("cannot notify card subscribers for card %s: %w", evt.Card.ID, err))
	}

	// notify block subscribers (if/when other types can be subscribed to)
	if evt.Board.ID != evt.BlockChanged.ID && evt.Card.ID != evt.BlockChanged.ID {
		subs, err = b.store.GetSubscribersForBlock(evt.BlockChanged.ID)
		if err != nil {
			merr.Append(fmt.Errorf("cannot fetch subscribers for block %s: %w", evt.BlockChanged.ID, err))
		}
		if err := b.notifySubscribers(subs, evt.BlockChanged); err != nil {
			merr.Append(fmt.Errorf("cannot notify block subscribers for block %s: %w", evt.BlockChanged.ID, err))
		}
	}
	return merr.ErrorOrNil()
}

// notifySubscribers triggers a change notification for subscribers by writing a notification hint to the database.
func (b *Backend) notifySubscribers(subs []*model.Subscriber, block *model.Block) error {
	if len(subs) == 0 {
		return nil
	}

	hint := &model.NotificationHint{
		BlockType: block.Type,
		BlockID:   block.ID,
	}

	_, err := b.store.UpsertNotificationHint(hint)
	if err != nil {
		return fmt.Errorf("cannot upsert notification hint: %w", err)
	}

	return b.notifier.onNotifyHint(hint)
}
