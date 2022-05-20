package storetests

import (
	"testing"

	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/services/store"
	"github.com/stretchr/testify/require"
)

const (
	testInsightsUserID1    = "user-id-1"
	testInsightsUserID2    = "user-id-2"
	testInsightsBoardID    = "board-id-1"
	testInsightsTeamID1    = "team-id-1"
	testInsightsTeamID2    = "team-id-1"
	testInsightsChannelID1 = "channel-id-1"
	testInsightsChannelID2 = "channel-id-2"
)

func StoreTestBoardsInsightsStore(t *testing.T, setup func(t *testing.T) (store.Store, func())) {
	container1 := store.Container{
		WorkspaceID: testInsightsChannelID1,
	}
	container2 := store.Container{
		WorkspaceID: testInsightsChannelID2,
	}
	t.Run("GetBoardsInsights", func(t *testing.T) {
		store, tearDown := setup(t)
		defer tearDown()
		getBoardsInsightsTest(t, store, container1, container2)
	})

}

func getBoardsInsightsTest(t *testing.T, store store.Store, container1 store.Container, container2 store.Container) {

	userID := testUserID

	t.Run("team insights", func(t *testing.T) {
		block1 := model.Block{
			ID:          "insights-id-1",
			RootID:      "insights-id-1",
			ModifiedBy:  userID,
			WorkspaceID: testInsightsChannelID1,
			Fields:      map[string]interface{}{"icon": "💬"},
		}

		block2 := model.Block{
			ID:          "insights-id-2",
			RootID:      "insights-id-2",
			ModifiedBy:  userID,
			WorkspaceID: testInsightsChannelID2,
			Fields:      map[string]interface{}{"icon": "💬"},
		}

		blockMember1 := model.Block{
			ID:          "insights-id-3",
			RootID:      "insights-id-1",
			Title:       "Old Title 1",
			WorkspaceID: testInsightsChannelID1,
		}
		blockMember2 := model.Block{
			ID:          "insights-id-4",
			RootID:      "insights-id-1",
			Title:       "Old Title 2",
			WorkspaceID: testInsightsChannelID1,
		}

		blockMember3 := model.Block{
			ID:          "insights-id-5",
			RootID:      "insights-id-2",
			Title:       "Old Title 1",
			WorkspaceID: testInsightsChannelID2,
		}
		blockMember4 := model.Block{
			ID:          "insights-id-6",
			RootID:      "insights-id-2",
			Title:       "Old Title 2",
			WorkspaceID: testInsightsChannelID2,
		}

		// container 1
		newBlocks1 := []model.Block{blockMember1, blockMember2}
		err := store.InsertBlock(container1, &block1, testInsightsUserID1)
		require.NoError(t, err)
		err = store.InsertBlocks(container1, newBlocks1, testInsightsUserID1)
		require.NoError(t, err)

		// container 2
		newBlocks2 := []model.Block{blockMember3, blockMember4}
		err = store.InsertBlock(container2, &block2, testInsightsUserID2)
		require.NoError(t, err)
		err = store.InsertBlocks(container2, newBlocks2, testInsightsUserID2)
		require.NoError(t, err)

		require.NoError(t, err)
		blocks1, err := store.GetAllBlocks(container1)
		blocks2, err := store.GetAllBlocks(container2)
		require.NoError(t, err)
		topTeamBoards, err := store.GetTeamBoardsInsights(testInsightsTeamID1, "1 day")
		require.NoError(t, err)
		require.Len(t, topTeamBoards, 2)
		require.NoError(t, err)
		require.Len(t, blocks1, 3)
		require.Len(t, blocks2, 3)
	})

}
