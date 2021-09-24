// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package plugindelivery

import (
	"strings"

	mm_model "github.com/mattermost/mattermost-server/v6/model"
)

const (
	usernameSpecialChars = ".-_ "
)

func teamMemberFromUsername(api PluginAPI, username string, teamID string) (*mm_model.TeamMember, error) {
	// check for usernames that might have trailing punctuation
	var user *mm_model.User
	var err error
	ok := true
	trimmed := username
	for ok {
		user, err = api.GetUserByUsername(trimmed)
		if err != nil && !isErrNotFound(err) {
			return nil, err
		}

		if err == nil {
			break
		}

		trimmed, ok = trimUsernameSpecialChar(trimmed)
	}

	if user == nil {
		return nil, err
	}

	// make sure user is member of team.
	member, err := api.GetTeamMember(teamID, user.Id)
	if err != nil {
		return nil, err
	}

	return member, nil
}

// trimUsernameSpecialChar tries to remove the last character from word if it
// is a special character for usernames (dot, dash or underscore). If not, it
// returns the same string.
func trimUsernameSpecialChar(word string) (string, bool) {
	len := len(word)

	if len > 0 && strings.LastIndexAny(word, usernameSpecialChars) == (len-1) {
		return word[:len-1], true
	}

	return word, false
}

// isErrNotFound returns true if the error is a plugin.ErrNotFound. The pluginAPI converts
// AppError to the plugin.ErrNotFound var.
// TODO: add a `IsErrNotFound` method to the plugin API.
func isErrNotFound(err error) bool {
	return err != nil && err.Error() == "not found"
}
