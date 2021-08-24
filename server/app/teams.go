package app

import (
	"database/sql"
	"errors"

	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/services/mlog"
	"github.com/mattermost/focalboard/server/utils"
)

func (a *App) GetRootTeam() (*model.Team, error) {
	teamID := "0"
	team, _ := a.store.GetTeam(teamID)
	if team == nil {
		team = &model.Team{
			ID:          teamID,
			SignupToken: utils.CreateGUID(),
		}
		err := a.store.UpsertTeamSignupToken(*team)
		if err != nil {
			a.logger.Fatal("Unable to initialize team", mlog.Err(err))
			return nil, err
		}
		team, err = a.store.GetTeam(teamID)
		if err != nil {
			a.logger.Fatal("Unable to get initialized team", mlog.Err(err))
			return nil, err
		}

		a.logger.Info("initialized team")
	}

	return team, nil
}

func (a *App) GetTeam(id string) (*model.Team, error) {
	team, err := a.store.GetTeam(id)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return team, nil
}

func (a *App) DoesUserHaveTeamAccess(userID string, teamID string) bool {
	return a.auth.DoesUserHaveTeamAccess(userID, teamID)
}

func (a *App) UpsertTeamSettings(team model.Team) error {
	return a.store.UpsertTeamSettings(team)
}

func (a *App) UpsertTeamSignupToken(team model.Team) error {
	return a.store.UpsertTeamSignupToken(team)
}

func (a *App) GetTeamCount() (int64, error) {
	return a.store.GetTeamCount()
}
