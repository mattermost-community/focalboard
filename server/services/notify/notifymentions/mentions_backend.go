// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package notifymentions

import (
	"fmt"

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
	delivery   Delivery
	botID      string
	serverRoot string
	logger     *mlog.Logger
}

func New(delivery Delivery, botID string, serverRoot string, logger *mlog.Logger) *Backend {
	return &Backend{
		delivery:   delivery,
		botID:      botID,
		serverRoot: serverRoot,
		logger:     logger,
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
	author, err := b.delivery.GetUserByID(evt.UserID)
	if err != nil {
		return fmt.Errorf("cannot find user: %w", err)
	}
	merr := merror.New()

	for username := range mentions {
		if _, exists := oldMentions[username]; exists {
			// the mention already existed; no need to notify again
			continue
		}

		user, err := userFromUsername(b.delivery, username)
		if err != nil {
			// not really an error; could just be someone typed "@sometext"
			continue
		}

		channel, err := b.delivery.GetDirectChannel(user.Id, b.botID)
		if err != nil {
			merr.Append(err)
			continue
		}
		link := makeLink(b.serverRoot, evt.Workspace, evt.Board.ID, evt.Card.ID)

		post := &chatmodel.Post{
			UserId:    b.botID,
			ChannelId: channel.Id,
			Message:   formatMessage(author.Username, evt.Card.Title, link, evt.BlockChanged, username),
		}
		err = b.delivery.CreatePost(post)
		if err != nil {
			merr.Append(err)
		}
	}
	return merr.ErrorOrNil()
}

const (
	// TODO: localize these when i18n is available.
	defCommentTemplate     = "@%s mentioned you in a comment on the card [%s](%s)\n> %s"
	defDescriptionTemplate = "@%s mentioned you in the card [%s](%s)\n> %s"
)

func formatMessage(author string, card string, link string, block *model.Block, mention string) string {
	template := defDescriptionTemplate
	if block.Type == "comment" {
		template = defCommentTemplate
	}

	msg := extractText(block.Title, mention, newLimits())

	return fmt.Sprintf(template, author, card, link, msg)
}

func makeLink(serverRoot string, workspace string, board string, card string) string {
	return fmt.Sprintf("%s/workspace/%s/%s/%s/", serverRoot, workspace, board, card)
}
