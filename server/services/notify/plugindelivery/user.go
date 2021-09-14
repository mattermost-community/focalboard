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

func userFromUsername(api PluginAPI, username string) (*mm_model.User, error) {
	user, err := api.GetUserByUsername(username)
	if err == nil {
		return user, nil
	}

	// only continue if the error is `ErrNotFound`
	if !isErrNotFound(err) {
		return nil, err
	}

	// check for usernames in substrings without trailing punctuation
	trimmed, ok := trimUsernameSpecialChar(username)
	for ; ok; trimmed, ok = trimUsernameSpecialChar(trimmed) {
		userFromTrimmed, err2 := api.GetUserByUsername(trimmed)
		if err2 != nil && !isErrNotFound(err2) {
			return nil, err2
		}

		if err2 == nil {
			return userFromTrimmed, nil
		}
	}
	return nil, err
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
