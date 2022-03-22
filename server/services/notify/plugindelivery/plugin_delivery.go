// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package plugindelivery

import (
	"fmt"

	"github.com/mattermost/focalboard/server/services/notify"
	"github.com/mattermost/focalboard/server/utils"

	mm_model "github.com/mattermost/mattermost-server/v6/model"
)

type PluginAPI interface {
	// GetDirectChannel gets a direct message channel.
	// If the channel does not exist it will create it.
	GetDirectChannel(userID1, userID2 string) (*mm_model.Channel, error)

	// CreatePost creates a post.
	CreatePost(post *mm_model.Post) error

	// GetUserByID gets a user by their ID.
	GetUserByID(userID string) (*mm_model.User, error)

	// GetUserByUsername gets a user by their username.
	GetUserByUsername(name string) (*mm_model.User, error)

	// GetTeamMember gets a team member by their user id.
	GetTeamMember(teamID string, userID string) (*mm_model.TeamMember, error)

	// GetChannelByID gets a Channel by its ID.
	GetChannelByID(channelID string) (*mm_model.Channel, error)

	// GetChannelMember gets a channel member by userID.
	GetChannelMember(channelID string, userID string) (*mm_model.ChannelMember, error)

	// IsErrNotFound returns true if `err` or one of its wrapped children are the `ErrNotFound`
	// as defined in the plugin API.
	IsErrNotFound(err error) bool
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
	member, err := teamMemberFromUsername(pd.api, mentionUsername, evt.TeamID)
	if err != nil {
		if isErrNotFound(err) {
			// not really an error; could just be someone typed "@sometext"
			return nil
		} else {
			return fmt.Errorf("cannot lookup mentioned user: %w", err)
		}
	}

	author, err := pd.api.GetUserByID(evt.ModifiedByID)
	if err != nil {
		return fmt.Errorf("cannot find user: %w", err)
	}

	channel, err := pd.api.GetDirectChannel(member.UserId, pd.botID)
	if err != nil {
		return fmt.Errorf("cannot get direct channel: %w", err)
	}
	link := utils.MakeCardLink(pd.serverRoot, evt.TeamID, evt.Board.ID, evt.Card.ID)

	post := &mm_model.Post{
		UserId:    pd.botID,
		ChannelId: channel.Id,
		Message:   formatMessage(author.Username, extract, evt.Card.Title, link, evt.BlockChanged),
	}
	return pd.api.CreatePost(post)
}
