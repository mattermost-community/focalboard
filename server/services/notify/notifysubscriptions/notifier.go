// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package notifysubscriptions

import (
	"errors"
	"fmt"
	"sync"
	"time"

	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/services/store"
	"github.com/mattermost/focalboard/server/utils"
	"github.com/wiggin77/merror"

	"github.com/mattermost/mattermost-server/v6/shared/mlog"
)

const (
	defBlockNotificationFreq = time.Minute * 2
	enqueueNotifyHintTimeout = time.Second * 10
)

var (
	errEnqueueNotifyHintTimeout = errors.New("enqueue notify hint timed out")
)

// notifier provides block change notifications for subscribers. Block change events are batched
// via notifications hints written to the database so that fewer notifications are sent for active
// blocks.
type notifier struct {
	serverRoot string
	store      Store
	delivery   SubscriptionDelivery
	logger     *mlog.Logger

	hints chan *model.NotificationHint

	mux  sync.Mutex
	done chan struct{}
}

func newNotifier(params BackendParams) *notifier {
	return &notifier{
		serverRoot: params.ServerRoot,
		store:      params.Store,
		delivery:   params.Delivery,
		logger:     params.Logger,
		done:       nil,
		hints:      make(chan *model.NotificationHint, 20),
	}
}

func (n *notifier) start() {
	n.mux.Lock()
	defer n.mux.Unlock()

	if n.done == nil {
		n.done = make(chan struct{})
		go n.loop()
	}
}

func (n *notifier) stop() {
	n.mux.Lock()
	defer n.mux.Unlock()

	if n.done != nil {
		close(n.done)
		n.done = nil
	}
}

func (n *notifier) loop() {
	done := n.done
	nextNotify := n.notify()

	for {
		n.logger.Debug("subscription notifier loop",
			mlog.Time("next_notify", nextNotify),
		)
		select {
		case hint := <-n.hints:
			// if this hint suggests a notification is due before the next scheduled notification
			// then update the nextNotify
			notifyAt := model.GetTimeForMillis(hint.NotifyAt)
			if notifyAt.Before(nextNotify) {
				nextNotify = notifyAt
			}

		case <-time.After(time.Until(nextNotify)):
			nextNotify = n.notify()

		case <-done:
			return
		}
	}
}

func (n *notifier) onNotifyHint(hint *model.NotificationHint) error {
	n.logger.Debug("onNotifyHint - enqueing hint", mlog.Any("hint", hint))

	select {
	case n.hints <- hint:
	case <-time.After(enqueueNotifyHintTimeout):
		return errEnqueueNotifyHintTimeout
	}
	return nil
}

func (n *notifier) notify() time.Time {
	var hint *model.NotificationHint
	var err error

	for {
		hint, err = n.store.GetNextNotificationHint(true)
		if n.store.IsErrNotFound(err) {
			// no more hints in table; wait up to an hour or when `onNotifyHint` is called again
			next := time.Now().Add(time.Hour * 1)
			n.logger.Debug("notify - no hints in queue", mlog.Time("next_check", next))
			return next
		}

		if err != nil {
			n.logger.Error("Error fetching next notification", mlog.Err(err))
			// try again in a minute
			return time.Now().Add(time.Minute * 1)
		}

		if err = n.notifySubscribers(hint); err != nil {
			n.logger.Error("Error notifying subscribers", mlog.Err(err))
		}
	}
}

func (n *notifier) notifySubscribers(hint *model.NotificationHint) error {
	c := store.Container{
		WorkspaceID: hint.WorkspaceID,
	}

	// 	get the subscriber list
	subs, err := n.store.GetSubscribersForBlock(c, hint.BlockID)
	if err != nil {
		return err
	}
	if len(subs) == 0 {
		n.logger.Debug("notifySubscribers - no subscribers", mlog.Any("hint", hint))
		return nil
	}

	n.logger.Debug("notifySubscribers - subscribers",
		mlog.Any("hint", hint),
		mlog.Int("sub_count", len(subs)),
	)

	// subs slice is sorted by `NotifiedAt`, therefore subs[0] contains the oldest NotifiedAt needed
	oldestNotifiedAt := subs[0].NotifiedAt

	// need the block's board and card.
	board, card, err := n.store.GetBoardAndCardByID(c, hint.BlockID)
	if err != nil || board == nil || card == nil {
		return fmt.Errorf("could not get board & card for block %s: %w", hint.BlockID, err)
	}

	dg := &diffGenerator{
		container:    c,
		board:        board,
		card:         card,
		store:        n.store,
		hint:         hint,
		lastNotifyAt: oldestNotifiedAt,
		logger:       n.logger,
	}
	diffs, err := dg.generateDiffs()
	if err != nil {
		return err
	}

	n.logger.Debug("notifySubscribers - diffs",
		mlog.Any("hint", hint),
		mlog.Int("diff_count", len(diffs)),
	)

	if len(diffs) == 0 {
		return nil
	}

	opts := DiffConvOpts{
		Language: "en", // TODO: use correct language with i18n available on server.
		MakeCardLink: func(block *model.Block) string {
			return fmt.Sprintf("[%s](%s)", block.Title, utils.MakeCardLink(n.serverRoot, board.WorkspaceID, board.ID, card.ID))
		},
	}

	attachments, err := Diffs2SlackAttachments(diffs, opts)
	if err != nil {
		return err
	}

	merr := merror.New()
	for _, sub := range subs {
		// don't notify the author of their own changes.
		if sub.SubscriberID == hint.ModifiedByID {
			n.logger.Debug("notifySubscribers - deliver, skipping author",
				mlog.Any("hint", hint),
				mlog.String("modified_by_id", hint.ModifiedByID),
				mlog.String("modified_by_username", hint.Username),
			)
			continue
		}

		n.logger.Debug("notifySubscribers - deliver",
			mlog.Any("hint", hint),
			mlog.String("modified_by_id", hint.ModifiedByID),
			mlog.String("subscriber_id", sub.SubscriberID),
			mlog.String("subscriber_type", string(sub.SubscriberType)),
		)

		if err = n.delivery.SubscriptionDeliverSlackAttachments(sub.SubscriberID, sub.SubscriberType, attachments); err != nil {
			merr.Append(fmt.Errorf("cannot deliver notification to subscriber %s [%s]: %w",
				sub.SubscriberID, sub.SubscriberType, err))
		}
	}

	// find the new NotifiedAt based on the newest diff.
	var notifyAt int64
	for _, d := range diffs {
		if d.UpdateAt > notifyAt {
			notifyAt = d.UpdateAt
		}
	}

	// update the last notified_at for all subscribers since we at least attempted to notify all of them.
	err = dg.store.UpdateSubscribersNotifiedAt(dg.container, dg.hint.BlockID, notifyAt)
	if err != nil {
		merr.Append(fmt.Errorf("could not update subscribers notified_at for block %s: %w", dg.hint.BlockID, err))
	}

	return merr.ErrorOrNil()
}
