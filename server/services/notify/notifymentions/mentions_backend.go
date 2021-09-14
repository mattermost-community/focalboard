// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package notifymentions

import (
	"fmt"

	"github.com/mattermost/focalboard/server/services/notify"
	"github.com/wiggin77/merror"

	"github.com/mattermost/mattermost-server/v6/shared/mlog"
)

const (
	backendName = "notifyMentions"
)

type Backend struct {
	delivery Delivery
	logger   *mlog.Logger
}

func New(delivery Delivery, logger *mlog.Logger) *Backend {
	return &Backend{
		delivery: delivery,
		logger:   logger,
	}
}

func (b *Backend) Start() error {
	return nil
}

func (b *Backend) ShutDown() error {
	_ = b.logger.Flush()
	return nil
}

func (b *Backend) Name() string {
	return backendName
}

func (b *Backend) BlockChanged(evt notify.BlockChangeEvent) error {
	if evt.Board == nil || evt.Card == nil {
		return nil
	}

	if evt.Action == notify.Delete {
		return nil
	}

	if evt.BlockChanged.Type != "text" && evt.BlockChanged.Type != "comment" {
		return nil
	}

	mentions := extractMentions(evt.BlockChanged)
	if len(mentions) == 0 {
		return nil
	}

	oldMentions := extractMentions(evt.BlockOld)
	merr := merror.New()

	for username := range mentions {
		if _, exists := oldMentions[username]; exists {
			// the mention already existed; no need to notify again
			continue
		}

		extract := extractText(evt.BlockChanged.Title, username, newLimits())

		err := b.delivery.Deliver(username, extract, evt)
		if err != nil {
			merr.Append(fmt.Errorf("cannot deliver notification for @%s: %w", username, err))
		}
	}
	return merr.ErrorOrNil()
}
