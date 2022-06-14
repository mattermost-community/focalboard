package app

import (
	"github.com/mattermost/focalboard/server/model"
	mmModel "github.com/mattermost/mattermost-server/v6/model"
	"github.com/pkg/errors"
)

func (a *App) GetTeamBoardsInsights(userID string, teamID string, opts *mmModel.InsightsOpts) (*model.BoardInsightsList, error) {
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
	return a.store.GetTeamBoardsInsights(channelIDs, opts.StartUnixMilli, opts.Page*opts.PerPage, opts.PerPage)
}

func (a *App) GetUserBoardsInsights(userID string, teamID string, opts *mmModel.InsightsOpts) (*model.BoardInsightsList, error) {
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
	return a.store.GetUserBoardsInsights(userID, channelIDs, opts.StartUnixMilli, opts.Page*opts.PerPage, opts.PerPage)
}

func licenseAndGuestCheck(a *App, userID string) (bool, error) {
	licenseError := errors.New("invalid license/authorization to use insights API")
	guestError := errors.New("Guests aren't authorized to use insights API")
	lic := a.store.GetLicense()
	if lic == nil {
		a.logger.Debug("Deployment doesn't have a license")
		return false, licenseError
	}
	isGuest, err := a.store.IsUserGuest(userID)
	if err != nil {
		return false, err
	}
	if lic.SkuShortName != mmModel.LicenseShortSkuProfessional && lic.SkuShortName != mmModel.LicenseShortSkuEnterprise {
		return false, licenseError
	}
	if isGuest {
		return false, guestError
	}
	return true, nil
}
