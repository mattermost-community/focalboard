// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package notifymentions

import (
	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/services/notify"
	"github.com/wiggin77/merror"

	chatmodel "github.com/mattermost/mattermost-server/v6/model"
	"github.com/mattermost/mattermost-server/v6/shared/mlog"
)

const (
	backendName = "notifyMentions"
)

type Backend struct {
	delivery Delivery
	botID    string
	logger   *mlog.Logger
}

func New(delivery Delivery, botID string, logger *mlog.Logger) *Backend {
	return &Backend{
		delivery: delivery,
		botID:    botID,
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

func (b *Backend) BlockChanged(evt notify.Event, block *model.Block, oldBlock *model.Block) error {
	if block.Type != "text" {
		return nil
	}

	mentions := extractMentions(block)
	oldMentions := extractMentions(oldBlock)
	merr := merror.New()

	for username := range mentions {
		if _, exists := oldMentions[username]; exists {
			// the mention already existed; no need to notify again
			continue
		}
		user, appErr := b.delivery.GetUserByUsername(username)
		if appErr != nil {
			// not really an error; could just be someone typed "@sometext"
			continue
		}
		channel, appErr := b.delivery.GetDirectChannel(user.Id, b.botID)
		if appErr != nil {
			merr.Append(appErr)
			continue
		}

		post := &chatmodel.Post{
			UserId:    b.botID,
			ChannelId: channel.Id,
			Message:   "You got mentioned!!",
		}
		_, appErr = b.delivery.CreatePost(post)
		if appErr != nil {
			merr.Append(appErr)
		}
	}
	return merr.ErrorOrNil()
}
