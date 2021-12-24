package app

import (
	"database/sql"
	"errors"
	"fmt"

	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/utils"
)

func (a *App) GetBoard(boardID string) (*model.Board, error) {
	board, err := a.store.GetBoard(boardID)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return board, nil
}

func (a *App) GetBoardsForUserAndTeam(userID, teamID string) ([]*model.Board, error) {
	return a.store.GetBoardsForUserAndTeam(userID, teamID)
}

func (a *App) CreateBoard(board *model.Board, userID string, addMember bool) (*model.Board, error) {
	if board.ID != "" {
		return nil, fmt.Errorf("new board cannot have an ID")
	}
	board.ID = utils.NewID(utils.IDTypeBoard)

	var newBoard *model.Board
	var member *model.BoardMember
	var err error
	if addMember {
		newBoard, member, err = a.store.InsertBoardWithAdmin(board, userID)
	} else {
		newBoard, err = a.store.InsertBoard(board, userID)
	}

	if err != nil {
		return nil, err
	}

	go func() {
		a.wsAdapter.BroadcastBoardChange(newBoard.TeamID, newBoard)

		if addMember {
			a.wsAdapter.BroadcastMemberChange(newBoard.TeamID, newBoard.ID, member)
		}
	}()

	return newBoard, nil
}

func (a *App) PatchBoard(patch *model.BoardPatch, boardID, userID string) (*model.Board, error) {
	updatedBoard, err := a.store.PatchBoard(boardID, patch, userID)
	if err != nil {
		return nil, err
	}

	go func() {
		a.wsAdapter.BroadcastBoardChange(updatedBoard.TeamID, updatedBoard)
	}()

	return updatedBoard, nil
}

func (a *App) DeleteBoard(boardID, userID string) error {
	board, err := a.store.GetBoard(boardID)
	if errors.Is(err, sql.ErrNoRows) {
		return nil
	}
	if err != nil {
		return err
	}

	if err := a.store.DeleteBoard(boardID, userID); err != nil {
		return err
	}

	go func() {
		a.wsAdapter.BroadcastBoardDelete(board.TeamID, boardID)
	}()

	return nil
}

func (a *App) GetMembersForBoard(boardID string) ([]*model.BoardMember, error) {
	return a.store.GetMembersForBoard(boardID)
}

func (a *App) AddMemberToBoard(member *model.BoardMember) (*model.BoardMember, error) {
	board, err := a.store.GetBoard(member.BoardID)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	existingMembership, err := a.store.GetMemberForBoard(member.BoardID, member.UserID)
	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		return nil, err
	}

	if existingMembership != nil {
		return existingMembership, nil
	}

	newMember, err := a.store.SaveMember(member)
	if err != nil {
		return nil, err
	}

	go func() {
		a.wsAdapter.BroadcastMemberChange(board.TeamID, member.BoardID, member)
	}()

	return newMember, nil
}

func (a *App) UpdateBoardMember(member *model.BoardMember) (*model.BoardMember, error) {
	board, bErr := a.store.GetBoard(member.BoardID)
	if errors.Is(bErr, sql.ErrNoRows) {
		return nil, nil
	}
	if bErr != nil {
		return nil, bErr
	}

	_, err := a.store.GetMemberForBoard(member.BoardID, member.UserID)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	newMember, err := a.store.SaveMember(member)
	if err != nil {
		return nil, err
	}

	go func() {
		a.wsAdapter.BroadcastMemberChange(board.TeamID, member.BoardID, member)
	}()

	return newMember, nil
}

func (a *App) DeleteBoardMember(boardID, userID string) error {
	board, bErr := a.store.GetBoard(boardID)
	if errors.Is(bErr, sql.ErrNoRows) {
		return nil
	}
	if bErr != nil {
		return bErr
	}

	_, err := a.store.GetMemberForBoard(boardID, userID)
	if errors.Is(err, sql.ErrNoRows) {
		return nil
	}
	if err != nil {
		return err
	}

	if err := a.store.DeleteMember(boardID, userID); err != nil {
		return err
	}

	go func() {
		a.wsAdapter.BroadcastMemberDelete(board.TeamID, boardID, userID)
	}()

	return nil
}

func (a *App) SearchBoardsForUserAndTeam(term, userID, teamID string) ([]*model.Board, error) {
	return a.store.SearchBoardsForUserAndTeam(term, userID, teamID)
}
