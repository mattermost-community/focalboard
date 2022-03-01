package app

import "github.com/mattermost/focalboard/server/model"

func (a *App) GetWorkspaceUsers(workspaceID string) ([]*model.User, error) {
	return a.store.GetUsersByWorkspace(workspaceID)
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
