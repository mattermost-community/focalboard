package storetests

import (
	"database/sql"
	"testing"
	"time"

	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/services/store"
	"github.com/mattermost/focalboard/server/utils"

	"github.com/stretchr/testify/require"
)

//nolint:dupl
func StoreTestBoardStore(t *testing.T, setup func(t *testing.T) (store.Store, func())) {
	t.Run("GetBoard", func(t *testing.T) {
		store, tearDown := setup(t)
		defer tearDown()
		testGetBoard(t, store)
	})
	t.Run("GetBoardsForUserAndTeam", func(t *testing.T) {
		store, tearDown := setup(t)
		defer tearDown()
		testGetBoardsForUserAndTeam(t, store)
	})
	t.Run("InsertBoard", func(t *testing.T) {
		store, tearDown := setup(t)
		defer tearDown()
		testInsertBoard(t, store)
	})
	t.Run("PatchBoard", func(t *testing.T) {
		store, tearDown := setup(t)
		defer tearDown()
		testPatchBoard(t, store)
	})
	t.Run("DeleteBoard", func(t *testing.T) {
		store, tearDown := setup(t)
		defer tearDown()
		testDeleteBoard(t, store)
	})
	t.Run("InsertBoardWithAdmin", func(t *testing.T) {
		store, tearDown := setup(t)
		defer tearDown()
		testInsertBoardWithAdmin(t, store)
	})
	t.Run("SaveMember", func(t *testing.T) {
		store, tearDown := setup(t)
		defer tearDown()
		testSaveMember(t, store)
	})
	t.Run("GetMemberForBoard", func(t *testing.T) {
		store, tearDown := setup(t)
		defer tearDown()
		testGetMemberForBoard(t, store)
	})
	t.Run("GetMembersForBoard", func(t *testing.T) {
		store, tearDown := setup(t)
		defer tearDown()
		testGetMembersForBoard(t, store)
	})
	t.Run("DeleteMember", func(t *testing.T) {
		store, tearDown := setup(t)
		defer tearDown()
		testDeleteMember(t, store)
	})
	t.Run("SearchBoardsForUserAndTeam", func(t *testing.T) {
		store, tearDown := setup(t)
		defer tearDown()
		testSearchBoardsForUserAndTeam(t, store)
	})
}

func testGetBoard(t *testing.T, store store.Store) {
	userID := testUserID

	t.Run("existing board", func(t *testing.T) {
		board := &model.Board{
			ID:     "id-1",
			TeamID: testTeamID,
			Type:   model.BoardTypeOpen,
		}

		_, err := store.InsertBoard(board, userID)
		require.NoError(t, err)

		rBoard, err := store.GetBoard(board.ID)
		require.NoError(t, err)
		require.Equal(t, board.ID, rBoard.ID)
		require.Equal(t, board.TeamID, rBoard.TeamID)
		require.Equal(t, userID, rBoard.CreatedBy)
		require.Equal(t, userID, rBoard.ModifiedBy)
		require.Equal(t, board.Type, rBoard.Type)
		require.NotZero(t, rBoard.CreateAt)
		require.NotZero(t, rBoard.UpdateAt)
	})

	t.Run("nonexisting board", func(t *testing.T) {
		rBoard, err := store.GetBoard("nonexistent-id")
		require.ErrorIs(t, err, sql.ErrNoRows)
		require.Nil(t, rBoard)
	})
}

func testGetBoardsForUserAndTeam(t *testing.T, store store.Store) {
	userID := "user-id-1"

	t.Run("should return only the boards of the team that the user is a member of", func(t *testing.T) {
		teamID1 := "team-id-1"
		teamID2 := "team-id-2"

		// team 1 boards
		board1 := &model.Board{
			ID:     "board-id-1",
			TeamID: teamID1,
			Type:   model.BoardTypeOpen,
		}
		_, _, err := store.InsertBoardWithAdmin(board1, userID)
		require.NoError(t, err)

		board2 := &model.Board{
			ID:     "board-id-2",
			TeamID: teamID1,
			Type:   model.BoardTypePrivate,
		}
		_, _, err = store.InsertBoardWithAdmin(board2, userID)
		require.NoError(t, err)

		board3 := &model.Board{
			ID:     "board-id-3",
			TeamID: teamID1,
			Type:   model.BoardTypeOpen,
		}
		_, err = store.InsertBoard(board3, "other-user")
		require.NoError(t, err)

		board4 := &model.Board{
			ID:     "board-id-4",
			TeamID: teamID1,
			Type:   model.BoardTypePrivate,
		}
		_, err = store.InsertBoard(board4, "other-user")
		require.NoError(t, err)

		// team 2 boards
		board5 := &model.Board{
			ID:     "board-id-5",
			TeamID: teamID2,
			Type:   model.BoardTypeOpen,
		}
		_, _, err = store.InsertBoardWithAdmin(board5, userID)
		require.NoError(t, err)

		board6 := &model.Board{
			ID:     "board-id-6",
			TeamID: teamID1,
			Type:   model.BoardTypePrivate,
		}
		_, err = store.InsertBoard(board6, "other-user")
		require.NoError(t, err)

		t.Run("should only find the two boards that the user is a member of for team 1", func(t *testing.T) {
			boards, err := store.GetBoardsForUserAndTeam(userID, teamID1)
			require.NoError(t, err)
			require.Len(t, boards, 2)

			boardIDs := []string{}
			for _, board := range boards {
				boardIDs = append(boardIDs, board.ID)
			}
			require.ElementsMatch(t, []string{board1.ID, board2.ID}, boardIDs)
		})

		t.Run("should only find the board that the user is a member of for team 2", func(t *testing.T) {
			boards, err := store.GetBoardsForUserAndTeam(userID, teamID2)
			require.NoError(t, err)
			require.Len(t, boards, 1)
			require.Equal(t, board5.ID, boards[0].ID)
		})
	})
}

func testInsertBoard(t *testing.T, store store.Store) {
	userID := testUserID

	t.Run("valid public board", func(t *testing.T) {
		board := &model.Board{
			ID:     "id-test-public",
			TeamID: testTeamID,
			Type:   model.BoardTypeOpen,
		}

		newBoard, err := store.InsertBoard(board, userID)
		require.NoError(t, err)
		require.Equal(t, board.ID, newBoard.ID)
		require.Equal(t, newBoard.Type, model.BoardTypeOpen)
		require.NotZero(t, newBoard.CreateAt)
		require.NotZero(t, newBoard.UpdateAt)
		require.Zero(t, newBoard.DeleteAt)
		require.Equal(t, userID, newBoard.CreatedBy)
		require.Equal(t, newBoard.CreatedBy, newBoard.ModifiedBy)
	})

	t.Run("valid private board", func(t *testing.T) {
		board := &model.Board{
			ID:     "id-test-private",
			TeamID: testTeamID,
			Type:   model.BoardTypePrivate,
		}

		newBoard, err := store.InsertBoard(board, userID)
		require.NoError(t, err)
		require.Equal(t, board.ID, newBoard.ID)
		require.Equal(t, newBoard.Type, model.BoardTypePrivate)
		require.NotZero(t, newBoard.CreateAt)
		require.NotZero(t, newBoard.UpdateAt)
		require.Zero(t, newBoard.DeleteAt)
		require.Equal(t, userID, newBoard.CreatedBy)
		require.Equal(t, newBoard.CreatedBy, newBoard.ModifiedBy)
	})

	t.Run("invalid properties field board", func(t *testing.T) {
		board := &model.Board{
			ID:         "id-test-props",
			TeamID:     testTeamID,
			Properties: map[string]interface{}{"no-serializable-value": t.Run},
		}

		_, err := store.InsertBoard(board, userID)
		require.Error(t, err)

		rBoard, err := store.GetBoard(board.ID)
		require.ErrorIs(t, err, sql.ErrNoRows)
		require.Nil(t, rBoard)
	})

	t.Run("update board", func(t *testing.T) {
		board := &model.Board{
			ID:     "id-test-public",
			TeamID: testTeamID,
			Title:  "New title",
		}

		// wait to avoid hitting pk uniqueness constraint in history
		time.Sleep(10 * time.Millisecond)

		newBoard, err := store.InsertBoard(board, "user2")
		require.NoError(t, err)
		require.Equal(t, "New title", newBoard.Title)
		require.Equal(t, "user2", newBoard.ModifiedBy)
	})

	t.Run("test update board type", func(t *testing.T) {
		board := &model.Board{
			ID:    "id-test-type-board",
			Title: "Public board",
			Type:  model.BoardTypeOpen,
		}

		newBoard, err := store.InsertBoard(board, userID)
		require.NoError(t, err)
		require.Equal(t, model.BoardTypeOpen, newBoard.Type)

		boardUpdate := &model.Board{
			ID:   "id-test-type-board",
			Type: model.BoardTypePrivate,
		}

		// wait to avoid hitting pk uniqueness constraint in history
		time.Sleep(10 * time.Millisecond)

		modifiedBoard, err := store.InsertBoard(boardUpdate, userID)
		require.NoError(t, err)
		require.Equal(t, model.BoardTypePrivate, modifiedBoard.Type)
	})
}

func testPatchBoard(t *testing.T, store store.Store) {
	userID := testUserID

	t.Run("should return error if the board doesn't exist", func(t *testing.T) {
		newTitle := "A new title"
		patch := &model.BoardPatch{Title: &newTitle}

		board, err := store.PatchBoard("nonexistent-board-id", patch, userID)
		require.Error(t, err)
		require.Nil(t, board)
	})

	t.Run("should correctly apply a simple patch", func(t *testing.T) {
		boardID := utils.NewID(utils.IDTypeBoard)
		userID2 := "user-id-2"

		board := &model.Board{
			ID:          boardID,
			TeamID:      testTeamID,
			Type:        model.BoardTypeOpen,
			Title:       "A simple title",
			Description: "A simple description",
		}

		newBoard, err := store.InsertBoard(board, userID)
		require.NoError(t, err)
		require.NotNil(t, newBoard)
		require.Equal(t, userID, newBoard.CreatedBy)

		// wait to avoid hitting pk uniqueness constraint in history
		time.Sleep(10 * time.Millisecond)

		newTitle := "A new title"
		newDescription := "A new description"
		patch := &model.BoardPatch{Title: &newTitle, Description: &newDescription}
		patchedBoard, err := store.PatchBoard(boardID, patch, userID2)
		require.NoError(t, err)
		require.Equal(t, newTitle, patchedBoard.Title)
		require.Equal(t, newDescription, patchedBoard.Description)
		require.Equal(t, userID, patchedBoard.CreatedBy)
		require.Equal(t, userID2, patchedBoard.ModifiedBy)
	})

	t.Run("should correctly update the board properties", func(t *testing.T) {
		boardID := utils.NewID(utils.IDTypeBoard)

		board := &model.Board{
			ID:     boardID,
			TeamID: testTeamID,
			Type:   model.BoardTypeOpen,
			Properties: map[string]interface{}{
				"one": "1",
				"two": "2",
			},
		}

		newBoard, err := store.InsertBoard(board, userID)
		require.NoError(t, err)
		require.NotNil(t, newBoard)
		require.Equal(t, "1", newBoard.Properties["one"].(string))
		require.Equal(t, "2", newBoard.Properties["two"].(string))

		// wait to avoid hitting pk uniqueness constraint in history
		time.Sleep(10 * time.Millisecond)

		patch := &model.BoardPatch{
			UpdatedProperties: map[string]interface{}{"three": "3"},
			DeletedProperties: []string{"one"},
		}
		patchedBoard, err := store.PatchBoard(boardID, patch, userID)
		require.NoError(t, err)
		require.NotContains(t, patchedBoard.Properties, "one")
		require.Equal(t, "2", patchedBoard.Properties["two"].(string))
		require.Equal(t, "3", patchedBoard.Properties["three"].(string))
	})

	t.Run("should correctly modify the board's type", func(t *testing.T) {
		boardID := utils.NewID(utils.IDTypeBoard)

		board := &model.Board{
			ID:     boardID,
			TeamID: testTeamID,
			Type:   model.BoardTypeOpen,
		}

		newBoard, err := store.InsertBoard(board, userID)
		require.NoError(t, err)
		require.NotNil(t, newBoard)
		require.Equal(t, newBoard.Type, model.BoardTypeOpen)

		// wait to avoid hitting pk uniqueness constraint in history
		time.Sleep(10 * time.Millisecond)

		newType := model.BoardTypePrivate
		patch := &model.BoardPatch{Type: &newType}
		patchedBoard, err := store.PatchBoard(boardID, patch, userID)
		require.NoError(t, err)
		require.Equal(t, model.BoardTypePrivate, patchedBoard.Type)
	})

	t.Run("a patch that doesn't include any of the properties should not modify them", func(t *testing.T) {
		boardID := utils.NewID(utils.IDTypeBoard)
		properties := map[string]interface{}{"prop1": "val1"}
		cardProperties := []map[string]interface{}{{"prop2": "val2"}}
		columnCalculations := map[string]interface{}{"calc3": "val3"}

		board := &model.Board{
			ID:                 boardID,
			TeamID:             testTeamID,
			Type:               model.BoardTypeOpen,
			Properties:         properties,
			CardProperties:     cardProperties,
			ColumnCalculations: columnCalculations,
		}

		newBoard, err := store.InsertBoard(board, userID)
		require.NoError(t, err)
		require.NotNil(t, newBoard)
		require.Equal(t, newBoard.Type, model.BoardTypeOpen)
		require.Equal(t, properties, newBoard.Properties)
		require.Equal(t, cardProperties, newBoard.CardProperties)
		require.Equal(t, columnCalculations, newBoard.ColumnCalculations)

		// wait to avoid hitting pk uniqueness constraint in history
		time.Sleep(10 * time.Millisecond)

		newType := model.BoardTypePrivate
		patch := &model.BoardPatch{Type: &newType}
		patchedBoard, err := store.PatchBoard(boardID, patch, userID)
		require.NoError(t, err)
		require.Equal(t, model.BoardTypePrivate, patchedBoard.Type)
		require.Equal(t, properties, patchedBoard.Properties)
		require.Equal(t, cardProperties, patchedBoard.CardProperties)
		require.Equal(t, columnCalculations, patchedBoard.ColumnCalculations)
	})

	t.Run("a patch that removes a card property and updates another should work correctly", func(t *testing.T) {
		boardID := utils.NewID(utils.IDTypeBoard)
		prop1 := map[string]interface{}{"id": "prop1", "value": "val1"}
		prop2 := map[string]interface{}{"id": "prop2", "value": "val2"}
		prop3 := map[string]interface{}{"id": "prop3", "value": "val3"}
		cardProperties := []map[string]interface{}{prop1, prop2, prop3}

		board := &model.Board{
			ID:             boardID,
			TeamID:         testTeamID,
			Type:           model.BoardTypeOpen,
			CardProperties: cardProperties,
		}

		newBoard, err := store.InsertBoard(board, userID)
		require.NoError(t, err)
		require.NotNil(t, newBoard)
		require.Equal(t, newBoard.Type, model.BoardTypeOpen)
		require.Equal(t, cardProperties, newBoard.CardProperties)

		// wait to avoid hitting pk uniqueness constraint in history
		time.Sleep(10 * time.Millisecond)

		newProp1 := map[string]interface{}{"id": "prop1", "value": "newval1"}
		expectedCardProperties := []map[string]interface{}{newProp1, prop3}
		patch := &model.BoardPatch{
			UpdatedCardProperties: []map[string]interface{}{newProp1},
			DeletedCardProperties: []string{"prop2"},
		}
		patchedBoard, err := store.PatchBoard(boardID, patch, userID)
		require.NoError(t, err)
		require.ElementsMatch(t, expectedCardProperties, patchedBoard.CardProperties)
	})
}

func testDeleteBoard(t *testing.T, store store.Store) {
	userID := testUserID

	t.Run("should return an error if the board doesn't exist", func(t *testing.T) {
		require.Error(t, store.DeleteBoard("nonexistent-board-id", userID))
	})

	t.Run("should correctly delete the board", func(t *testing.T) {
		boardID := utils.NewID(utils.IDTypeBoard)

		board := &model.Board{
			ID:     boardID,
			TeamID: testTeamID,
			Type:   model.BoardTypeOpen,
		}

		newBoard, err := store.InsertBoard(board, userID)
		require.NoError(t, err)
		require.NotNil(t, newBoard)

		rBoard, err := store.GetBoard(boardID)
		require.NoError(t, err)
		require.NotNil(t, rBoard)

		// wait to avoid hitting pk uniqueness constraint in history
		time.Sleep(10 * time.Millisecond)

		require.NoError(t, store.DeleteBoard(boardID, userID))

		r2Board, err := store.GetBoard(boardID)
		require.ErrorIs(t, err, sql.ErrNoRows)
		require.Nil(t, r2Board)
	})
}

func testInsertBoardWithAdmin(t *testing.T, store store.Store) {
	userID := testUserID

	t.Run("should correctly create a board and the admin membership with the creator", func(t *testing.T) {
		boardID := utils.NewID(utils.IDTypeBoard)

		board := &model.Board{
			ID:     boardID,
			TeamID: testTeamID,
			Type:   model.BoardTypeOpen,
		}

		newBoard, newMember, err := store.InsertBoardWithAdmin(board, userID)
		require.NoError(t, err)
		require.NotNil(t, newBoard)
		require.Equal(t, userID, newBoard.CreatedBy)
		require.Equal(t, userID, newBoard.ModifiedBy)
		require.NotNil(t, newMember)
		require.Equal(t, userID, newMember.UserID)
		require.Equal(t, boardID, newMember.BoardID)
		require.True(t, newMember.SchemeAdmin)
		require.True(t, newMember.SchemeEditor)
	})
}

func testSaveMember(t *testing.T, store store.Store) {
	userID := testUserID
	boardID := testBoardID

	t.Run("should correctly create a member", func(t *testing.T) {
		bm := &model.BoardMember{
			UserID:      userID,
			BoardID:     boardID,
			SchemeAdmin: true,
		}

		nbm, err := store.SaveMember(bm)
		require.NoError(t, err)
		require.Equal(t, userID, nbm.UserID)
		require.Equal(t, boardID, nbm.BoardID)

		require.True(t, nbm.SchemeAdmin)
	})

	t.Run("should correctly update a member", func(t *testing.T) {
		bm := &model.BoardMember{
			UserID:       userID,
			BoardID:      boardID,
			SchemeEditor: true,
			SchemeViewer: true,
		}

		nbm, err := store.SaveMember(bm)
		require.NoError(t, err)
		require.Equal(t, userID, nbm.UserID)
		require.Equal(t, boardID, nbm.BoardID)

		require.False(t, nbm.SchemeAdmin)
		require.True(t, nbm.SchemeEditor)
		require.True(t, nbm.SchemeViewer)
	})
}

func testGetMemberForBoard(t *testing.T, store store.Store) {
	userID := testUserID
	boardID := testBoardID

	t.Run("should return a no rows error for nonexisting membership", func(t *testing.T) {
		bm, err := store.GetMemberForBoard(boardID, userID)
		require.ErrorIs(t, err, sql.ErrNoRows)
		require.Nil(t, bm)
	})

	t.Run("should return the membership if exists", func(t *testing.T) {
		bm := &model.BoardMember{
			UserID:      userID,
			BoardID:     boardID,
			SchemeAdmin: true,
		}

		nbm, err := store.SaveMember(bm)
		require.NoError(t, err)
		require.NotNil(t, nbm)

		rbm, err := store.GetMemberForBoard(boardID, userID)
		require.NoError(t, err)
		require.NotNil(t, rbm)
		require.Equal(t, userID, rbm.UserID)
		require.Equal(t, boardID, rbm.BoardID)
		require.True(t, rbm.SchemeAdmin)
	})
}

func testGetMembersForBoard(t *testing.T, store store.Store) {
	t.Run("should return empty if there are no members on a board", func(t *testing.T) {
		members, err := store.GetMembersForBoard(testBoardID)
		require.NoError(t, err)
		require.Empty(t, members)
	})

	t.Run("should return the members of the board", func(t *testing.T) {
		boardID1 := "board-id-1"
		boardID2 := "board-id-2"

		userID1 := "user-id-11"
		userID2 := "user-id-12"
		userID3 := "user-id-13"

		bm1 := &model.BoardMember{BoardID: boardID1, UserID: userID1, SchemeAdmin: true}
		_, err1 := store.SaveMember(bm1)
		require.NoError(t, err1)

		bm2 := &model.BoardMember{BoardID: boardID1, UserID: userID2, SchemeEditor: true}
		_, err2 := store.SaveMember(bm2)
		require.NoError(t, err2)

		bm3 := &model.BoardMember{BoardID: boardID2, UserID: userID3, SchemeAdmin: true}
		_, err3 := store.SaveMember(bm3)
		require.NoError(t, err3)

		getMemberIDs := func(members []*model.BoardMember) []string {
			ids := make([]string, len(members))
			for i, member := range members {
				ids[i] = member.UserID
			}
			return ids
		}

		board1Members, err := store.GetMembersForBoard(boardID1)
		require.NoError(t, err)
		require.Len(t, board1Members, 2)
		require.ElementsMatch(t, []string{userID1, userID2}, getMemberIDs(board1Members))

		board2Members, err := store.GetMembersForBoard(boardID2)
		require.NoError(t, err)
		require.Len(t, board2Members, 1)
		require.ElementsMatch(t, []string{userID3}, getMemberIDs(board2Members))
	})
}

func testDeleteMember(t *testing.T, store store.Store) {
	userID := testUserID
	boardID := testBoardID

	t.Run("should return nil if deleting a nonexistent member", func(t *testing.T) {
		require.NoError(t, store.DeleteMember(boardID, userID))
	})

	t.Run("should correctly delete a member", func(t *testing.T) {
		bm := &model.BoardMember{
			UserID:      userID,
			BoardID:     boardID,
			SchemeAdmin: true,
		}

		nbm, err := store.SaveMember(bm)
		require.NoError(t, err)
		require.NotNil(t, nbm)

		require.NoError(t, store.DeleteMember(boardID, userID))

		rbm, err := store.GetMemberForBoard(boardID, userID)
		require.ErrorIs(t, err, sql.ErrNoRows)
		require.Nil(t, rbm)
	})
}

func testSearchBoardsForUserAndTeam(t *testing.T, store store.Store) {
	teamID1 := "team-id-1"
	teamID2 := "team-id-2"
	userID := "user-id-1"

	t.Run("should return empty if user is not a member of any board and there are no public boards on the team", func(t *testing.T) {
		boards, err := store.SearchBoardsForUserAndTeam("", userID, teamID1)
		require.NoError(t, err)
		require.Empty(t, boards)
	})

	board1 := &model.Board{
		ID:     "board-id-1",
		TeamID: teamID1,
		Type:   model.BoardTypeOpen,
		Title:  "Public Board with admin",
	}
	_, _, err := store.InsertBoardWithAdmin(board1, userID)
	require.NoError(t, err)

	board2 := &model.Board{
		ID:     "board-id-2",
		TeamID: teamID1,
		Type:   model.BoardTypeOpen,
		Title:  "Public Board",
	}
	_, err = store.InsertBoard(board2, userID)
	require.NoError(t, err)

	board3 := &model.Board{
		ID:     "board-id-3",
		TeamID: teamID1,
		Type:   model.BoardTypePrivate,
		Title:  "Private Board with admin",
	}
	_, _, err = store.InsertBoardWithAdmin(board3, userID)
	require.NoError(t, err)

	board4 := &model.Board{
		ID:     "board-id-4",
		TeamID: teamID1,
		Type:   model.BoardTypePrivate,
		Title:  "Private Board",
	}
	_, err = store.InsertBoard(board4, userID)
	require.NoError(t, err)

	board5 := &model.Board{
		ID:     "board-id-5",
		TeamID: teamID2,
		Type:   model.BoardTypeOpen,
		Title:  "Public Board with admin in team 2",
	}
	_, _, err = store.InsertBoardWithAdmin(board5, userID)
	require.NoError(t, err)

	testCases := []struct {
		Name             string
		TeamID           string
		UserID           string
		Term             string
		ExpectedBoardIDs []string
	}{
		{
			Name:             "should find all private boards that the user is a member of and public boards with an empty term",
			TeamID:           teamID1,
			UserID:           userID,
			Term:             "",
			ExpectedBoardIDs: []string{board1.ID, board2.ID, board3.ID},
		},
		{
			Name:             "should find all with term board",
			TeamID:           teamID1,
			UserID:           userID,
			Term:             "board",
			ExpectedBoardIDs: []string{board1.ID, board2.ID, board3.ID},
		},
		{
			Name:             "should find only public as per the term, wether user is a member or not",
			TeamID:           teamID1,
			UserID:           userID,
			Term:             "public",
			ExpectedBoardIDs: []string{board1.ID, board2.ID},
		},
		{
			Name:             "should find only private as per the term, wether user is a member or not",
			TeamID:           teamID1,
			UserID:           userID,
			Term:             "priv",
			ExpectedBoardIDs: []string{board3.ID},
		},
		{
			Name:             "should find the only board in team 2",
			TeamID:           teamID2,
			UserID:           userID,
			Term:             "",
			ExpectedBoardIDs: []string{board5.ID},
		},
		{
			Name:             "should find no board in team 2 with a non matching term",
			TeamID:           teamID2,
			UserID:           userID,
			Term:             "non-matching-term",
			ExpectedBoardIDs: []string{},
		},
	}

	for _, tc := range testCases {
		t.Run(tc.Name, func(t *testing.T) {
			boards, err := store.SearchBoardsForUserAndTeam(tc.Term, tc.UserID, tc.TeamID)
			require.NoError(t, err)

			boardIDs := []string{}
			for _, board := range boards {
				boardIDs = append(boardIDs, board.ID)
			}
			require.ElementsMatch(t, tc.ExpectedBoardIDs, boardIDs)
		})
	}
}
