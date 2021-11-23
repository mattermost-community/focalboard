// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package notifysubscriptions

import (
	"time"

	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/services/store"
)

type Store interface {
	GetBlock(c store.Container, blockID string) (*model.Block, error)
	GetBlockHistory(c store.Container, blockID string, opts model.QueryBlockHistoryOptions) ([]model.Block, error)
	GetSubTree2(c store.Container, blockID string, opts model.QuerySubtreeOptions) ([]model.Block, error)
	GetBoardAndCardByID(c store.Container, blockID string) (board *model.Block, card *model.Block, err error)

	GetUserByID(userID string) (*model.User, error)

	CreateSubscription(c store.Container, sub *model.Subscription) (*model.Subscription, error)
	GetSubscribersForBlock(c store.Container, blockID string) ([]*model.Subscriber, error)
	GetSubscribersCountForBlock(c store.Container, blockID string) (int, error)
	UpdateSubscribersNotifiedAt(c store.Container, blockID string, notifyAt int64) error

	UpsertNotificationHint(hint *model.NotificationHint, notificationFreq time.Duration) (*model.NotificationHint, error)
	GetNextNotificationHint(remove bool) (*model.NotificationHint, error)

	IsErrNotFound(err error) bool
}
