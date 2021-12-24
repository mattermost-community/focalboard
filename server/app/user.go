package app

import "github.com/mattermost/focalboard/server/model"

func (a *App) GetTeamUsers(teamID string) ([]*model.User, error) {
	return a.store.GetUsersByTeam(teamID)
}
