package app

import "github.com/mattermost/focalboard/server/model"

func (a *App) GetTeamUsers(teamID string) ([]*model.User, error) {
	return a.store.GetUsersByTeam(teamID)
}

func (a *App) SearchTeamUsers(teamID string, searchQuery string) ([]*model.User, error) {
	return a.store.SearchUsersByTeam(teamID, searchQuery)
}
