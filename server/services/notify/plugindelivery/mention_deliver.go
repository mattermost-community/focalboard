// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package plugindelivery

import (
	"fmt"

	"github.com/mattermost/focalboard/server/services/notify"
	"github.com/mattermost/focalboard/server/utils"

	"github.com/mattermost/mattermost-server/v6/model"
)

// MentionDeliver notifies a user they have been mentioned in a block.
func (pd *PluginDelivery) MentionDeliver(mentionUsername string, extract string, evt notify.BlockChangeEvent) (string, error) {
	// determine which team the workspace is associated with
	teamID, err := pd.getTeamID(evt)
	if err != nil {
		return "", fmt.Errorf("cannot determine teamID for block change notification: %w", err)
	}

	member, err := teamMemberFromUsername(pd.api, mentionUsername, teamID)
	if err != nil {
		if isErrNotFound(err) {
			// not really an error; could just be someone typed "@sometext"
			return "", nil
		} else {
			return "", fmt.Errorf("cannot lookup mentioned user: %w", err)
		}
	}

	// check that user is a member of the channel
	_, err = pd.api.GetChannelMember(evt.Workspace, member.UserId)
	if err != nil {
		if pd.api.IsErrNotFound(err) {
			// mentioned user is not a member of the channel; fail silently.
			return "", nil
		}
		return "", fmt.Errorf("cannot fetch channel member for user %s: %w", member.UserId, err)
	}

	author, err := pd.api.GetUserByID(evt.ModifiedByID)
	if err != nil {
		return "", fmt.Errorf("cannot find user: %w", err)
	}

	channel, err := pd.api.GetDirectChannel(member.UserId, pd.botID)
	if err != nil {
		return "", fmt.Errorf("cannot get direct channel: %w", err)
	}
	link := utils.MakeCardLink(pd.serverRoot, evt.Workspace, evt.Board.ID, evt.Card.ID)

	post := &model.Post{
		UserId:    pd.botID,
		ChannelId: channel.Id,
		Message:   formatMessage(author.Username, extract, evt.Card.Title, link, evt.BlockChanged),
	}
	return member.UserId, pd.api.CreatePost(post)
}
