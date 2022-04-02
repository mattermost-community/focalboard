// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package plugindelivery

import (
	"errors"
	"fmt"

	"github.com/mattermost/focalboard/server/services/notify"
	"github.com/mattermost/focalboard/server/utils"

	"github.com/mattermost/mattermost-server/v6/model"
)

var (
	ErrMentionPermission = errors.New("mention not permitted")
)

// MentionDeliver notifies a user they have been mentioned in a block.
func (pd *PluginDelivery) MentionDeliver(mentionUsername string, extract string, evt notify.BlockChangeEvent) (string, error) {
	user, err := userByUsername(pd.api, mentionUsername)
	if err != nil {
		if isErrNotFound(err) {
			// not really an error; could just be someone typed "@sometext"
			return "", nil
		} else {
			return "", fmt.Errorf("cannot lookup mentioned user: %w", err)
		}
	}

	// make sure mentioned user has permissions to team.
	if !pd.permissions.HasPermissionToTeam(user.Id, evt.TeamID, model.PermissionViewTeam) {
		return "", fmt.Errorf("mentioned user %s not member of team %s: %w", user.Id, evt.TeamID, ErrMentionPermission)
	}

	author, err := pd.api.GetUserByID(evt.ModifiedByID)
	if err != nil {
		return "", fmt.Errorf("cannot find user: %w", err)
	}

	channel, err := pd.api.GetDirectChannel(user.Id, pd.botID)
	if err != nil {
		return "", fmt.Errorf("cannot get direct channel: %w", err)
	}
	link := utils.MakeCardLink(pd.serverRoot, evt.Board.TeamID, evt.Board.ID, evt.Card.ID)

	post := &model.Post{
		UserId:    pd.botID,
		ChannelId: channel.Id,
		Message:   formatMessage(author.Username, extract, evt.Card.Title, link, evt.BlockChanged),
	}
	return user.Id, pd.api.CreatePost(post)
}
