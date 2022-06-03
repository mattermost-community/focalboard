// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package mmpermissions

import (
	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/services/permissions"

	mmModel "github.com/mattermost/mattermost-server/v6/model"
)

type APIInterface interface {
	HasPermissionToTeam(userID string, teamID string, permission *mmModel.Permission) bool
	LogError(string, ...interface{})
}

type Service struct {
	store permissions.Store
	api   APIInterface
}

func New(store permissions.Store, api APIInterface) *Service {
	return &Service{
		store: store,
		api:   api,
	}
}

func (s *Service) HasPermissionToTeam(userID, teamID string, permission *mmModel.Permission) bool {
	if userID == "" || teamID == "" || permission == nil {
		return false
	}
	return s.api.HasPermissionToTeam(userID, teamID, permission)
}

func (s *Service) HasPermissionToBoard(userID, boardID string, permission *mmModel.Permission) bool {
	if userID == "" || boardID == "" || permission == nil {
		return false
	}

	board, err := s.store.GetBoard(boardID)
	if model.IsErrNotFound(err) {
		var boards []*model.Board
		boards, err = s.store.GetBoardHistory(boardID, model.QueryBoardHistoryOptions{Limit: 1, Descending: true})
		if err != nil {
			return false
		}
		if len(boards) == 0 {
			return false
		}
		board = boards[0]
	} else if err != nil {
		s.api.LogError("error getting board",
			"boardID", boardID,
			"userID", userID,
			"error", err,
		)
		return false
	}

	// we need to check that the user has permission to see the team
	// regardless of its local permissions to the board
	if !s.HasPermissionToTeam(userID, board.TeamID, model.PermissionViewTeam) {
		return false
	}

	member, err := s.store.GetMemberForBoard(boardID, userID)
	if model.IsErrNotFound(err) {
		return false
	}
	if err != nil {
		s.api.LogError("error getting member for board",
			"boardID", boardID,
			"userID", userID,
			"error", err,
		)
		return false
	}

	switch member.MinimumRole {
	case "admin":
		member.SchemeAdmin = true
	case "editor":
		member.SchemeEditor = true
	case "commenter":
		member.SchemeCommenter = true
	case "viewer":
		member.SchemeViewer = true
	}

	switch permission {
	case model.PermissionManageBoardType, model.PermissionDeleteBoard, model.PermissionManageBoardRoles, model.PermissionShareBoard:
		return member.SchemeAdmin
	case model.PermissionManageBoardCards, model.PermissionManageBoardProperties:
		return member.SchemeAdmin || member.SchemeEditor
	case model.PermissionViewBoard:
		return member.SchemeAdmin || member.SchemeEditor || member.SchemeCommenter || member.SchemeViewer
	default:
		return false
	}
}
