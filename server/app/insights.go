package app

import "github.com/mattermost/focalboard/server/model"

func (a *App) GetTeamBoardsInsights(teamID string, duration string) ([]*model.BoardInsight, error) {
	return a.store.GetTeamBoardsInsights(teamID, duration)
}

func (a *App) GetUserBoardsInsights(userID string, teamID string, duration string) ([]*model.BoardInsight, error) {
	return a.store.GetUserBoardsInsights(userID, teamID, duration)
}
