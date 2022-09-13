package app

import (
	"github.com/mattermost/focalboard/server/model"
)

func (a *App) GetSharing(boardID string) (*model.Sharing, error) {
	sharing, err := a.store.GetSharing(boardID)
	if err != nil {
		return nil, err
	}
	return sharing, nil
}

func (a *App) UpsertSharing(sharing model.Sharing) error {
	return a.store.UpsertSharing(sharing)
}
