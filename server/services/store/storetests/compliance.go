package storetests

import (
	"math"
	"testing"

	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/services/store"
	"github.com/mattermost/focalboard/server/utils"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func StoreTestComplianceHistoryStore(t *testing.T, setup func(t *testing.T) (store.Store, func())) {
	t.Run("GetBoardsForCompliance", func(t *testing.T) {
		store, tearDown := setup(t)
		defer tearDown()
		testGetBoardsForCompliance(t, store)
	})
	t.Run("GetBoardsComplianceHistory", func(t *testing.T) {
		store, tearDown := setup(t)
		defer tearDown()
		testGetBoardsComplianceHistory(t, store)
	})
	t.Run("GetBlocksComplianceHistory", func(t *testing.T) {
		store, tearDown := setup(t)
		defer tearDown()
		testGetBlocksComplianceHistory(t, store)
	})
}

func testGetBoardsForCompliance(t *testing.T, store store.Store) {
	team1 := testTeamID
	team2 := utils.NewID(utils.IDTypeTeam)

	boardsAdded1 := createTestBoards(t, store, team1, testUserID, 10)
	boardsAdded2 := createTestBoards(t, store, team2, testUserID, 7)

	deleteTestBoard(t, store, boardsAdded1[0].ID, testUserID)
	deleteTestBoard(t, store, boardsAdded1[1].ID, testUserID)
	boardsAdded1 = boardsAdded1[2:]

	t.Run("Invalid teamID", func(t *testing.T) {
		opts := model.QueryBoardsForComplianceOptions{
			TeamID: utils.NewID(utils.IDTypeTeam),
		}

		boards, hasMore, err := store.GetBoardsForCompliance(opts)

		assert.Empty(t, boards)
		assert.False(t, hasMore)
		assert.NoError(t, err)
	})

	t.Run("All teams", func(t *testing.T) {
		opts := model.QueryBoardsForComplianceOptions{}

		boards, hasMore, err := store.GetBoardsForCompliance(opts)

		assert.ElementsMatch(t, extractIDs(t, boards), extractIDs(t, boardsAdded1, boardsAdded2))
		assert.False(t, hasMore)
		assert.NoError(t, err)
	})

	t.Run("Specific team", func(t *testing.T) {
		opts := model.QueryBoardsForComplianceOptions{
			TeamID: team1,
		}

		boards, hasMore, err := store.GetBoardsForCompliance(opts)

		assert.ElementsMatch(t, extractIDs(t, boards), extractIDs(t, boardsAdded1))
		assert.False(t, hasMore)
		assert.NoError(t, err)
	})

	t.Run("Pagination", func(t *testing.T) {
		opts := model.QueryBoardsForComplianceOptions{
			Page:    0,
			PerPage: 3,
		}

		reps := 0
		allBoards := make([]*model.Board, 0, 20)

		for {
			boards, hasMore, err := store.GetBoardsForCompliance(opts)
			require.NoError(t, err)
			require.NotEmpty(t, boards)
			allBoards = append(allBoards, boards...)

			if !hasMore {
				break
			}
			opts.Page++
			reps++
		}

		assert.ElementsMatch(t, extractIDs(t, allBoards), extractIDs(t, boardsAdded1, boardsAdded2))
	})
}

func testGetBoardsComplianceHistory(t *testing.T, store store.Store) {
	team1 := testTeamID
	team2 := utils.NewID(utils.IDTypeTeam)

	boardsAdded1 := createTestBoards(t, store, team1, testUserID, 10)
	boardsAdded2 := createTestBoards(t, store, team2, testUserID, 7)

	deleteTestBoard(t, store, boardsAdded1[0].ID, testUserID)
	deleteTestBoard(t, store, boardsAdded1[1].ID, testUserID)
	boardsDeleted1 := boardsAdded1[0:2]

	t.Run("Invalid teamID", func(t *testing.T) {
		opts := model.QueryBoardsComplianceHistoryOptions{
			TeamID: utils.NewID(utils.IDTypeTeam),
		}

		boardHistories, hasMore, err := store.GetBoardsComplianceHistory(opts)

		assert.Empty(t, boardHistories)
		assert.False(t, hasMore)
		assert.NoError(t, err)
	})

	t.Run("All teams, include deleted", func(t *testing.T) {
		opts := model.QueryBoardsComplianceHistoryOptions{
			IncludeDeleted: true,
		}

		boardHistories, hasMore, err := store.GetBoardsComplianceHistory(opts)

		// boardHistories should contain a record for each board added, plus a record for the 2 deleted.
		assert.ElementsMatch(t, extractIDs(t, boardHistories), extractIDs(t, boardsAdded1, boardsAdded2, boardsDeleted1))
		assert.False(t, hasMore)
		assert.NoError(t, err)
	})

	t.Run("All teams, exclude deleted", func(t *testing.T) {
		opts := model.QueryBoardsComplianceHistoryOptions{
			IncludeDeleted: false,
		}

		boardHistories, hasMore, err := store.GetBoardsComplianceHistory(opts)

		// boardHistories should contain a record for each board added.
		assert.ElementsMatch(t, extractIDs(t, boardHistories), extractIDs(t, boardsAdded1, boardsAdded2))
		assert.False(t, hasMore)
		assert.NoError(t, err)
	})

	t.Run("Specific team", func(t *testing.T) {
		opts := model.QueryBoardsComplianceHistoryOptions{
			TeamID: team1,
		}

		boardHistories, hasMore, err := store.GetBoardsComplianceHistory(opts)

		assert.ElementsMatch(t, extractIDs(t, boardHistories), extractIDs(t, boardsAdded1))
		assert.False(t, hasMore)
		assert.NoError(t, err)
	})

	t.Run("Pagination", func(t *testing.T) {
		opts := model.QueryBoardsComplianceHistoryOptions{
			Page:    0,
			PerPage: 3,
		}

		reps := 0
		allHistories := make([]model.BoardHistory, 0, 20)

		for {
			reps++
			boardHistories, hasMore, err := store.GetBoardsComplianceHistory(opts)
			require.NoError(t, err)
			require.NotEmpty(t, boardHistories)
			allHistories = append(allHistories, boardHistories...)

			if !hasMore {
				break
			}
			opts.Page++
		}

		assert.ElementsMatch(t, extractIDs(t, allHistories), extractIDs(t, boardsAdded1, boardsAdded2))

		// 17 boards were added. Fetching 3 per page means 6 reps
		assert.Equal(t, math.Floor(17/3)+1, float64(reps))
	})
}

func testGetBlocksComplianceHistory(t *testing.T, store store.Store) {
	team1 := testTeamID
	team2 := utils.NewID(utils.IDTypeTeam)

	boardsAdded1 := createTestBoards(t, store, team1, testUserID, 3)
	boardsAdded2 := createTestBoards(t, store, team2, testUserID, 1)

	// add cards (13 in total)
	cardsAdded1B1 := createTestCards(t, store, testUserID, boardsAdded1[0].ID, 3)
	cardsAdded1B2 := createTestCards(t, store, testUserID, boardsAdded1[1].ID, 5)
	cardsAdded1B3 := createTestCards(t, store, testUserID, boardsAdded1[2].ID, 2)
	cardsAdded2B1 := createTestCards(t, store, testUserID, boardsAdded2[0].ID, 3)

	deleteTestBoard(t, store, boardsAdded1[0].ID, testUserID)
	cardsDeleted := cardsAdded1B1

	t.Run("Invalid teamID", func(t *testing.T) {
		opts := model.QueryBlocksComplianceHistoryOptions{
			TeamID: utils.NewID(utils.IDTypeTeam),
		}

		boards, hasMore, err := store.GetBlocksComplianceHistory(opts)

		assert.Empty(t, boards)
		assert.False(t, hasMore)
		assert.NoError(t, err)
	})

	t.Run("All teams, include deleted", func(t *testing.T) {
		opts := model.QueryBlocksComplianceHistoryOptions{
			IncludeDeleted: true,
		}

		blockHistories, hasMore, err := store.GetBlocksComplianceHistory(opts)

		// blockHistories should have records for all cards added, plus all cards deleted
		assert.ElementsMatch(t, extractIDs(t, blockHistories, nil),
			extractIDs(t, cardsAdded1B1, cardsAdded1B2, cardsAdded1B3, cardsAdded2B1, cardsDeleted))
		assert.False(t, hasMore)
		assert.NoError(t, err)
	})

	t.Run("All teams, exclude deleted", func(t *testing.T) {
		opts := model.QueryBlocksComplianceHistoryOptions{}

		blockHistories, hasMore, err := store.GetBlocksComplianceHistory(opts)

		// blockHistories should have records for all cards added
		assert.ElementsMatch(t, extractIDs(t, blockHistories, nil),
			extractIDs(t, cardsAdded1B1, cardsAdded1B2, cardsAdded1B3, cardsAdded2B1))
		assert.False(t, hasMore)
		assert.NoError(t, err)
	})

	t.Run("Specific team", func(t *testing.T) {
		opts := model.QueryBlocksComplianceHistoryOptions{
			TeamID: team1,
		}

		blockHistories, hasMore, err := store.GetBlocksComplianceHistory(opts)

		assert.ElementsMatch(t, extractIDs(t, blockHistories), extractIDs(t, cardsAdded1B1, cardsAdded1B2, cardsAdded1B3))
		assert.False(t, hasMore)
		assert.NoError(t, err)
	})

	t.Run("Pagination", func(t *testing.T) {
		opts := model.QueryBlocksComplianceHistoryOptions{
			Page:    0,
			PerPage: 3,
		}

		reps := 0
		allHistories := make([]model.BlockHistory, 0)

		for {
			reps++
			blockHistories, hasMore, err := store.GetBlocksComplianceHistory(opts)
			require.NoError(t, err)
			require.NotEmpty(t, blockHistories)
			allHistories = append(allHistories, blockHistories...)

			if !hasMore {
				break
			}
			opts.Page++
		}

		assert.ElementsMatch(t, extractIDs(t, allHistories), extractIDs(t, cardsAdded1B1, cardsAdded1B2, cardsAdded1B3, cardsAdded2B1))

		// 13 cards were added. Fetching 3 per page means 5 reps
		assert.Equal(t, math.Floor(13/3)+1, float64(reps))
	})
}
