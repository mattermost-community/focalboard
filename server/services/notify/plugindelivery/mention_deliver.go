// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package plugindelivery

import (
	"errors"
	"fmt"

	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/services/notify"
	"github.com/mattermost/focalboard/server/utils"

	mm_model "github.com/mattermost/mattermost-server/v6/model"
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

	if evt.ModifiedBy == nil {
		return "", fmt.Errorf("invalid user cannot mention: %w", ErrMentionPermission)
	}

	if evt.Board.Type == model.BoardTypeOpen {
		// public board rules:
		//    - admin, editor, commenter: can mention anyone on team
		//    - guest: can mention board members
		switch {
		case evt.ModifiedBy.SchemeAdmin, evt.ModifiedBy.SchemeEditor, evt.ModifiedBy.SchemeCommenter:
			if !pd.permissions.HasPermissionToTeam(user.Id, evt.TeamID, model.PermissionViewTeam) {
				return "", fmt.Errorf("%s cannot mention non-team member %s : %w", evt.ModifiedBy.UserID, user.Id, ErrMentionPermission)
			}
		case evt.ModifiedBy.SchemeViewer:
			// viewer should not have gotten this far since they cannot add text to a card
			return "", fmt.Errorf("%s (viewer) cannot mention user %s: %w", evt.ModifiedBy.UserID, user.Id, ErrMentionPermission)
		default:
			// this is a guest
			if !pd.permissions.HasPermissionToBoard(user.Id, evt.Board.ID, model.PermissionViewBoard) {
				return "", fmt.Errorf("%s cannot mention non-board member %s : %w", evt.ModifiedBy.UserID, user.Id, ErrMentionPermission)
			}
		}
	} else {
		// private board rules:
		//    - admin, editor, commenter, guest: can mention board members
		switch {
		case evt.ModifiedBy.SchemeViewer:
			// viewer should not have gotten this far since they cannot add text to a card
			return "", fmt.Errorf("%s (viewer) cannot mention user %s: %w", evt.ModifiedBy.UserID, user.Id, ErrMentionPermission)
		default:
			// everyone else can mention board members
			if !pd.permissions.HasPermissionToBoard(user.Id, evt.Board.ID, model.PermissionViewBoard) {
				return "", fmt.Errorf("%s cannot mention non-board member %s : %w", evt.ModifiedBy.UserID, user.Id, ErrMentionPermission)
			}
		}
	}

	author, err := pd.api.GetUserByID(evt.ModifiedBy.UserID)
	if err != nil {
		return "", fmt.Errorf("cannot find user: %w", err)
	}

	channel, err := pd.api.GetDirectChannel(user.Id, pd.botID)
	if err != nil {
		return "", fmt.Errorf("cannot get direct channel: %w", err)
	}
	link := utils.MakeCardLink(pd.serverRoot, evt.Board.TeamID, evt.Board.ID, evt.Card.ID)

	post := &mm_model.Post{
		UserId:    pd.botID,
		ChannelId: channel.Id,
		Message:   formatMessage(author.Username, extract, evt.Card.Title, link, evt.BlockChanged),
	}
	return user.Id, pd.api.CreatePost(post)
}
