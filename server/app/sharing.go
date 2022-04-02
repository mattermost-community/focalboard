package app

import (
	"database/sql"
	"errors"

	"github.com/mattermost/focalboard/server/model"
)

func (a *App) GetSharing(boardID string) (*model.Sharing, error) {
	sharing, err := a.store.GetSharing(boardID)
	if errors.Is(err, sql.ErrNoRows) {
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
