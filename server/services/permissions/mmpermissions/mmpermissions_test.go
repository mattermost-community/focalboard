//go:generate mockgen --build_flags=--mod=mod -destination=mocks/mockpluginapi.go -package mocks github.com/mattermost/mattermost-server/v6/plugin API
package mmpermissions

import (
	"database/sql"
	"testing"

	"github.com/mattermost/focalboard/server/model"

	mmModel "github.com/mattermost/mattermost-server/v6/model"

	"github.com/stretchr/testify/assert"
)

func TestHasPermissionsToTeam(t *testing.T) {
	th := SetupTestHelper(t)

	t.Run("empty input should always unauthorize", func(t *testing.T) {
		assert.False(t, th.permissions.HasPermissionToTeam("", "team-id", model.PermissionManageBoardCards))
		assert.False(t, th.permissions.HasPermissionToTeam("user-id", "", model.PermissionManageBoardCards))
		assert.False(t, th.permissions.HasPermissionToTeam("user-id", "team-id", nil))
	})

	t.Run("should authorize if the plugin API does", func(t *testing.T) {
		userID := "user-id"
		teamID := "team-id"

		th.api.EXPECT().
			HasPermissionToTeam(userID, teamID, model.PermissionViewTeam).
			Return(true).
			Times(1)

		hasPermission := th.permissions.HasPermissionToTeam(userID, teamID, model.PermissionViewTeam)
		assert.True(t, hasPermission)
	})

	t.Run("should not authorize if the plugin API doesn't", func(t *testing.T) {
		userID := "user-id"
		teamID := "team-id"

		th.api.EXPECT().
			HasPermissionToTeam(userID, teamID, model.PermissionViewTeam).
			Return(false).
			Times(1)

		hasPermission := th.permissions.HasPermissionToTeam(userID, teamID, model.PermissionViewTeam)
		assert.False(t, hasPermission)
	})
}

// test case for user removed
func TestHasPermissionToBoard(t *testing.T) {
	th := SetupTestHelper(t)

	t.Run("empty input should always unauthorize", func(t *testing.T) {
		assert.False(t, th.permissions.HasPermissionToBoard("", "board-id", model.PermissionManageBoardCards))
		assert.False(t, th.permissions.HasPermissionToBoard("user-id", "", model.PermissionManageBoardCards))
		assert.False(t, th.permissions.HasPermissionToBoard("user-id", "board-id", nil))
	})

	userID := "user-id"
	boardID := "board-id"
	teamID := "team-id"

	t.Run("nonexistent member", func(t *testing.T) {
		th.store.EXPECT().
			GetBoard(boardID).
			Return(&model.Board{ID: boardID, TeamID: teamID}, nil).
			Times(1)

		th.api.EXPECT().
			HasPermissionToTeam(userID, teamID, model.PermissionViewTeam).
			Return(true).
			Times(1)

		th.store.EXPECT().
			GetMemberForBoard(boardID, userID).
			Return(nil, sql.ErrNoRows).
			Times(1)

		hasPermission := th.permissions.HasPermissionToBoard(userID, boardID, model.PermissionManageBoardCards)
		assert.False(t, hasPermission)
	})

	t.Run("nonexistent board", func(t *testing.T) {
		th.store.EXPECT().
			GetBoard(boardID).
			Return(nil, sql.ErrNoRows).
			Times(1)

		hasPermission := th.permissions.HasPermissionToBoard(userID, boardID, model.PermissionManageBoardCards)
		assert.False(t, hasPermission)
	})

	t.Run("user that has been removed from the team", func(t *testing.T) {
		member := &model.BoardMember{
			UserID:      userID,
			BoardID:     boardID,
			SchemeAdmin: true,
		}

		th.store.EXPECT().
			GetBoard(boardID).
			Return(&model.Board{ID: boardID, TeamID: teamID}, nil).
			Times(1)

		th.api.EXPECT().
			HasPermissionToTeam(userID, teamID, model.PermissionViewTeam).
			Return(true).
			Times(1)

		th.store.EXPECT().
			GetMemberForBoard(member.BoardID, member.UserID).
			Return(member, nil).
			Times(1)

		hasPermission := th.permissions.HasPermissionToBoard(member.UserID, member.BoardID, model.PermissionViewBoard)
		assert.True(t, hasPermission)
	})

	t.Run("board admin", func(t *testing.T) {
		member := &model.BoardMember{
			UserID:      userID,
			BoardID:     boardID,
			SchemeAdmin: true,
		}

		hasPermissionTo := []*mmModel.Permission{
			model.PermissionManageBoardType,
			model.PermissionDeleteBoard,
			model.PermissionManageBoardRoles,
			model.PermissionShareBoard,
			model.PermissionManageBoardCards,
			model.PermissionViewBoard,
			model.PermissionManageBoardProperties,
		}

		hasNotPermissionTo := []*mmModel.Permission{}

		th.checkBoardPermissions("admin", member, teamID, hasPermissionTo, hasNotPermissionTo)
	})

	t.Run("board editor", func(t *testing.T) {
		member := &model.BoardMember{
			UserID:       userID,
			BoardID:      boardID,
			SchemeEditor: true,
		}

		hasPermissionTo := []*mmModel.Permission{
			model.PermissionManageBoardCards,
			model.PermissionViewBoard,
			model.PermissionManageBoardProperties,
		}

		hasNotPermissionTo := []*mmModel.Permission{
			model.PermissionManageBoardType,
			model.PermissionDeleteBoard,
			model.PermissionManageBoardRoles,
			model.PermissionShareBoard,
		}

		th.checkBoardPermissions("editor", member, teamID, hasPermissionTo, hasNotPermissionTo)
	})

	t.Run("board commenter", func(t *testing.T) {
		member := &model.BoardMember{
			UserID:          userID,
			BoardID:         boardID,
			SchemeCommenter: true,
		}

		hasPermissionTo := []*mmModel.Permission{
			model.PermissionViewBoard,
		}

		hasNotPermissionTo := []*mmModel.Permission{
			model.PermissionManageBoardType,
			model.PermissionDeleteBoard,
			model.PermissionManageBoardRoles,
			model.PermissionShareBoard,
			model.PermissionManageBoardCards,
			model.PermissionManageBoardProperties,
		}

		th.checkBoardPermissions("commenter", member, teamID, hasPermissionTo, hasNotPermissionTo)
	})

	t.Run("board viewer", func(t *testing.T) {
		member := &model.BoardMember{
			UserID:       userID,
			BoardID:      boardID,
			SchemeViewer: true,
		}

		hasPermissionTo := []*mmModel.Permission{
			model.PermissionViewBoard,
		}

		hasNotPermissionTo := []*mmModel.Permission{
			model.PermissionManageBoardType,
			model.PermissionDeleteBoard,
			model.PermissionManageBoardRoles,
			model.PermissionShareBoard,
			model.PermissionManageBoardCards,
			model.PermissionManageBoardProperties,
		}

		th.checkBoardPermissions("viewer", member, teamID, hasPermissionTo, hasNotPermissionTo)
	})
}
