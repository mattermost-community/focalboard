package app

import (
	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/services/store"
	"github.com/mattermost/focalboard/server/utils"
)

func (a *App) CreateSubscription(c store.Container, sub *model.Subscription) (*model.Subscription, error) {
	sub, err := a.store.CreateSubscription(c, sub)
	if err != nil {
		return nil, err
	}
	a.notifySubscriptionChanged(c, sub)

	return sub, nil
}

func (a *App) DeleteSubscription(c store.Container, blockID string, subscriberID string) (*model.Subscription, error) {
	sub, err := a.store.GetSubscription(c, blockID, subscriberID)
	if err != nil {
		return nil, err
	}
	if err := a.store.DeleteSubscription(c, blockID, subscriberID); err != nil {
		return nil, err
	}
	sub.DeleteAt = utils.GetMillis()
	a.notifySubscriptionChanged(c, sub)

	return sub, nil
}

func (a *App) GetSubscriptions(c store.Container, subscriberID string) ([]*model.Subscription, error) {
	return a.store.GetSubscriptions(c, subscriberID)
}

func (a *App) notifySubscriptionChanged(c store.Container, subscription *model.Subscription) {
	if a.notifications == nil {
		return
	}
	a.notifications.BroadcastSubscriptionChange(c.WorkspaceID, subscription)
}
