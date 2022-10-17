package app

import (
	"github.com/mattermost/focalboard/server/model"
	mmModel "github.com/mattermost/mattermost-server/v6/model"
)

func (a *App) GetTeamUsers(teamID string, asGuestID string) ([]*model.User, error) {
	return a.store.GetUsersByTeam(teamID, asGuestID)
}

func (a *App) SearchTeamUsers(teamID string, searchQuery string, asGuestID string, excludeBots bool) ([]*model.User, error) {
	return a.store.SearchUsersByTeam(teamID, searchQuery, asGuestID, excludeBots)
}

func (a *App) UpdateUserConfig(userID string, patch model.UserPreferencesPatch) ([]mmModel.Preference, error) {
	updatedPreferences, err := a.store.PatchUserPreferences(userID, patch)
	if err != nil {
		return nil, err
	}

	return updatedPreferences, nil
}

func (a *App) GetUserPreferences(userID string) ([]mmModel.Preference, error) {
	return a.store.GetUserPreferences(userID)
}

func (a *App) UserIsGuest(userID string) (bool, error) {
	user, err := a.store.GetUserByID(userID)
	if err != nil {
		return false, err
	}
	return user.IsGuest, nil
}

func (a *App) CanSeeUser(seerUser string, seenUser string) (bool, error) {
	isGuest, err := a.UserIsGuest(seerUser)
	if err != nil {
		return false, err
	}
	if isGuest {
		hasSharedChannels, err := a.store.CanSeeUser(seerUser, seenUser)
		if err != nil {
			return false, err
		}
		return hasSharedChannels, nil
	}
	return true, nil
}

func (a *App) SearchUserChannels(teamID string, userID string, query string) ([]*mmModel.Channel, error) {
	return a.store.SearchUserChannels(teamID, userID, query)
}

func (a *App) GetChannel(teamID string, channelID string) (*mmModel.Channel, error) {
	return a.store.GetChannel(teamID, channelID)
}
