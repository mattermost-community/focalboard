// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package notifysubscriptions

import "github.com/mattermost/focalboard/server/model"

// SubscriptionDelivery provides an interface for delivering subscription notifications to other systems, such as
// channels server via plugin API.
type SubscriptionDelivery interface {
	SubscriptionDeliver(subscriberID string, subscriberType model.SubscriberType, markdown []string) error
}
