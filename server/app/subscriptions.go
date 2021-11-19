package app

import (
	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/services/store"
)

func (a *App) CreateSubscription(c store.Container, sub *model.Subscription) (*model.Subscription, error) {
	return a.store.CreateSubscription(c, sub)
}

func (a *App) DeleteSubscription(c store.Container, blockID string, subscriberID string) error {
	return a.store.DeleteSubscription(c, blockID, subscriberID)
}

func (a *App) GetSubscriptions(c store.Container, subscriberID string) ([]*model.Subscription, error) {
	return a.store.GetSubscriptions(c, subscriberID)
}
