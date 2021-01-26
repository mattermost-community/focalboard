package app

import (
	"database/sql"

	"github.com/mattermost/focalboard/server/model"
)

func (a *App) GetSharing(rootID string) (*model.Sharing, error) {
	sharing, err := a.store.GetSharing(rootID)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return sharing, nil
}

func (a *App) UpsertSharing(sharing model.Sharing) error {
	return a.store.UpsertSharing(sharing)
}
