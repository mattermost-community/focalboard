package storetests

import (
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

		assert.ElementsMatch(t, extractBoardIDs(boards, nil), extractBoardIDs(boardsAdded1, boardsAdded2))
		assert.False(t, hasMore)
		assert.NoError(t, err)
	})

	t.Run("Specific team", func(t *testing.T) {
		opts := model.QueryBoardsForComplianceOptions{
			TeamID: team1,
		}

		boards, hasMore, err := store.GetBoardsForCompliance(opts)

		assert.ElementsMatch(t, extractBoardIDs(boards, nil), extractBoardIDs(boardsAdded1, nil))
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

		assert.ElementsMatch(t, extractBoardIDs(allBoards, nil), extractBoardIDs(boardsAdded1, boardsAdded2))
	})
}
