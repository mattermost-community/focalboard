package integrationtests

import (
	"testing"

	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/utils"

	"github.com/stretchr/testify/require"
)

func TestTeamBoardsInsights(t *testing.T) {
	t.Run("Boards with activity should be included in insights", func(t *testing.T) {
		th := SetupTestHelperWithToken(t).Start()
		defer th.TearDown()

		user, _ := th.Client.GetMe()
		board1 := th.CreateBoard("team-id", model.BoardTypeOpen)
		board2 := th.CreateBoard("team-id", model.BoardTypeOpen)
		initialID1 := utils.NewID(utils.IDTypeBlock)
		initialID2 := utils.NewID(utils.IDTypeBlock)
		initialID3 := utils.NewID(utils.IDTypeBlock)
		newBlocks1 := []model.Block{
			{
				ID:       initialID1,
				BoardID:  board1.ID,
				CreateAt: 1,
				UpdateAt: 1,
				Type:     model.TypeCard,
			},
			{
				ID:       initialID2,
				BoardID:  board1.ID,
				CreateAt: 1,
				UpdateAt: 1,
				Type:     model.TypeCard,
			},
		}

		newBlocks2 := []model.Block{
			{
				ID:       initialID3,
				BoardID:  board2.ID,
				CreateAt: 1,
				UpdateAt: 1,
				Type:     model.TypeCard,
			},
		}
		newBlocks1, resp := th.Client.InsertBlocks(board1.ID, newBlocks1)
		require.NoError(t, resp.Error)
		require.Len(t, newBlocks1, 2)
		newBlocks2, resp = th.Client.InsertBlocks(board2.ID, newBlocks2)
		require.NoError(t, resp.Error)
		require.Len(t, newBlocks2, 1)
		insights, resp := th.Client.GetTeamBoardsInsights("team-id", user.ID, "28_day", 0, 10)
		require.NoError(t, resp.Error)
		require.Len(t, insights, 2)

		// following two asserts ensure that boards with activity are ordered by BoardInsight.ActivityCount
		require.Equal(t, board1.ID, insights.Items[0].BoardID)
		require.Equal(t, board2.ID, insights.Items[1].BoardID)
		require.Equal(t, "3", insights.Items[0].ActivityCount)
	})

	t.Run("Boards without activity should not be included in insights", func(t *testing.T) {
		th := SetupTestHelperWithToken(t).Start()
		defer th.TearDown()
		user, _ := th.Client.GetMe()
		insights, resp := th.Client.GetTeamBoardsInsights("team-id", user.ID, "28_day", 0, 10)
		require.NoError(t, resp.Error)
		require.Len(t, insights, 0)
	})
}

func TestUserBoardsInsights(t *testing.T) {
	t.Run("Boards with activity should be included in insights", func(t *testing.T) {
		th := SetupTestHelperWithToken(t).Start()
		defer th.TearDown()
		board := th.CreateBoard("team-id", model.BoardTypeOpen)

		initialID1 := utils.NewID(utils.IDTypeBlock)
		initialID2 := utils.NewID(utils.IDTypeBlock)
		newBlocks := []model.Block{
			{
				ID:       initialID1,
				BoardID:  board.ID,
				CreateAt: 1,
				UpdateAt: 1,
				Type:     model.TypeCard,
			},
			{
				ID:       initialID2,
				BoardID:  board.ID,
				CreateAt: 1,
				UpdateAt: 1,
				Type:     model.TypeCard,
			},
		}
		newBlocks, resp := th.Client.InsertBlocks(board.ID, newBlocks)
		require.NoError(t, resp.Error)
		require.Len(t, newBlocks, 2)

		me, _ := th.Client.GetMe()
		insights, resp := th.Client.GetUserBoardsInsights("team-id", me.ID, "28_day", 0, 10)
		require.NoError(t, resp.Error)
		require.Len(t, insights, 1)

		require.Equal(t, board.ID, insights.Items[0].BoardID)
		require.Equal(t, "3", insights.Items[0].ActivityCount)
	})

	t.Run("Boards without activity should not be included in insights", func(t *testing.T) {
		th := SetupTestHelperWithToken(t).Start()
		defer th.TearDown()

		me, _ := th.Client.GetMe()
		insights, resp := th.Client.GetUserBoardsInsights("team-id", me.ID, "28_day", 0, 10)
		require.NoError(t, resp.Error)
		require.Len(t, insights, 0)
	})
}
