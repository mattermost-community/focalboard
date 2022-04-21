// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package notifysubscriptions

import (
	"time"

	"github.com/mattermost/focalboard/server/model"
)

type Store interface {
	GetBlock(blockID string) (*model.Block, error)
	GetBlockHistory(blockID string, opts model.QueryBlockHistoryOptions) ([]model.Block, error)
	GetSubTree2(boardID, blockID string, opts model.QuerySubtreeOptions) ([]model.Block, error)
	GetBoardAndCardByID(blockID string) (board *model.Board, card *model.Block, err error)

	GetUserByID(userID string) (*model.User, error)

	GetMemberForBoard(boardID, userID string) (*model.BoardMember, error)
	SaveMember(bm *model.BoardMember) (*model.BoardMember, error)

	CreateSubscription(sub *model.Subscription) (*model.Subscription, error)
	GetSubscribersForBlock(blockID string) ([]*model.Subscriber, error)
	GetSubscribersCountForBlock(blockID string) (int, error)
	UpdateSubscribersNotifiedAt(blockID string, notifyAt int64) error

	UpsertNotificationHint(hint *model.NotificationHint, notificationFreq time.Duration) (*model.NotificationHint, error)
	GetNextNotificationHint(remove bool) (*model.NotificationHint, error)
}
