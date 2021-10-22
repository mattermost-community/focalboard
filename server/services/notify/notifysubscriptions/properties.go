// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package notifysubscriptions

import "github.com/mattermost/focalboard/server/model"

type propOption struct {
	id    string
	color string
	value string
}

// propDef represents a property definition as defined in a board's Fields member.
type propDef struct {
	id       string
	name     string
	propType string
	options  []propOption
}

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
