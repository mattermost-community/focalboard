package app

import (
	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/services/notify"
)

func (a *App) CreateBoardsAndBlocks(bab *model.BoardsAndBlocks, userID string, addMember bool) (*model.BoardsAndBlocks, error) {
	var newBab *model.BoardsAndBlocks
	var members []*model.BoardMember
	var err error

	if addMember {
		newBab, members, err = a.store.CreateBoardsAndBlocksWithAdmin(bab, userID)
	} else {
		newBab, err = a.store.CreateBoardsAndBlocks(bab, userID)
	}

	if err != nil {
		return nil, err
	}

	// all new boards should belong to the same team
	teamID := newBab.Boards[0].TeamID

	go func() {
		for _, board := range newBab.Boards {
			a.wsAdapter.BroadcastBoardChange(teamID, board)
		}

		for _, block := range newBab.Blocks {
			a.wsAdapter.BroadcastBlockChange(teamID, block)
			a.metrics.IncrementBlocksInserted(1)
			a.webhook.NotifyUpdate(block)
			a.notifyBlockChanged(notify.Add, &block, nil, userID)
		}

		if addMember {
			for _, member := range members {
				a.wsAdapter.BroadcastMemberChange(teamID, member.BoardID, member)
			}
		}
	}()

	return newBab, nil
}
