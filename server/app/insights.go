package app

import (
	"fmt"

	"github.com/mattermost/focalboard/server/model"
	mmModel "github.com/mattermost/mattermost-server/v6/model"
	"github.com/pkg/errors"
)

func (a *App) GetTeamBoardsInsights(userID string, teamID string, duration string) ([]*model.BoardInsight, error) {
	// check if server is properly licensed, and user is not a guest
	licenseAndGuestCheckFlag, err := licenseAndGuestCheck(a, userID)
	if !licenseAndGuestCheckFlag {
		return nil, err
	}
	channels, err := a.store.GetUserWorkspacesInTeam(userID, teamID)
	if err != nil {
		return nil, err
	}

	channelIDs := make([]string, len(channels))
	for index, channel := range channels {
		channelIDs[index] = channel.ID
	}
	return a.store.GetTeamBoardsInsights(duration, channelIDs)
}

func (a *App) GetUserBoardsInsights(userID string, teamID string, duration string) ([]*model.BoardInsight, error) {
	// check if server is properly licensed, and user is not a guest
	licenseAndGuestCheckFlag, err := licenseAndGuestCheck(a, userID)
	if !licenseAndGuestCheckFlag {
		return nil, err
	}
	channels, err := a.store.GetUserWorkspacesInTeam(userID, teamID)
	if err != nil {
		return nil, err
	}

	channelIDs := make([]string, len(channels))
	for index, channel := range channels {
		channelIDs[index] = channel.ID
	}
	return a.store.GetUserBoardsInsights(userID, duration, channelIDs)
}

func licenseAndGuestCheck(a *App, userID string) (bool, error) {
	licenseError := errors.New("invalid license/authorization to use insights API")
	lic := a.store.GetLicense()
	if lic == nil {
		fmt.Println("license is nil")
		return false, licenseError
	}
	isGuest, err := a.store.IsUserGuest(userID)
	if err != nil {
		return false, err
	}
	fmt.Println(isGuest, lic.SkuShortName)
	if (lic.SkuShortName != mmModel.LicenseShortSkuProfessional && lic.SkuShortName != mmModel.LicenseShortSkuEnterprise) || isGuest {
		return false, licenseError
	}
	return true, nil
}
