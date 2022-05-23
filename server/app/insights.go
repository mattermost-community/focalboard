package app

import (
	"github.com/mattermost/focalboard/server/model"
)

func (a *App) GetTeamBoardsInsights(userID string, teamID string, duration string) ([]*model.BoardInsight, error) {
	channels, err := a.store.GetUserWorkspacesInTeam(userID, teamID)
	if err != nil {
		return nil, err
	}

	channelIDs := make([]string, len(channels))
	for index, channel := range channels {
		channelIDs[index] = channel.ID
	}
	return a.store.GetTeamBoardsInsights(duration, channelIDs)
}

func (a *App) GetUserBoardsInsights(userID string, teamID string, duration string) ([]*model.BoardInsight, error) {
	channels, err := a.store.GetUserWorkspacesInTeam(userID, teamID)
	if err != nil {
		return nil, err
	}

	channelIDs := make([]string, len(channels))
	for index, channel := range channels {
		channelIDs[index] = channel.ID
	}
	return a.store.GetUserBoardsInsights(userID, duration, channelIDs)
}
