// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package plugindelivery

import (
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

	// CreateMember adds a user to the specified team. Safe to call if the user is
	// already a member of the team.
	CreateMember(teamID string, userID string) (*mm_model.TeamMember, error)
}

// PluginDelivery provides ability to send notifications to direct message channels via Mattermost plugin API.
type PluginDelivery struct {
	botID      string
	serverRoot string
	api        PluginAPI
}

// New creates a PluginDelivery instance.
func New(botID string, serverRoot string, api PluginAPI) *PluginDelivery {
	return &PluginDelivery{
		botID:      botID,
		serverRoot: serverRoot,
		api:        api,
	}
}
