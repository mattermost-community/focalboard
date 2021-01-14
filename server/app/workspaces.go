package app

import (
	"database/sql"
	"log"

	"github.com/mattermost/mattermost-octo-tasks/server/model"
	"github.com/mattermost/mattermost-octo-tasks/server/utils"
)

func (a *App) GetRootWorkspace() (*model.Workspace, error) {
	workspaceID := "0"
	workspace, _ := a.store.GetWorkspace(workspaceID)
	if workspace == nil {
		workspace = &model.Workspace{
			ID:          workspaceID,
			SignupToken: utils.CreateGUID(),
		}
		err := a.store.UpsertWorkspaceSignupToken(*workspace)
		if err != nil {
			log.Fatal("Unable to initialize workspace", err)
			return nil, err
		}
		workspace, err = a.store.GetWorkspace(workspaceID)
		if err != nil {
			log.Fatal("Unable to get initialized workspace", err)
			return nil, err
		}

		log.Println("initialized workspace")
	}

	return workspace, nil
}

func (a *App) getWorkspace(ID string) (*model.Workspace, error) {
	workspace, err := a.store.GetWorkspace(ID)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return workspace, nil
}

func (a *App) UpsertWorkspaceSettings(workspace model.Workspace) error {
	return a.store.UpsertWorkspaceSettings(workspace)
}

func (a *App) UpsertWorkspaceSignupToken(workspace model.Workspace) error {
	return a.store.UpsertWorkspaceSignupToken(workspace)
}
