package app

import (
	"github.com/mattermost/focalboard/server/model"
	"strconv"
)

func (a *App) GetClientConfig() *model.ClientConfig {
	return &model.ClientConfig{
		Telemetry:                a.config.Telemetry,
		TelemetryID:              a.config.TelemetryID,
		EnablePublicSharedBoards: a.config.EnablePublicSharedBoards,
		FeatureFlags:             a.config.FeatureFlags,
		ClientLicense:            a.getClientLicense(),
	}
}

func (a *App) getClientLicense() map[string]string {
	clientLicense := map[string]string{}
	license := a.store.GetLicense()

	if license != nil {
		clientLicense["IsLicensed"] = "true"
		clientLicense["IsTrial"] = strconv.FormatBool(license.IsTrial)
		clientLicense["SkuName"] = license.SkuName
		clientLicense["SkuShortName"] = license.SkuShortName

		if license.Features != nil && license.Features.Cloud != nil {
			clientLicense["Cloud"] = strconv.FormatBool(*license.Features.Cloud)
		} else {
			clientLicense["Cloud"] = "false"
		}

	}

	return clientLicense
}
