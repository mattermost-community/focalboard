// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package notifysubscriptions

import "github.com/mattermost/focalboard/server/model"

type Store interface {
	GetSubscribersForBlock(blockID string) ([]*model.Subscriber, error)
	GetSubscribersCountForBlock(blockID string) (int, error)
	UpsertNotificationHint(hint *model.NotificationHint) (*model.NotificationHint, error)
}
