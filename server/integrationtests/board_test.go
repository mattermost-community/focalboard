package integrationtests

import (
	"testing"
	"time"

	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/services/store"

	"github.com/mattermost/focalboard/server/utils"
	"github.com/stretchr/testify/require"
)

const (
	testTeamID = "team-id"
)

func TestGetBoardMetadata(t *testing.T) {
	container := store.Container{
		WorkspaceID: "0",
	}

	t.Run("a non authenticated user should be rejected", func(t *testing.T) {
		th := SetupTestHelperWithLicense(t, LicenseEnterprise).InitBasic()
		defer th.TearDown()
		err := th.InitUsers("user1", "user2")
		require.NoError(t, err, "failed to init users")
		th.Logout(th.Client)

		boardMetadata, resp := th.Client.GetBoardMetadata("boar-id", "")
		th.CheckUnauthorized(resp)
		require.Nil(t, boardMetadata)
	})

	t.Run("getBoardMetadata query is correct", func(t *testing.T) {
		th := SetupTestHelperWithLicense(t, LicenseEnterprise).InitBasic()
		defer th.TearDown()
		err := th.InitUsers("user1", "user2")
		require.NoError(t, err, "failed to init users")

		th.Server.Config().EnablePublicSharedBoards = true

		teamID := testTeamID

		board := &model.Block{
			ID:          "board1",
			Title:       "public board where user1 is admin",
			Type:        model.TypeBoard,
			WorkspaceID: teamID,
			RootID:      "board1",
		}
		err = th.Server.App().InsertBlock(container, *board, th.GetUser1().ID)
		require.NoError(t, err)
		rBoard, err := th.Server.App().GetBlockByID(container, board.ID)

		// Check metadata
		boardMetadata, resp := th.Client.GetBoardMetadata(rBoard.ID, "")
		th.CheckOK(resp)
		require.NotNil(t, boardMetadata)

		require.Equal(t, rBoard.CreatedBy, boardMetadata.CreatedBy)
		require.Equal(t, rBoard.CreateAt, boardMetadata.DescendantFirstUpdateAt)
		require.Equal(t, rBoard.UpdateAt, boardMetadata.DescendantLastUpdateAt)
		require.Equal(t, rBoard.ModifiedBy, boardMetadata.LastModifiedBy)

		// Insert card1
		card1 := model.Block{
			ID:     "card1",
			RootID: rBoard.ID,
			Title:  "Card 1",
		}
		time.Sleep(20 * time.Millisecond)
		require.NoError(t, th.Server.App().InsertBlock(container, card1, th.GetUser2().ID))
		rCard1, err := th.Server.App().GetBlockByID(container, card1.ID)
		require.NoError(t, err)

		// Check updated metadata
		boardMetadata, resp = th.Client.GetBoardMetadata(rBoard.ID, "")
		th.CheckOK(resp)
		require.NotNil(t, boardMetadata)

		require.Equal(t, rBoard.CreatedBy, boardMetadata.CreatedBy)
		require.Equal(t, rBoard.CreateAt, boardMetadata.DescendantFirstUpdateAt)
		require.Equal(t, rCard1.UpdateAt, boardMetadata.DescendantLastUpdateAt)
		require.Equal(t, rCard1.ModifiedBy, boardMetadata.LastModifiedBy)

		// Insert card2
		card2 := model.Block{
			ID:     "card2",
			RootID: rBoard.ID,
			Title:  "Card 2",
		}
		time.Sleep(20 * time.Millisecond)
		require.NoError(t, th.Server.App().InsertBlock(container, card2, th.GetUser1().ID))
		rCard2, err := th.Server.App().GetBlockByID(container, card2.ID)
		require.NoError(t, err)

		// Check updated metadata
		boardMetadata, resp = th.Client.GetBoardMetadata(rBoard.ID, "")
		th.CheckOK(resp)
		require.NotNil(t, boardMetadata)
		require.Equal(t, rBoard.CreatedBy, boardMetadata.CreatedBy)
		require.Equal(t, rBoard.CreateAt, boardMetadata.DescendantFirstUpdateAt)
		require.Equal(t, rCard2.UpdateAt, boardMetadata.DescendantLastUpdateAt)
		require.Equal(t, rCard2.ModifiedBy, boardMetadata.LastModifiedBy)

		t.Run("After delete board", func(t *testing.T) {
			// Delete board
			time.Sleep(20 * time.Millisecond)
			require.NoError(t, th.Server.App().DeleteBlock(container, rBoard.ID, th.GetUser1().ID))

			// Check updated metadata
			boardMetadata, resp = th.Client.GetBoardMetadata(rBoard.ID, "")
			th.CheckOK(resp)
			require.NotNil(t, boardMetadata)
			require.Equal(t, rBoard.CreatedBy, boardMetadata.CreatedBy)
			require.Equal(t, rBoard.CreateAt, boardMetadata.DescendantFirstUpdateAt)
			require.Greater(t, boardMetadata.DescendantLastUpdateAt, rCard2.UpdateAt)
			require.Equal(t, th.GetUser1().ID, boardMetadata.LastModifiedBy)
		})
	})

	t.Run("getBoardMetadata should fail with no license", func(t *testing.T) {
		th := SetupTestHelperWithLicense(t, LicenseNone).InitBasic()
		defer th.TearDown()
		err := th.InitUsers("user1", "user2")
		require.NoError(t, err, "failed to init users")

		th.Server.Config().EnablePublicSharedBoards = true

		teamID := testTeamID

		board := &model.Block{
			ID:          "board1",
			Title:       "public board where user1 is admin",
			Type:        model.TypeBoard,
			WorkspaceID: teamID,
			RootID:      "board1",
		}

		err = th.Server.App().InsertBlock(container, *board, th.GetUser1().ID)
		rBoard, err := th.Server.App().GetBlockByID(container, board.ID)
		require.NoError(t, err)

		// Check metadata
		boardMetadata, resp := th.Client.GetBoardMetadata(rBoard.ID, "")
		th.CheckNotImplemented(resp)
		require.Nil(t, boardMetadata)
	})

	t.Run("getBoardMetadata should fail on Professional license", func(t *testing.T) {
		th := SetupTestHelperWithLicense(t, LicenseProfessional).InitBasic()
		defer th.TearDown()
		err := th.InitUsers("user1", "user2")
		require.NoError(t, err, "failed to init users")
		th.Server.Config().EnablePublicSharedBoards = true

		teamID := testTeamID

		board := &model.Block{
			ID:          "board1",
			Title:       "public board where user1 is admin",
			Type:        model.TypeBoard,
			WorkspaceID: teamID,
			RootID:      "board1",
		}
		err = th.Server.App().InsertBlock(container, *board, th.GetUser1().ID)
		rBoard, err := th.Server.App().GetBlockByID(container, board.ID)
		require.NoError(t, err)

		// Check metadata
		boardMetadata, resp := th.Client.GetBoardMetadata(rBoard.ID, "")
		th.CheckNotImplemented(resp)
		require.Nil(t, boardMetadata)
	})

	t.Run("valid read token should not get the board metadata", func(t *testing.T) {
		th := SetupTestHelperWithLicense(t, LicenseEnterprise).InitBasic()
		defer th.TearDown()
		err := th.InitUsers("user1", "user2")
		require.NoError(t, err, "failed to init users")
		th.Server.Config().EnablePublicSharedBoards = true

		teamID := testTeamID
		sharingToken := utils.NewID(utils.IDTypeToken)

		board := &model.Block{
			ID:          "board1",
			Title:       "public board where user1 is admin",
			Type:        model.TypeBoard,
			WorkspaceID: teamID,
			RootID:      "board1",
		}
		err = th.Server.App().InsertBlock(container, *board, th.GetUser1().ID)
		rBoard, err := th.Server.App().GetBlockByID(container, board.ID)
		require.NoError(t, err)

		sharing := &model.Sharing{
			ID:       rBoard.ID,
			Enabled:  true,
			Token:    sharingToken,
			UpdateAt: 1,
		}

		success, resp := th.Client.PostSharing(*sharing)
		th.CheckOK(resp)
		require.True(t, success)

		// the client logs out
		th.Logout(th.Client)

		// we make sure that the client cannot currently retrieve the
		// board with no session
		boardMetadata, resp := th.Client.GetBoardMetadata(rBoard.ID, "")
		th.CheckUnauthorized(resp)
		require.Nil(t, boardMetadata)

		// it should not be able to retrieve it with the read token either
		boardMetadata, resp = th.Client.GetBoardMetadata(rBoard.ID, sharingToken)
		th.CheckUnauthorized(resp)
		require.Nil(t, boardMetadata)
	})
}
