package integrationtests

import (
	"math"
	"os"
	"strconv"
	"testing"

	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/utils"
	"github.com/stretchr/testify/require"
)

const (
	testAdmin = "test-admin"
)

func setupTestHelperForCompliance(t *testing.T, complianceLicense bool) (*TestHelper, Clients) {
	os.Setenv("FOCALBOARD_UNIT_TESTING_COMPLIANCE", strconv.FormatBool(complianceLicense))

	th := SetupTestHelperPluginMode(t)
	clients := setupClients(th)

	th.Client = clients.TeamMember
	th.Client2 = clients.TeamMember

	return th, clients
}

func TestGetBoardsForCompliance(t *testing.T) {
	t.Run("missing Features.Compliance license should fail", func(t *testing.T) {
		th, clients := setupTestHelperForCompliance(t, false)
		defer th.TearDown()

		_ = th.CreateBoards(testTeamID, model.BoardTypeOpen, 2)

		bcr, resp := clients.Admin.GetBoardsForCompliance(testTeamID, 0, 0)

		th.CheckNotImplemented(resp)
		require.Nil(t, bcr)
	})

	t.Run("a non authenticated user should be rejected", func(t *testing.T) {
		th, clients := setupTestHelperForCompliance(t, true)
		defer th.TearDown()

		_ = th.CreateBoards(testTeamID, model.BoardTypeOpen, 2)
		th.Logout(th.Client)

		boards, resp := clients.Anon.GetBoardsForCompliance(testTeamID, 0, 0)

		th.CheckUnauthorized(resp)
		require.Nil(t, boards)
	})

	t.Run("a user without manage_system permission should be rejected", func(t *testing.T) {
		th, clients := setupTestHelperForCompliance(t, true)
		defer th.TearDown()

		_ = th.CreateBoards(testTeamID, model.BoardTypeOpen, 2)

		bcr, resp := clients.TeamMember.GetBoardsForCompliance(testTeamID, 0, 0)

		th.CheckUnauthorized(resp)
		require.Nil(t, bcr)
	})

	t.Run("good call", func(t *testing.T) {
		th, clients := setupTestHelperForCompliance(t, true)
		defer th.TearDown()

		const count = 10
		_ = th.CreateBoards(testTeamID, model.BoardTypeOpen, count)

		bcr, resp := clients.Admin.GetBoardsForCompliance(testTeamID, 0, 0) //  admin.GetBoardsForCompliance(testTeamID, 0, 0)
		th.CheckOK(resp)
		require.False(t, bcr.HasNext)
		require.Len(t, bcr.Results, count)
	})

	t.Run("pagination", func(t *testing.T) {
		th, clients := setupTestHelperForCompliance(t, true)
		defer th.TearDown()

		const count = 20
		const perPage = 3
		_ = th.CreateBoards(testTeamID, model.BoardTypeOpen, count)

		boards := make([]*model.Board, 0, count)
		page := 0
		for {
			bcr, resp := clients.Admin.GetBoardsForCompliance(testTeamID, page, perPage)
			page++
			th.CheckOK(resp)
			boards = append(boards, bcr.Results...)
			if !bcr.HasNext {
				break
			}
		}
		require.Len(t, boards, count)
		require.Equal(t, int(math.Floor((count/perPage)+1)), page)
	})

	t.Run("invalid teamID", func(t *testing.T) {
		th, clients := setupTestHelperForCompliance(t, true)
		defer th.TearDown()

		_ = th.CreateBoards(testTeamID, model.BoardTypeOpen, 2)

		bcr, resp := clients.Admin.GetBoardsForCompliance(utils.NewID(utils.IDTypeTeam), 0, 0)

		th.CheckBadRequest(resp)
		require.Nil(t, bcr)
	})

}
