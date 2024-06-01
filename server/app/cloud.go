// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package app

import (
	"github.com/mattermost/mattermost/server/public/shared/mlog"

	mmModel "github.com/mattermost/mattermost/server/public/model"
)

func (a *App) GetUsedCardsCount() (int, error) {
	return a.store.GetUsedCardsCount()
}

// SetCloudLimits sets the limits of the server.
func (a *App) SetCloudLimits(limits *mmModel.ProductLimits) error {
	oldCardLimit := a.CardLimit()

	// if the limit object doesn't come complete, we assume limits are
	// being disabled
	cardLimit := 0

	if oldCardLimit != cardLimit {
		a.logger.Info(
			"setting new cloud limits",
			mlog.Int("oldCardLimit", oldCardLimit),
			mlog.Int("cardLimit", cardLimit),
		)
		a.SetCardLimit(cardLimit)
		return a.doUpdateCardLimitTimestamp()
	}

	a.logger.Info(
		"setting new cloud limits, equivalent to the existing ones",
		mlog.Int("cardLimit", cardLimit),
	)
	return nil
}

// doUpdateCardLimitTimestamp performs the update without running any
// checks.
func (a *App) doUpdateCardLimitTimestamp() error {
	cardLimitTimestamp, err := a.store.UpdateCardLimitTimestamp(a.CardLimit())
	if err != nil {
		return err
	}

	a.wsAdapter.BroadcastCardLimitTimestampChange(cardLimitTimestamp)

	return nil
}
