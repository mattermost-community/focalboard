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

	// GetUserByID gets a user by their ID.
	GetUserByID(userID string) (*model.User, error)

	// GetUserByUsername gets a user by their username.
	GetUserByUsername(name string) (*model.User, error)

	// GetTeamMember gets a team member by their user id.
	GetTeamMember(teamID string, userID string) (*model.TeamMember, error)

	// GetChannelByID gets a Channel by its ID.
	GetChannelByID(channelID string) (*model.Channel, error)

	// GetChannelMember gets a channel member by userID.
	GetChannelMember(channelID string, userID string) (*model.ChannelMember, error)

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
	// determine which team the workspace is associated with
	teamID, err := pd.getTeamID(evt)
	if err != nil {
		return fmt.Errorf("cannot determine teamID for block change notification: %w", err)
	}

	member, err := teamMemberFromUsername(pd.api, mentionUsername, teamID)
	if err != nil {
		if isErrNotFound(err) {
			// not really an error; could just be someone typed "@sometext"
			return nil
		} else {
			return fmt.Errorf("cannot lookup mentioned user: %w", err)
		}
	}

	// check that user is a member of the channel
	_, err = pd.api.GetChannelMember(evt.Workspace, member.UserId)
	if err != nil {
		if pd.api.IsErrNotFound(err) {
			// mentioned user is not a member of the channel; fail silently.
			return nil
		}
		return fmt.Errorf("cannot fetch channel member for user %s: %w", member.UserId, err)
	}

	author, err := pd.api.GetUserByID(evt.UserID)
	if err != nil {
		return fmt.Errorf("cannot find user: %w", err)
	}

	channel, err := pd.api.GetDirectChannel(member.UserId, pd.botID)
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

func (pd *PluginDelivery) getTeamID(evt notify.BlockChangeEvent) (string, error) {
	// for now, the workspace ID is also the channel ID
	channel, err := pd.api.GetChannelByID(evt.Workspace)
	if err != nil {
		return "", err
	}
	return channel.TeamId, nil
}
