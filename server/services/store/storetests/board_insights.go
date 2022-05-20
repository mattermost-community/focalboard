package storetests

import (
	"fmt"
	"testing"

	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/services/store"
	"github.com/stretchr/testify/require"
)

const (
	testInsightsUserID    = "user-id-1"
	testInsightsBoardID   = "board-id-1"
	testInsightsTeamID    = "team-id-1"
	testInsightsChannelID = "channel-id-1"
)

func StoreTestBoardsInsightsStore(t *testing.T, setup func(t *testing.T) (store.Store, func())) {
	container := store.Container{
		WorkspaceID: testInsightsChannelID,
	}
	t.Run("GetBoardsInsights", func(t *testing.T) {
		store, tearDown := setup(t)
		defer tearDown()
		getBoardsInsightsTest(t, store, container)
	})

}

func getBoardsInsightsTest(t *testing.T, store store.Store, container store.Container) {

	store.CreateTestChannelsTable()
	userID := testUserID

	t.Run("team insights", func(t *testing.T) {
		block := model.Block{
			ID:          "insights-id-1",
			RootID:      "insights-id-1",
			ModifiedBy:  userID,
			WorkspaceID: testInsightsChannelID,
			Fields:      map[string]interface{}{"icon": "💬"},
		}

		blockMember1 := model.Block{
			ID:          "insights-id-2",
			RootID:      "insights-id-1",
			Title:       "Old Title 1",
			WorkspaceID: testInsightsChannelID,
		}
		blockMember2 := model.Block{
			ID:          "insights-id-3",
			RootID:      "insights-id-1",
			Title:       "Old Title 2",
			WorkspaceID: testInsightsChannelID,
		}
		newBlocks := []model.Block{blockMember1, blockMember2}

		err := store.InsertBlock(container, &block, "user-id-1")
		require.NoError(t, err)

		err = store.InsertBlocks(container, newBlocks, testInsightsUserID)
		require.NoError(t, err)
		blocks, err := store.GetAllBlocks(container)
		require.NoError(t, err)
		topTeamBoards, err := store.GetTeamBoardsInsights(testInsightsTeamID, "1 day")
		require.NoError(t, err)
		fmt.Println(topTeamBoards)
		require.Len(t, topTeamBoards, 1)
		require.NoError(t, err)
		require.Len(t, blocks, 3)
	})

}
