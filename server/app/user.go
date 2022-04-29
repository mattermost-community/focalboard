package app

import "github.com/mattermost/focalboard/server/model"

func (a *App) GetTeamUsers(teamID string) ([]*model.User, error) {
	return a.store.GetUsersByTeam(teamID)
}

func (a *App) SearchTeamUsers(teamID string, searchQuery string) ([]*model.User, error) {
	return a.store.SearchUsersByTeam(teamID, searchQuery)
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

func (a *App) GetUserBoardsInsights(userID string, duration string) ([]*model.BoardInsight, error) {
	return a.store.GetUserBoardsInsights(userID, duration)
}
