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

		insights, resp := th.Client.GetTeamBoardsInsights("team-id", "4%20day")
		require.NoError(t, resp.Error)
		require.Len(t, insights, 1)

		require.Equal(t, board.ID, insights[0].BoardID)
		require.Equal(t, "3", insights[0].ActivityCount)
	})

	t.Run("Boards without activity should not be included in insights", func(t *testing.T) {
		th := SetupTestHelperWithToken(t).Start()
		defer th.TearDown()

		insights, resp := th.Client.GetTeamBoardsInsights("team-id", "4%20day")
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
		insights, resp := th.Client.GetUserBoardsInsights(me.ID, "4%20day")
		require.NoError(t, resp.Error)
		require.Len(t, insights, 1)

		require.Equal(t, board.ID, insights[0].BoardID)
		require.Equal(t, "3", insights[0].ActivityCount)
	})

	t.Run("Boards without activity should not be included in insights", func(t *testing.T) {
		th := SetupTestHelperWithToken(t).Start()
		defer th.TearDown()

		me, _ := th.Client.GetMe()
		insights, resp := th.Client.GetUserBoardsInsights(me.ID, "4%20day")
		require.NoError(t, resp.Error)
		require.Len(t, insights, 0)
	})
}
