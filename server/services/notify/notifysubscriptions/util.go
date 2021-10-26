package notifysubscriptions

import "github.com/mattermost/focalboard/server/model"

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
