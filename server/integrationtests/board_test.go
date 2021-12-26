package integrationtests

import (
	"testing"

	"github.com/mattermost/focalboard/server/client"
	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/utils"

	"github.com/stretchr/testify/require"
)

func TestGetBoards(t *testing.T) {
	t.Run("a non authenticated client should be rejected", func(t *testing.T) {
		th := SetupTestHelper(t).Start()
		defer th.TearDown()

		teamID := "0"
		newBoard := &model.Board{
			TeamID: teamID,
			Type:   model.BoardTypeOpen,
		}

		board, err := th.Server.App().CreateBoard(newBoard, "user-id", false)
		require.NoError(t, err)
		require.NotNil(t, board)

		boards, resp := th.Client.GetBoardsForTeam(teamID)
		th.CheckUnauthorized(resp)
		require.Nil(t, boards)
	})

	t.Run("should only return the boards that the user is a member of", func(t *testing.T) {
		th := SetupTestHelper(t).InitBasic()
		defer th.TearDown()

		teamID := "0"
		otherTeamID := "other-team-id"
		user1 := th.GetUser1()

		board1 := &model.Board{
			TeamID: teamID,
			Type:   model.BoardTypeOpen,
		}
		rBoard1, err := th.Server.App().CreateBoard(board1, user1.ID, true)
		require.NoError(t, err)
		require.NotNil(t, rBoard1)

		board2 := &model.Board{
			TeamID: teamID,
			Type:   model.BoardTypeOpen,
		}
		rBoard2, err := th.Server.App().CreateBoard(board2, user1.ID, false)
		require.NoError(t, err)
		require.NotNil(t, rBoard2)

		board3 := &model.Board{
			TeamID: teamID,
			Type:   model.BoardTypePrivate,
		}
		rBoard3, err := th.Server.App().CreateBoard(board3, user1.ID, true)
		require.NoError(t, err)
		require.NotNil(t, rBoard3)

		board4 := &model.Board{
			TeamID: teamID,
			Type:   model.BoardTypePrivate,
		}
		rBoard4, err := th.Server.App().CreateBoard(board4, user1.ID, false)
		require.NoError(t, err)
		require.NotNil(t, rBoard4)

		board5 := &model.Board{
			TeamID: otherTeamID,
			Type:   model.BoardTypeOpen,
		}
		rBoard5, err := th.Server.App().CreateBoard(board5, user1.ID, true)
		require.NoError(t, err)
		require.NotNil(t, rBoard5)

		boards, resp := th.Client.GetBoardsForTeam(teamID)
		th.CheckOK(resp)
		require.NotNil(t, boards)
		require.Len(t, boards, 2)

		boardIDs := []string{}
		for _, board := range boards {
			boardIDs = append(boardIDs, board.ID)
		}
		require.ElementsMatch(t, []string{rBoard1.ID, rBoard3.ID}, boardIDs)

		boardsFromOtherTeam, resp := th.Client.GetBoardsForTeam(otherTeamID)
		th.CheckOK(resp)
		require.NotNil(t, boardsFromOtherTeam)
		require.Len(t, boardsFromOtherTeam, 1)
		require.Equal(t, rBoard5.ID, boardsFromOtherTeam[0].ID)
	})
}

func TestCreateBoard(t *testing.T) {
	t.Run("a non authenticated user should be rejected", func(t *testing.T) {
		th := SetupTestHelper(t).Start()
		defer th.TearDown()

		newBoard := &model.Board{
			Title:  "board title",
			Type:   model.BoardTypeOpen,
			TeamID: "team-id",
		}
		board, resp := th.Client.CreateBoard(newBoard)
		th.CheckUnauthorized(resp)
		require.Nil(t, board)
	})

	t.Run("create public board", func(t *testing.T) {
		th := SetupTestHelper(t).InitBasic()
		defer th.TearDown()

		me := th.GetUser1()

		title := "board title"
		teamID := "team-id"
		newBoard := &model.Board{
			Title:  title,
			Type:   model.BoardTypeOpen,
			TeamID: teamID,
		}
		board, resp := th.Client.CreateBoard(newBoard)
		th.CheckOK(resp)
		require.NoError(t, resp.Error)
		require.NotNil(t, board)
		require.NotNil(t, board.ID)
		require.Equal(t, title, board.Title)
		require.Equal(t, model.BoardTypeOpen, board.Type)
		require.Equal(t, teamID, board.TeamID)
		require.Equal(t, me.ID, board.CreatedBy)
		require.Equal(t, me.ID, board.ModifiedBy)

		t.Run("creating a board should make the creator an admin", func(t *testing.T) {
			members, err := th.Server.App().GetMembersForBoard(board.ID)
			require.NoError(t, err)
			require.Len(t, members, 1)
			require.Equal(t, me.ID, members[0].UserID)
			require.Equal(t, board.ID, members[0].BoardID)
			require.True(t, members[0].SchemeAdmin)
		})
	})

	t.Run("create private board", func(t *testing.T) {
		th := SetupTestHelper(t).InitBasic()
		defer th.TearDown()

		me := th.GetUser1()

		title := "board title"
		teamID := "team-id"
		newBoard := &model.Board{
			Title:  title,
			Type:   model.BoardTypePrivate,
			TeamID: teamID,
		}
		board, resp := th.Client.CreateBoard(newBoard)
		th.CheckOK(resp)
		require.NotNil(t, board)
		require.NotNil(t, board.ID)
		require.Equal(t, title, board.Title)
		require.Equal(t, model.BoardTypePrivate, board.Type)
		require.Equal(t, teamID, board.TeamID)
		require.Equal(t, me.ID, board.CreatedBy)
		require.Equal(t, me.ID, board.ModifiedBy)

		t.Run("creating a board should make the creator an admin", func(t *testing.T) {
			members, err := th.Server.App().GetMembersForBoard(board.ID)
			require.NoError(t, err)
			require.Len(t, members, 1)
			require.Equal(t, me.ID, members[0].UserID)
			require.Equal(t, board.ID, members[0].BoardID)
			require.True(t, members[0].SchemeAdmin)
		})
	})

	t.Run("create invalid board", func(t *testing.T) {
		th := SetupTestHelper(t).InitBasic()
		defer th.TearDown()

		title := "board title"
		teamID := "team-id"
		user1 := th.GetUser1()

		t.Run("invalid board type", func(t *testing.T) {
			var invalidBoardType model.BoardType = "invalid"
			newBoard := &model.Board{
				Title:  title,
				TeamID: "team-id",
				Type:   invalidBoardType,
			}

			board, resp := th.Client.CreateBoard(newBoard)
			th.CheckBadRequest(resp)
			require.Nil(t, board)

			boards, err := th.Server.App().GetBoardsForUserAndTeam(user1.ID, teamID)
			require.NoError(t, err)
			require.Empty(t, boards)
		})

		t.Run("no type", func(t *testing.T) {
			newBoard := &model.Board{
				Title:  title,
				TeamID: teamID,
			}
			board, resp := th.Client.CreateBoard(newBoard)
			th.CheckBadRequest(resp)
			require.Nil(t, board)

			boards, err := th.Server.App().GetBoardsForUserAndTeam(user1.ID, teamID)
			require.NoError(t, err)
			require.Empty(t, boards)
		})

		t.Run("no team ID", func(t *testing.T) {
			newBoard := &model.Board{
				Title: title,
			}
			board, resp := th.Client.CreateBoard(newBoard)
			// the request is unauthorized because the permission
			// check fails on an empty teamID
			th.CheckForbidden(resp)
			require.Nil(t, board)

			boards, err := th.Server.App().GetBoardsForUserAndTeam(user1.ID, teamID)
			require.NoError(t, err)
			require.Empty(t, boards)
		})
	})
}

func TestSearchBoards(t *testing.T) {
	t.Run("a non authenticated user should be rejected", func(t *testing.T) {
		th := SetupTestHelper(t).Start()
		defer th.TearDown()

		boards, resp := th.Client.SearchBoardsForTeam("team-id", "term")
		th.CheckUnauthorized(resp)
		require.Nil(t, boards)
	})

	t.Run("all the matching private boards that the user is a member of and all matching public boards should be returned", func(t *testing.T) {
		th := SetupTestHelper(t).InitBasic()
		defer th.TearDown()

		teamID := "team-id"
		user1 := th.GetUser1()

		board1 := &model.Board{
			Title:  "public board where user1 is admin",
			Type:   model.BoardTypeOpen,
			TeamID: teamID,
		}
		rBoard1, err := th.Server.App().CreateBoard(board1, user1.ID, true)
		require.NoError(t, err)

		board2 := &model.Board{
			Title:  "public board where user1 is not member",
			Type:   model.BoardTypeOpen,
			TeamID: teamID,
		}
		rBoard2, err := th.Server.App().CreateBoard(board2, user1.ID, false)
		require.NoError(t, err)

		board3 := &model.Board{
			Title:  "private board where user1 is admin",
			Type:   model.BoardTypePrivate,
			TeamID: teamID,
		}
		rBoard3, err := th.Server.App().CreateBoard(board3, user1.ID, true)
		require.NoError(t, err)

		board4 := &model.Board{
			Title:  "private board where user1 is not member",
			Type:   model.BoardTypePrivate,
			TeamID: teamID,
		}
		_, err = th.Server.App().CreateBoard(board4, user1.ID, false)
		require.NoError(t, err)

		board5 := &model.Board{
			Title:  "public board where user1 is admin, but in other team",
			Type:   model.BoardTypePrivate,
			TeamID: "other-team-id",
		}
		_, err = th.Server.App().CreateBoard(board5, user1.ID, true)
		require.NoError(t, err)

		testCases := []struct {
			Name        string
			Client      *client.Client
			Term        string
			ExpectedIDs []string
		}{
			{
				Name:        "should return all boards where user1 is member or that are public",
				Client:      th.Client,
				Term:        "board",
				ExpectedIDs: []string{rBoard1.ID, rBoard2.ID, rBoard3.ID},
			},
			{
				Name:        "matching a full word",
				Client:      th.Client,
				Term:        "admin",
				ExpectedIDs: []string{rBoard1.ID, rBoard3.ID},
			},
			{
				Name:        "matching part of the word",
				Client:      th.Client,
				Term:        "ubli",
				ExpectedIDs: []string{rBoard1.ID, rBoard2.ID},
			},
			{
				Name:        "case insensitive",
				Client:      th.Client,
				Term:        "UBLI",
				ExpectedIDs: []string{rBoard1.ID, rBoard2.ID},
			},
			{
				Name:        "user2 can only see the public boards, as he's not a member of any",
				Client:      th.Client2,
				Term:        "board",
				ExpectedIDs: []string{rBoard1.ID, rBoard2.ID},
			},
		}

		for _, tc := range testCases {
			t.Run(tc.Name, func(t *testing.T) {
				boards, resp := tc.Client.SearchBoardsForTeam(teamID, tc.Term)
				th.CheckOK(resp)

				boardIDs := []string{}
				for _, board := range boards {
					boardIDs = append(boardIDs, board.ID)
				}

				require.ElementsMatch(t, tc.ExpectedIDs, boardIDs)
			})
		}
	})
}

func TestGetBoard(t *testing.T) {
	t.Run("a non authenticated user should be rejected", func(t *testing.T) {
		th := SetupTestHelper(t).Start()
		defer th.TearDown()

		board, resp := th.Client.GetBoard("boar-id", "")
		th.CheckUnauthorized(resp)
		require.Nil(t, board)
	})

	t.Run("valid read token should be enough to get the board", func(t *testing.T) {
		th := SetupTestHelper(t).InitBasic()
		defer th.TearDown()

		teamID := "team-id"
		sharingToken := utils.NewID(utils.IDTypeToken)

		board := &model.Board{
			Title:  "public board where user1 is admin",
			Type:   model.BoardTypeOpen,
			TeamID: teamID,
		}
		rBoard, err := th.Server.App().CreateBoard(board, th.GetUser1().ID, true)
		require.NoError(t, err)

		sharing := &model.Sharing{
			ID:       rBoard.ID,
			Enabled:  true,
			Token:    sharingToken,
			UpdateAt: 1,
		}

		success, resp := th.Client.PostSharing(sharing)
		th.CheckOK(resp)
		require.True(t, success)

		// the client logs out
		th.Logout(th.Client)

		// we make sure that the client cannot currently retrieve the
		// board with no session
		board, resp = th.Client.GetBoard(rBoard.ID, "")
		th.CheckUnauthorized(resp)
		require.Nil(t, board)

		// it should be able to retrieve it with the read token
		board, resp = th.Client.GetBoard(rBoard.ID, sharingToken)
		th.CheckOK(resp)
		require.NotNil(t, board)
	})

	t.Run("nonexisting board", func(t *testing.T) {
		th := SetupTestHelper(t).InitBasic()
		defer th.TearDown()

		board, resp := th.Client.GetBoard("nonexistent board", "")
		th.CheckNotFound(resp)
		require.Nil(t, board)
	})

	t.Run("a user that doesn't have permissions to a private board cannot retrieve it", func(t *testing.T) {
		th := SetupTestHelper(t).InitBasic()
		defer th.TearDown()

		teamID := "team-id"
		newBoard := &model.Board{
			Type:   model.BoardTypePrivate,
			TeamID: teamID,
		}
		board, err := th.Server.App().CreateBoard(newBoard, th.GetUser1().ID, false)
		require.NoError(t, err)

		rBoard, resp := th.Client.GetBoard(board.ID, "")
		th.CheckForbidden(resp)
		require.Nil(t, rBoard)
	})

	t.Run("a user that has permissions to a private board can retrieve it", func(t *testing.T) {
		th := SetupTestHelper(t).InitBasic()
		defer th.TearDown()

		teamID := "team-id"
		newBoard := &model.Board{
			Type:   model.BoardTypePrivate,
			TeamID: teamID,
		}
		board, err := th.Server.App().CreateBoard(newBoard, th.GetUser1().ID, true)
		require.NoError(t, err)

		rBoard, resp := th.Client.GetBoard(board.ID, "")
		th.CheckOK(resp)
		require.NotNil(t, rBoard)
	})

	t.Run("a user that doesn't have permissions to a public board but have them to its team can retrieve it", func(t *testing.T) {
		th := SetupTestHelper(t).InitBasic()
		defer th.TearDown()

		teamID := "team-id"
		newBoard := &model.Board{
			Title:  "title",
			Type:   model.BoardTypeOpen,
			TeamID: teamID,
		}
		board, err := th.Server.App().CreateBoard(newBoard, th.GetUser1().ID, false)
		require.NoError(t, err)

		rBoard, resp := th.Client.GetBoard(board.ID, "")
		th.CheckOK(resp)
		require.NotNil(t, rBoard)
	})
}

func TestPatchBoard(t *testing.T) {
	teamID := "team-id"

	t.Run("a non authenticated user should be rejected", func(t *testing.T) {
		th := SetupTestHelper(t).Start()
		defer th.TearDown()

		initialTitle := "title"
		newBoard := &model.Board{
			Title:  initialTitle,
			Type:   model.BoardTypeOpen,
			TeamID: teamID,
		}
		board, err := th.Server.App().CreateBoard(newBoard, "user-id", false)
		require.NoError(t, err)

		newTitle := "a new title"
		patch := &model.BoardPatch{Title: &newTitle}

		rBoard, resp := th.Client.PatchBoard(board.ID, patch)
		th.CheckUnauthorized(resp)
		require.Nil(t, rBoard)

		dbBoard, err := th.Server.App().GetBoard(board.ID)
		require.NoError(t, err)
		require.Equal(t, initialTitle, dbBoard.Title)
	})

	t.Run("non existing board", func(t *testing.T) {
		th := SetupTestHelper(t).InitBasic()
		defer th.TearDown()

		newTitle := "a new title"
		patch := &model.BoardPatch{Title: &newTitle}

		board, resp := th.Client.PatchBoard("non-existing-board", patch)
		th.CheckNotFound(resp)
		require.Nil(t, board)
	})

	t.Run("invalid patch on a board with permissions", func(t *testing.T) {
		th := SetupTestHelper(t).InitBasic()
		defer th.TearDown()

		user1 := th.GetUser1()

		newBoard := &model.Board{
			Title:  "title",
			Type:   model.BoardTypeOpen,
			TeamID: teamID,
		}
		board, err := th.Server.App().CreateBoard(newBoard, user1.ID, true)
		require.NoError(t, err)

		var invalidPatchType model.BoardType = "invalid"
		patch := &model.BoardPatch{Type: &invalidPatchType}

		rBoard, resp := th.Client.PatchBoard(board.ID, patch)
		th.CheckBadRequest(resp)
		require.Nil(t, rBoard)
	})

	t.Run("valid patch on a board with permissions", func(t *testing.T) {
		th := SetupTestHelper(t).InitBasic()
		defer th.TearDown()

		user1 := th.GetUser1()

		initialTitle := "title"
		newBoard := &model.Board{
			Title:  initialTitle,
			Type:   model.BoardTypeOpen,
			TeamID: teamID,
		}
		board, err := th.Server.App().CreateBoard(newBoard, user1.ID, true)
		require.NoError(t, err)

		newTitle := "a new title"
		patch := &model.BoardPatch{Title: &newTitle}

		rBoard, resp := th.Client.PatchBoard(board.ID, patch)
		th.CheckOK(resp)
		require.NotNil(t, rBoard)
		require.Equal(t, newTitle, rBoard.Title)
	})

	t.Run("valid patch on a board without permissions", func(t *testing.T) {
		th := SetupTestHelper(t).InitBasic()
		defer th.TearDown()

		user1 := th.GetUser1()

		initialTitle := "title"
		newBoard := &model.Board{
			Title:  initialTitle,
			Type:   model.BoardTypeOpen,
			TeamID: teamID,
		}
		board, err := th.Server.App().CreateBoard(newBoard, user1.ID, false)
		require.NoError(t, err)

		newTitle := "a new title"
		patch := &model.BoardPatch{Title: &newTitle}

		rBoard, resp := th.Client.PatchBoard(board.ID, patch)
		th.CheckForbidden(resp)
		require.Nil(t, rBoard)

		dbBoard, err := th.Server.App().GetBoard(board.ID)
		require.NoError(t, err)
		require.Equal(t, initialTitle, dbBoard.Title)
	})
}

// ToDo: implement remaining tests
func TestDeleteBoard(t *testing.T)        {}
func TestGetMembersForBoard(t *testing.T) {}
func TestAddMember(t *testing.T)          {}
func TestUpdateMember(t *testing.T)       {}
func TestRemoveMember(t *testing.T)       {}
