// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package app

func (a *App) GetUsedCardsCount() (int, error) {
	return a.store.GetUsedCardsCount()
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
