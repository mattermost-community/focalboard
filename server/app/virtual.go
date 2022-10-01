package app

import (
	"github.com/mattermost/focalboard/server/model"
)

func (a *App) GetVirtualLinksForDriver(driverName, userID, teamID string) ([]*model.VirtualLink, error) {
	return a.store.GetVirtualLinksForDriver(driverName, userID, teamID)
}
