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
	return a.store.GetTeamBoardsInsights(teamID, userID, opts.StartUnixMilli, opts.Page*opts.PerPage, opts.PerPage)
}

func (a *App) GetUserBoardsInsights(userID string, teamID string, opts *mmModel.InsightsOpts) (*model.BoardInsightsList, error) {
	// check if server is properly licensed, and user is not a guest
	licenseAndGuestCheckFlag, err := licenseAndGuestCheck(a, userID)
	if !licenseAndGuestCheckFlag {
		return nil, err
	}
	return a.store.GetUserBoardsInsights(teamID, userID, opts.StartUnixMilli, opts.Page*opts.PerPage, opts.PerPage)
}

func licenseAndGuestCheck(a *App, userID string) (bool, error) {
	licenseError := errors.New("invalid license/authorization to use insights API")
	guestError := errors.New("Guests aren't authorized to use insights API")
	lic := a.store.GetLicense()
	if lic == nil {
		a.logger.Debug("Deployment doesn't have a license")
		return false, licenseError
	}
	user, err := a.store.GetUserByID(userID)
	if err != nil {
		return false, err
	}
	if lic.SkuShortName != mmModel.LicenseShortSkuProfessional && lic.SkuShortName != mmModel.LicenseShortSkuEnterprise {
		return false, licenseError
	}
	if user.IsGuest {
		return false, guestError
	}
	return true, nil
}

func (a *App) GetUserTimezone(userID string) (string, error) {
	return a.store.GetUserTimezone(userID)
}
