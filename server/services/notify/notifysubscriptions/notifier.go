// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package notifysubscriptions

import (
	"errors"
	"sync"
	"time"

	"github.com/mattermost/focalboard/server/model"
)

const (
	defBlockNotificationFreq = time.Minute * 1
	enqueueNotifyHintTimeout = time.Second * 10
)

var (
	// defNotificationFreq provides default frequency for change notifications
	// for various block types.
	defNotificationFreq = map[string]time.Duration{
		"board": time.Hour * 24,
		"card":  time.Minute * 1,
	}

	errEnqueueNotifyHintTimeout = errors.New("enqueue notify hint timed out")
)

func getBlockUpdateFreq(blockType string) time.Duration {
	freq, ok := defNotificationFreq[blockType]
	if !ok {
		freq = defBlockNotificationFreq
	}
	return freq
}

// notifier provides block change notifications for subscribers. Block change events are batched
// via notifications hints written to the database so that fewer notifications are sent for active
// blocks.
type notifier struct {
	store    Store
	delivery Delivery

	hints chan *model.NotificationHint

	mux  sync.Mutex
	done chan struct{}
}

func newNotifier(store Store, delivery Delivery) *notifier {
	return &notifier{
		store:    store,
		delivery: delivery,
		done:     make(chan struct{}, 1),
		hints:    make(chan *model.NotificationHint, 20),
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
	nextNotify := n.calcNextNotify()

	for {
		select {
		case hint := <-n.hints:
			// if this hint suggests a notification is due before the next scheduled notification
			// then update the nextNotify
			updateAt := model.GetTimeForMillis(hint.UpdateAt)
			freq := getBlockUpdateFreq(hint.BlockType)
			notifyAt := updateAt.Add(freq)
			if notifyAt.Before(nextNotify) {
				nextNotify = notifyAt
			}

		case <-time.After(time.Until(nextNotify)):
			n.notify()
			nextNotify = n.calcNextNotify()

		case <-done:
			return
		}
	}
}

func (n *notifier) onNotifyHint(hint *model.NotificationHint) error {
	select {
	case n.hints <- hint:
	case <-time.After(enqueueNotifyHintTimeout):
		return errEnqueueNotifyHintTimeout
	}
	return nil
}

func (n *notifier) calcNextNotify() time.Time {
	return time.Now().Add(20 * time.Second)
}

func (n *notifier) notify() {

}
