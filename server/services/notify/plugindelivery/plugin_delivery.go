// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package plugindelivery

import (
	"fmt"

	"github.com/mattermost/focalboard/server/services/notify"

	"github.com/mattermost/mattermost-server/v6/model"
)

type PluginAPI interface {
	// GetDirectChannel gets a direct message channel.
	// If the channel does not exist it will create it.
	GetDirectChannel(userID1, userID2 string) (*model.Channel, error)

	// CreatePost creates a post.
	CreatePost(post *model.Post) error

	// GetUserByIS gets a user by their ID.
	GetUserByID(userID string) (*model.User, error)

	// GetUserByUsername gets a user by their username.
	GetUserByUsername(name string) (*model.User, error)
}

// PluginDelivery provides ability to send notifications to direct message channels via Mattermost plugin API.
type PluginDelivery struct {
	botID      string
	serverRoot string
	api        PluginAPI
}

func New(botID string, serverRoot string, api PluginAPI) *PluginDelivery {
	return &PluginDelivery{
		botID:      botID,
		serverRoot: serverRoot,
		api:        api,
	}
}

func (pd *PluginDelivery) Deliver(mentionUsername string, extract string, evt notify.BlockChangeEvent) error {
	user, err := userFromUsername(pd.api, mentionUsername)
	if err != nil {
		if isErrNotFound(err) {
			// not really an error; could just be someone typed "@sometext"
			return nil
		} else {
			return fmt.Errorf("cannot lookup mentioned user: %w", err)
		}
	}

	author, err := pd.api.GetUserByID(evt.UserID)
	if err != nil {
		return fmt.Errorf("cannot find user: %w", err)
	}

	channel, err := pd.api.GetDirectChannel(user.Id, pd.botID)
	if err != nil {
		return fmt.Errorf("cannot get direct channel: %w", err)
	}
	link := makeLink(pd.serverRoot, evt.Workspace, evt.Board.ID, evt.Card.ID)

	post := &model.Post{
		UserId:    pd.botID,
		ChannelId: channel.Id,
		Message:   formatMessage(author.Username, extract, evt.Card.Title, link, evt.BlockChanged),
	}
	return pd.api.CreatePost(post)
}
