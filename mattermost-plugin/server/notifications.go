package main

import (
	"fmt"

	"github.com/mattermost/focalboard/server/services/notify"
	"github.com/mattermost/focalboard/server/services/notify/notifymentions"

	"github.com/mattermost/mattermost-server/v6/shared/mlog"
)

const (
	botUsername    = "boards"
	botDisplayname = "Boards"
	botDescription = "Created by Boards plugin."
)

func (p *Plugin) createMentionsBackend(delivery notifymentions.Delivery, logger *mlog.Logger) (*notify.Backend, error) {

	/*
		// create/get the bot
		botID, err := p.Helpers.EnsureBot(&model.Bot{
			Username:    "github",
			DisplayName: "GitHub",
			Description: "Created by the GitHub plugin.",
		})
		if err != nil {
			return nil, errors.Wrap(err, "failed to ensure github bot")
		}

		backend := notifymentions.New(delivery, logger)
	*/

	return nil, fmt.Errorf("not implemented yet")

}
