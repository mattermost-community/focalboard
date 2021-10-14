// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package notifysubscriptions

import (
	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/services/store"
)

type Store interface {
	GetBlock(c store.Container, blockID string) (*model.Block, error)
	GetBlockHistory(c store.Container, blockID string, opts model.BlockQueryOptions) ([]model.Block, error)
	GetSubTree2FromHistory(c store.Container, blockID string, opts model.BlockQueryOptions) ([]model.Block, error)
	GetBoardAndCard(c store.Container, block *model.Block) (board *model.Block, card *model.Block, err error)

	GetSubscribersForBlock(c store.Container, blockID string) ([]*model.Subscriber, error)
	GetSubscribersCountForBlock(c store.Container, blockID string) (int, error)
	UpsertNotificationHint(hint *model.NotificationHint) (*model.NotificationHint, error)
	GetNextNotificationHint(remove bool) (*model.NotificationHint, error)

	IsErrNotFound(err error) bool
}
