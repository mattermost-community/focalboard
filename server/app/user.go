package app

import (
	"github.com/mattermost/focalboard/server/model"
	mmModel "github.com/mattermost/mattermost-server/v6/model"
)

func (a *App) GetTeamUsers(teamID string, asGuestID string) ([]*model.User, error) {
	return a.store.GetUsersByTeam(teamID, asGuestID)
}

func (a *App) SearchTeamUsers(teamID string, searchQuery string, asGuestID string) ([]*model.User, error) {
	return a.store.SearchUsersByTeam(teamID, searchQuery, asGuestID)
}

func (a *App) UpdateUserConfig(userID string, patch model.UserPropPatch) (map[string]interface{}, error) {
	if err := a.store.PatchUserProps(userID, patch); err != nil {
		return nil, err
	}

	user, err := a.store.GetUserByID(userID)
	if err != nil {
		return nil, err
	}

	return user.Props, nil
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
