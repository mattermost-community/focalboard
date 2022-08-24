package integrationtests

import (
	"testing"

	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/utils"
	"github.com/stretchr/testify/require"
)

func TestCreateCard(t *testing.T) {
	t.Run("a non authenticated user should be rejected", func(t *testing.T) {
		th := SetupTestHelper(t).InitBasic()
		defer th.TearDown()

		board := th.CreateBoard(testTeamID, model.BoardTypeOpen)
		th.Logout(th.Client)

		card := &model.Card{
			Title: "basic card",
		}
		cardNew, resp := th.Client.CreateCard(board.ID, card, false)
		th.CheckUnauthorized(resp)
		require.Nil(t, cardNew)
	})

	t.Run("good", func(t *testing.T) {
		th := SetupTestHelper(t).InitBasic()
		defer th.TearDown()

		board := th.CreateBoard(testTeamID, model.BoardTypeOpen)
		contentOrder := []string{utils.NewID(utils.IDTypeBlock), utils.NewID(utils.IDTypeBlock), utils.NewID(utils.IDTypeBlock)}

		card := &model.Card{
			Title:        "test card 1",
			Icon:         "😱",
			ContentOrder: contentOrder,
		}

		cardNew, resp := th.Client.CreateCard(board.ID, card, false)
		require.NoError(t, resp.Error)
		th.CheckOK(resp)
		require.NotNil(t, cardNew)

		require.Equal(t, board.ID, cardNew.BoardID)
		require.Equal(t, "test card 1", cardNew.Title)
		require.Equal(t, "😱", cardNew.Icon)
		require.Equal(t, contentOrder, cardNew.ContentOrder)
	})

}
