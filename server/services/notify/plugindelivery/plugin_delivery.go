// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package plugindelivery

import (
	"fmt"
	"sync/atomic"

	"github.com/mattermost/focalboard/server/model"

	mm_model "github.com/mattermost/mattermost-server/v6/model"
)

type servicesAPI interface {
	// GetDirectChannel gets a direct message channel.
	// If the channel does not exist it will create it.
	GetDirectChannel(userID1, userID2 string) (*mm_model.Channel, error)

	// CreatePost creates a post.
	CreatePost(post *mm_model.Post) (*mm_model.Post, error)

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

	// EnsureBot ensures the specified bot is created as a bot user, and added to team.
	EnsureBot(bot *mm_model.Bot) (string, error)
}

// PluginDelivery provides ability to send notifications to direct message channels via Mattermost plugin API.
type PluginDelivery struct {
	botID      string
	botEnsured uint32
	serverRoot string
	api        servicesAPI
}

// New creates a PluginDelivery instance.
func New(serverRoot string, api servicesAPI) *PluginDelivery {
	return &PluginDelivery{
		botID:      "",
		botEnsured: 0,
		serverRoot: serverRoot,
		api:        api,
	}
}

func (pd *PluginDelivery) ensureBoardsBot() (string, error) {
	if !atomic.CompareAndSwapUint32(&pd.botEnsured, 0, 1) {
		return pd.botID, nil
	}

	bot := model.FocalboardBot
	var err error

	pd.botID, err = pd.api.EnsureBot(bot)
	if err != nil {
		return "", fmt.Errorf("failed to ensure board bot: %w", err)
	}
	return pd.botID, nil
}
