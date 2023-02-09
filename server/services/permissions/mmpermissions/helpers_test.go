// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package mmpermissions

import (
	"testing"

	"github.com/mattermost/focalboard/server/model"
	mmpermissionsMocks "github.com/mattermost/focalboard/server/services/permissions/mmpermissions/mocks"
	permissionsMocks "github.com/mattermost/focalboard/server/services/permissions/mocks"

	mmModel "github.com/mattermost/mattermost-server/v6/model"
	"github.com/mattermost/mattermost-server/v6/shared/mlog"

	"github.com/golang/mock/gomock"
	"github.com/stretchr/testify/assert"
)

type TestHelper struct {
	t           *testing.T
	ctrl        *gomock.Controller
	store       *permissionsMocks.MockStore
	api         *mmpermissionsMocks.MockAPI
	permissions *Service
}

func SetupTestHelper(t *testing.T) *TestHelper {
	ctrl := gomock.NewController(t)
	mockStore := permissionsMocks.NewMockStore(ctrl)
	mockAPI := mmpermissionsMocks.NewMockAPI(ctrl)

	return &TestHelper{
		t:           t,
		ctrl:        ctrl,
		store:       mockStore,
		api:         mockAPI,
		permissions: New(mockStore, mockAPI, mlog.CreateConsoleTestLogger(true, mlog.LvlError)),
	}
}

func (th *TestHelper) checkBoardPermissions(roleName string, member *model.BoardMember, teamID string,
	hasPermissionTo, hasNotPermissionTo []*mmModel.Permission) {
	for _, p := range hasPermissionTo {
		th.t.Run(roleName+" "+p.Id, func(t *testing.T) {
			th.store.EXPECT().
				GetBoard(member.BoardID).
				Return(&model.Board{ID: member.BoardID, TeamID: teamID}, nil).
				Times(1)

			th.api.EXPECT().
				HasPermissionToTeam(member.UserID, teamID, model.PermissionViewTeam).
				Return(true).
				Times(1)

			th.store.EXPECT().
				GetMemberForBoard(member.BoardID, member.UserID).
				Return(member, nil).
				Times(1)

			if !member.SchemeAdmin {
				th.api.EXPECT().
					HasPermissionToTeam(member.UserID, teamID, model.PermissionManageTeam).
					Return(roleName == "elevated-admin").
					Times(1)
			}

			hasPermission := th.permissions.HasPermissionToBoard(member.UserID, member.BoardID, p)
			assert.True(t, hasPermission)
		})
	}

	for _, p := range hasNotPermissionTo {
		th.t.Run(roleName+" "+p.Id, func(t *testing.T) {
			th.store.EXPECT().
				GetBoard(member.BoardID).
				Return(&model.Board{ID: member.BoardID, TeamID: teamID}, nil).
				Times(1)

			th.api.EXPECT().
				HasPermissionToTeam(member.UserID, teamID, model.PermissionViewTeam).
				Return(true).
				Times(1)

			th.store.EXPECT().
				GetMemberForBoard(member.BoardID, member.UserID).
				Return(member, nil).
				Times(1)

			if !member.SchemeAdmin {
				th.api.EXPECT().
					HasPermissionToTeam(member.UserID, teamID, model.PermissionManageTeam).
					Return(roleName == "elevated-admin").
					Times(1)
			}

			hasPermission := th.permissions.HasPermissionToBoard(member.UserID, member.BoardID, p)
			assert.False(t, hasPermission)
		})
	}
}

func (th *TestHelper) checkBoardMembers(roleName string) {
	const boardID = "board_id_1"
	const userID = "user_id_1"
	const teamID = "team_id_1"

	th.t.Run(roleName, func(t *testing.T) {

	t.Run("base case", func(t *testing.T) {
		th.Store.EXPECT().GetMembersForBoard(boardID).Return([]*model.BoardMember{
			{
				BoardID:      boardID,
				UserID:       userID,
				SchemeEditor: true,
			},
		}, nil).Times(1)
		th.Store.EXPECT().GetBoard(boardID).Return(nil, nil)

		members, err := th.App.GetMembersForBoard(boardID)
		assert.NoError(t, err)
		assert.NotNil(t, members)
		assert.False(t, members[0].SchemeAdmin)
	})

	t.Run("check team permission - false", func(t *testing.T) {
		board := &model.Board{
			ID:     boardID,
			TeamID: teamID,
		}

		th.Store.EXPECT().GetMembersForBoard(boardID).Return([]*model.BoardMember{
			{
				BoardID:      boardID,
				UserID:       userID,
				SchemeEditor: true,
			},
		}, nil).Times(1)
		th.Store.EXPECT().GetBoard(boardID).Return(board, nil)
		th.API.EXPECT().HasPermissionToTeam(userID, teamID, model.PermissionManageTeam).Return(false).Times(1)

		members, err := th.App.GetMembersForBoard(boardID)
		assert.NoError(t, err)
		assert.NotNil(t, members)

		assert.False(t, members[0].SchemeAdmin)
	})

	t.Run("check team permission - true", func(t *testing.T) {
		board := &model.Board{
			ID:     boardID,
			TeamID: teamID,
		}

		th.Store.EXPECT().GetMembersForBoard(boardID).Return([]*model.BoardMember{
			{
				BoardID:      boardID,
				UserID:       userID,
				SchemeEditor: true,
			},
		}, nil).Times(1)
		th.Store.EXPECT().GetBoard(boardID).Return(board, nil)
		th.API.EXPECT().HasPermissionToTeam(userID, teamID, model.PermissionManageTeam).Return(true).Times(1)

		members, err := th.App.GetMembersForBoard(boardID)
		assert.NoError(t, err)
		assert.NotNil(t, members)

		assert.True(t, members[0].SchemeAdmin)
	})
}

