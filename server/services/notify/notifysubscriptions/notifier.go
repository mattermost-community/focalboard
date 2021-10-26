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
	"github.com/wiggin77/merror"

	"github.com/mattermost/mattermost-server/v6/shared/mlog"
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
	logger   *mlog.Logger

	hints chan *model.NotificationHint

	mux  sync.Mutex
	done chan struct{}
}

func newNotifier(store Store, delivery Delivery, logger *mlog.Logger) *notifier {
	return &notifier{
		store:    store,
		delivery: delivery,
		logger:   logger,
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
	nextNotify := n.notify()

	for {
		select {
		case hint := <-n.hints:
			// if this hint suggests a notification is due before the next scheduled notification
			// then update the nextNotify
			updateAt := model.GetTimeForMillis(hint.NotifyAt)
			freq := getBlockUpdateFreq(hint.BlockType)
			notifyAt := updateAt.Add(freq)
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
			return time.Now().Add(time.Hour * 1)
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
		return nil
	}

	diffs, err := n.generateDiffs(c, hint)
	if err != nil {
		return err
	}

	opts := MarkdownOpts{
		Language: "en", // TODO: use correct language with i18n available on server
		MakeLink: nil,  // TODO:
	}

	markdown, err := Diffs2Markdown(diffs, opts)
	if err != nil {
		return err
	}

	merr := merror.New()
	for _, sub := range subs {
		// don't notify the author of their own changes.
		if sub.SubscriberID == hint.UserID {
			continue
		}

		if err := n.delivery.Deliver(sub.SubscriberID, sub.SubscriberType, markdown); err != nil {
			merr.Append(fmt.Errorf("cannot deliver notification to subscriber %s [%s]: %w",
				sub.SubscriberID, sub.SubscriberType, err))
		}
	}
	return merr.ErrorOrNil()
}

func (n *notifier) generateDiffs(c store.Container, hint *model.NotificationHint) ([]*Diff, error) {
	block, err := n.store.GetBlock(c, hint.BlockID)
	if err != nil {
		return nil, fmt.Errorf("could not get block for notification: %w", err)
	}

	board, card, err := n.store.GetBoardAndCard(c, block)
	if err != nil {
		return nil, fmt.Errorf("could not get block's board & card for notification: %w", err)
	}

	user, err := n.store.GetUserByID(hint.UserID)
	if err != nil {
		return nil, fmt.Errorf("could not lookup user %s: %w", hint.UserID, err)
	}
	hint.Username = user.Username

	// TODO: parse board's property definitions here so it only happens once.

	switch block.Type {
	case "board":
		return n.generateDiffsForBoard(c, block, hint)
	case "card":
		diff, err := n.generateDiffsForCard(c, board, block, hint)
		if err != nil {
			return nil, err
		}
		return []*Diff{diff}, nil
	default:
		diff, err := n.generateDiffForBlock(c, board, card, block, hint)
		if err != nil {
			return nil, err
		}
		return []*Diff{diff}, nil
	}
}

func (n *notifier) generateDiffsForBoard(c store.Container, board *model.Block, hint *model.NotificationHint) ([]*Diff, error) {
	opts := model.BlockQueryOptions{
		UseBlocksHistory: true,
		InsertAfterAt:    hint.NotifyAt,
		OrderByInsertAt:  true,
	}

	blocks, err := n.store.GetSubTree2FromHistory(c, board.ID, opts)
	if err != nil {
		return nil, fmt.Errorf("could not get subtree for board %s: %w", board.ID, err)
	}

	var diffs []*Diff
	for _, b := range blocks {
		block := b
		if block.Type == "card" {
			cardDiffs, err := n.generateDiffsForCard(c, board, &block, hint)
			if err != nil {
				return nil, err
			}
			diffs = append(diffs, cardDiffs)
		}
	}

	return nil, fmt.Errorf("not implemented yet")
}

func (n *notifier) generateDiffsForCard(c store.Container, board *model.Block, card *model.Block, hint *model.NotificationHint) (*Diff, error) {
	cardDiff, err := n.generateDiffForBlock(c, board, card, card, hint)
	if err != nil {
		return nil, fmt.Errorf("could not generate diff for card %s: %w", card.ID, err)
	}

	// walk child blocks
	opts := model.BlockQueryOptions{
		UseBlocksHistory: true,
		InsertAfterAt:    hint.NotifyAt,
		OrderByInsertAt:  true,
	}
	blocks, err := n.store.GetSubTree2FromHistory(c, card.ID, opts)
	if err != nil {
		return nil, fmt.Errorf("could not get subtree for card %s: %w", card.ID, err)
	}

	for i := range blocks {
		blockDiff, err := n.generateDiffForBlock(c, board, card, &blocks[i], hint)
		if err != nil {
			return nil, fmt.Errorf("could not get subtree for card %s: %w", card.ID, err)
		}
		cardDiff.Diffs = append(cardDiff.Diffs, blockDiff)
	}
	return cardDiff, nil
}

func (n *notifier) generateDiffForBlock(c store.Container, board, card, block *model.Block, hint *model.NotificationHint) (*Diff, error) {
	// find the oldest block in blocks_history that is newer than the hint.NotifyAt.
	opts := model.BlockQueryOptions{
		UseBlocksHistory: true,
		InsertAfterAt:    hint.NotifyAt,
		OrderByInsertAt:  true,
	}
	history, err := n.store.GetBlockHistory(c, block.ID, opts)
	if err != nil {
		return nil, fmt.Errorf("could not get block history for block %s: %w", block.ID, err)
	}

	if len(history) < 2 {
		// this block didn't change
		return nil, nil
	}

	oldBlock := history[0]
	newBlock := history[len(history)-1]

	diff := &Diff{
		Board:     board,
		Card:      card,
		Username:  hint.Username,
		BlockType: block.Type,
		OldBlock:  &oldBlock,
		NewBlock:  &newBlock,
	}
	return diff, nil
}
