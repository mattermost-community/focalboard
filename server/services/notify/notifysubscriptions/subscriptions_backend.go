// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package notifysubscriptions

import (
	"fmt"
	"time"

	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/services/notify"
	"github.com/mattermost/focalboard/server/ws"
	"github.com/wiggin77/merror"

	"github.com/mattermost/mattermost-server/v6/shared/mlog"
)

const (
	backendName = "notifySubscriptions"
)

type BackendParams struct {
	ServerRoot             string
	Store                  Store
	Delivery               SubscriptionDelivery
	WSAdapter              ws.Adapter
	Logger                 *mlog.Logger
	NotifyFreqCardSeconds  int
	NotifyFreqBoardSeconds int
}

// Backend provides the notification backend for subscriptions.
type Backend struct {
	store                  Store
	delivery               SubscriptionDelivery
	notifier               *notifier
	wsAdapter              ws.Adapter
	logger                 *mlog.Logger
	notifyFreqCardSeconds  int
	notifyFreqBoardSeconds int
}

func New(params BackendParams) *Backend {
	return &Backend{
		store:                  params.Store,
		delivery:               params.Delivery,
		notifier:               newNotifier(params),
		wsAdapter:              params.WSAdapter,
		logger:                 params.Logger,
		notifyFreqCardSeconds:  params.NotifyFreqCardSeconds,
		notifyFreqBoardSeconds: params.NotifyFreqBoardSeconds,
	}
}

func (b *Backend) Start() error {
	b.logger.Debug("Starting subscriptions backend",
		mlog.Int("freq_card", b.notifyFreqCardSeconds),
		mlog.Int("freq_board", b.notifyFreqBoardSeconds),
	)
	b.notifier.start()
	return nil
}

func (b *Backend) ShutDown() error {
	b.logger.Debug("Stopping subscriptions backend")
	b.notifier.stop()
	_ = b.logger.Flush()
	return nil
}

func (b *Backend) Name() string {
	return backendName
}

func (b *Backend) getBlockUpdateFreq(blockType model.BlockType) time.Duration {
	switch blockType {
	case model.TypeCard:
		return time.Second * time.Duration(b.notifyFreqCardSeconds)
	default:
		return defBlockNotificationFreq
	}
}

func (b *Backend) getBoardUpdateFreq() time.Duration {
	return time.Second * time.Duration(b.notifyFreqBoardSeconds)
}

func (b *Backend) BlockChanged(evt notify.BlockChangeEvent) error {
	if evt.Board == nil {
		b.logger.Warn("No board found for block, skipping notify",
			mlog.String("block_id", evt.BlockChanged.ID),
		)
		return nil
	}

	merr := merror.New()
	var err error

	// if new card added, automatically subscribe the author.
	if evt.Action == notify.Add && evt.BlockChanged.Type == model.TypeCard {
		sub := &model.Subscription{
			BlockType:      model.TypeCard,
			BlockID:        evt.BlockChanged.ID,
			BoardID:        evt.Board.ID,
			SubscriberType: model.SubTypeUser,
			SubscriberID:   evt.ModifiedByID,
		}

		if sub, err = b.store.CreateSubscription(sub); err != nil {
			b.logger.Warn("Cannot subscribe card author to card",
				mlog.String("card_id", evt.BlockChanged.ID),
				mlog.Err(err),
			)
		}
		b.wsAdapter.BroadcastSubscriptionChange(sub.BoardID, sub)
	}

	// notify board subscribers
	// TODO: Probably this should be `GetbscribersForBoard`, but this works accidentally, so I'll leave it as is now
	subs, err := b.store.GetSubscribersForBlock(evt.Board.ID)
	if err != nil {
		merr.Append(fmt.Errorf("cannot fetch subscribers for board %s: %w", evt.Board.ID, err))
	}
	if err = b.notifySubscribers(subs, evt.Board, nil, evt.ModifiedByID); err != nil {
		merr.Append(fmt.Errorf("cannot notify board subscribers for board %s: %w", evt.Board.ID, err))
	}

	if evt.Card == nil {
		return merr.ErrorOrNil()
	}

	// notify card subscribers
	subs, err = b.store.GetSubscribersForBlock(evt.Card.ID)
	if err != nil {
		merr.Append(fmt.Errorf("cannot fetch subscribers for card %s: %w", evt.Card.ID, err))
	}
	if err = b.notifySubscribers(subs, nil, evt.Card, evt.ModifiedByID); err != nil {
		merr.Append(fmt.Errorf("cannot notify card subscribers for card %s: %w", evt.Card.ID, err))
	}

	// notify block subscribers (if/when other types can be subscribed to)
	if evt.Board.ID != evt.BlockChanged.ID && evt.Card.ID != evt.BlockChanged.ID {
		subs, err := b.store.GetSubscribersForBlock(evt.BlockChanged.ID)
		if err != nil {
			merr.Append(fmt.Errorf("cannot fetch subscribers for block %s: %w", evt.BlockChanged.ID, err))
		}
		if err := b.notifySubscribers(subs, nil, evt.BlockChanged, evt.ModifiedByID); err != nil {
			merr.Append(fmt.Errorf("cannot notify block subscribers for block %s: %w", evt.BlockChanged.ID, err))
		}
	}
	return merr.ErrorOrNil()
}

// notifySubscribers triggers a change notification for subscribers by writing a notification hint to the database.
func (b *Backend) notifySubscribers(subs []*model.Subscriber, board *model.Board, block *model.Block, modifiedByID string) error {
	if len(subs) == 0 {
		return nil
	}

	if board != nil {

		hint := &model.NotificationHint{
			BlockType:    block.Type,
			BlockID:      block.ID,
			ModifiedByID: modifiedByID,
		}

		hint, err := b.store.UpsertNotificationHint(hint, b.getBlockUpdateFreq(block.Type))
		if err != nil {
			return fmt.Errorf("cannot upsert notification hint: %w", err)
		}
		if err := b.notifier.onNotifyHint(hint); err != nil {
			return err
		}
	}

	if block != nil {
		hint := &model.NotificationHint{
			BlockType:    "board",
			BlockID:      board.ID,
			TeamID:       board.TeamID,
			ModifiedByID: modifiedByID,
		}

		hint, err := b.store.UpsertNotificationHint(hint, b.getBlockUpdateFreq(block.Type))
		if err != nil {
			return fmt.Errorf("cannot upsert notification hint: %w", err)
		}
		if err := b.notifier.onNotifyHint(hint); err != nil {
			return err
		}
	}
	return nil
}

// OnMention satisfies the `MentionListener` interface and is called whenever a @mention notification
// is sent. Here we create a subscription for the mentioned user to the card.
func (b *Backend) OnMention(userID string, evt notify.BlockChangeEvent) {
	if evt.Card == nil {
		b.logger.Debug("Cannot subscribe mentioned user to nil card",
			mlog.String("user_id", userID),
			mlog.String("block_id", evt.BlockChanged.ID),
		)
		return
	}

	sub := &model.Subscription{
		BlockType:      model.TypeCard,
		BlockID:        evt.Card.ID,
		TeamID:         evt.Team,
		SubscriberType: model.SubTypeUser,
		SubscriberID:   userID,
	}

	var err error

	if sub, err = b.store.CreateSubscription(sub); err != nil {
		b.logger.Warn("Cannot subscribe mentioned user to card",
			mlog.String("user_id", userID),
			mlog.String("card_id", evt.Card.ID),
			mlog.Err(err),
		)
		return
	}
	b.wsAdapter.BroadcastSubscriptionChange(sub.TeamID, sub)

	b.logger.Debug("Subscribed mentioned user to card",
		mlog.String("user_id", userID),
		mlog.String("card_id", evt.Card.ID),
	)
}

// BroadcastSubscriptionChange sends a websocket message with details of the changed subscription to all
// connected users in the workspace.
func (b *Backend) BroadcastSubscriptionChange(workspaceID string, subscription *model.Subscription) {
	b.wsAdapter.BroadcastSubscriptionChange(workspaceID, subscription)
}
