// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package notifysubscriptions

import (
	"strings"

	"github.com/mattermost/focalboard/server/model"
)

func getBoardDescription(board *model.Block) string {
	if board == nil {
		return ""
	}

	descr, ok := board.Fields["description"]
	if !ok {
		return ""
	}

	description, ok := descr.(string)
	if !ok {
		return ""
	}

	return description
}

func stripNewlines(s string) string {
	return strings.TrimSpace(strings.ReplaceAll(s, "\n", "¶ "))
}
