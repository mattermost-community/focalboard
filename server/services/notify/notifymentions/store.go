// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
package notifymentions

import "github.com/mattermost/focalboard/server/model"

type Store interface {
	GetMemberForBoard(boardID, userID string) (*model.BoardMember, error)
	SaveMember(bm *model.BoardMember) (*model.BoardMember, error)
}
