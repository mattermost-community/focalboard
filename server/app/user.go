package app

import (
	"github.com/mattermost/focalboard/server/model"
	mmModel "github.com/mattermost/mattermost-server/v6/model"
)

func (a *App) GetTeamUsers(teamID string) ([]*model.User, error) {
	return a.store.GetUsersByTeam(teamID)
}

func (a *App) SearchTeamUsers(teamID string, searchQuery string) ([]*model.User, error) {
	return a.store.SearchUsersByTeam(teamID, searchQuery)
}

func (a *App) UpdateUserConfig(userID string, patch model.UserPropPatch) ([]mmModel.Preference, error) {
	if err := a.store.PatchUserProps(userID, patch); err != nil {
		return nil, err
	}

	updatedPreferences, err := a.store.GetUserPreferences(userID)
	if err != nil {
		return nil, err
	}

	return updatedPreferences, nil
}

func (a *App) GetUserPreferences(userID string) ([]mmModel.Preference, error) {
	return a.store.GetUserPreferences(userID)
}

func (a *App) SearchUserChannels(teamID string, userID string, query string) ([]*mmModel.Channel, error) {
	return a.store.SearchUserChannels(teamID, userID, query)
}

func (a *App) GetChannel(teamID string, channelID string) (*mmModel.Channel, error) {
	return a.store.GetChannel(teamID, channelID)
}
