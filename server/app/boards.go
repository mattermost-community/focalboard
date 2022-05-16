package app

import (
	"errors"
	"fmt"

	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/services/store"
)

var (
	ErrBoardMemberIsLastAdmin = errors.New("cannot leave a board with no admins")
	ErrNewBoardCannotHaveID   = errors.New("new board cannot have an ID")
	ErrInsufficientLicense    = errors.New("appropriate license required")
)

func (a *App) GetBoardMetadata(c store.Container, boardID string) (*model.Block, *model.BoardMetadata, error) {
	license := a.store.GetLicense()
	if license == nil || !(*license.Features.Compliance) {
		return nil, nil, ErrInsufficientLicense
	}

	board, err := a.GetBlockByID(c, boardID)
	if err != nil {
		return nil, nil, err
	}
	if board == nil {
		// Board may have been deleted, retrieve most recent history instead
		board, err = a.getBoardHistory(c, boardID, true)
		if err != nil {
			return nil, nil, err
		}
	}

	if board == nil {
		// Board not found
		return nil, nil, nil
	}

	earliestTime, _, err := a.getBoardDescendantModifiedInfo(c, boardID, false)
	if err != nil {
		return nil, nil, err
	}

	latestTime, lastModifiedBy, err := a.getBoardDescendantModifiedInfo(c, boardID, true)
	if err != nil {
		return nil, nil, err
	}

	boardMetadata := model.BoardMetadata{
		BoardID:                 boardID,
		DescendantFirstUpdateAt: earliestTime,
		DescendantLastUpdateAt:  latestTime,
		CreatedBy:               board.CreatedBy,
		LastModifiedBy:          lastModifiedBy,
	}
	return board, &boardMetadata, nil
}

func (a *App) getBoardHistory(c store.Container, boardID string, latest bool) (*model.Block, error) {
	opts := model.QueryBlockHistoryOptions{
		Limit:      1,
		Descending: latest,
	}
	boards, err := a.store.GetBlockHistory(c, boardID, opts)
	if err != nil {
		return nil, fmt.Errorf("could not get history for board: %w", err)
	}
	if len(boards) == 0 {
		return nil, nil
	}

	return &boards[0], nil
}

func (a *App) getBoardDescendantModifiedInfo(c store.Container, boardID string, latest bool) (int64, string, error) {
	board, err := a.getBoardHistory(c, boardID, latest)
	if err != nil {
		return 0, "", err
	}
	if board == nil {
		return 0, "", fmt.Errorf("history not found for board: %w", err)
	}

	var timestamp int64
	modifiedBy := board.ModifiedBy
	if latest {
		timestamp = board.UpdateAt
	} else {
		timestamp = board.CreateAt
	}

	// use block_history to fetch blocks in case they were deleted and no longer exist in blocks table.
	opts := model.QueryBlockHistoryOptions{
		Limit:      1,
		Descending: latest,
	}
	blocks, err := a.store.GetBlockHistoryDescendants(boardID, opts)
	if err != nil {
		return 0, "", fmt.Errorf("could not get blocks history descendants for board: %w", err)
	}
	if len(blocks) > 0 {
		// Compare the board history info with the descendant block info, if it exists
		block := &blocks[0]
		if latest && block.UpdateAt > timestamp {
			timestamp = block.UpdateAt
			modifiedBy = block.ModifiedBy
		} else if !latest && block.CreateAt < timestamp {
			timestamp = block.CreateAt
			modifiedBy = block.ModifiedBy
		}
	}
	return timestamp, modifiedBy, nil
}
