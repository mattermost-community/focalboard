//nolint:dupl
package integrationtests

import (
	"bytes"
	"fmt"
	"net/http"
	"testing"

	"github.com/mattermost/focalboard/server/api"
	"github.com/mattermost/focalboard/server/client"
	"github.com/mattermost/focalboard/server/model"
	"github.com/stretchr/testify/require"
)

func setupLocalClients(th *TestHelper) Clients {
	th.Client = client.NewClient(th.Server.Config().ServerRoot, "")
	th.RegisterAndLogin(th.Client, "sysadmin", "sysadmin@sample.com", password, "")

	clients := Clients{
		Anon:         client.NewClient(th.Server.Config().ServerRoot, ""),
		NoTeamMember: client.NewClient(th.Server.Config().ServerRoot, ""),
		TeamMember:   client.NewClient(th.Server.Config().ServerRoot, ""),
		Viewer:       client.NewClient(th.Server.Config().ServerRoot, ""),
		Commenter:    client.NewClient(th.Server.Config().ServerRoot, ""),
		Editor:       client.NewClient(th.Server.Config().ServerRoot, ""),
		Admin:        client.NewClient(th.Server.Config().ServerRoot, ""),
	}

	// get token
	team, resp := th.Client.GetTeam(model.GlobalTeamID)
	th.CheckOK(resp)
	require.NotNil(th.T, team)
	require.NotNil(th.T, team.SignupToken)

	th.RegisterAndLogin(clients.NoTeamMember, userNoTeamMember, userNoTeamMember+"@sample.com", password, team.SignupToken)
	userNoTeamMemberID = clients.NoTeamMember.GetUserID()

	th.RegisterAndLogin(clients.TeamMember, userTeamMember, userTeamMember+"@sample.com", password, team.SignupToken)
	userTeamMemberID = clients.TeamMember.GetUserID()

	th.RegisterAndLogin(clients.Viewer, userViewer, userViewer+"@sample.com", password, team.SignupToken)
	userViewerID = clients.Viewer.GetUserID()

	th.RegisterAndLogin(clients.Commenter, userCommenter, userCommenter+"@sample.com", password, team.SignupToken)
	userCommenterID = clients.Commenter.GetUserID()

	th.RegisterAndLogin(clients.Editor, userEditor, userEditor+"@sample.com", password, team.SignupToken)
	userEditorID = clients.Editor.GetUserID()

	th.RegisterAndLogin(clients.Admin, userAdmin, userAdmin+"@sample.com", password, team.SignupToken)
	userAdminID = clients.Admin.GetUserID()

	return clients
}

func TestLocalPermissionsGetTeamBoards(t *testing.T) {
	th := SetupTestHelperLocalMode(t)
	defer th.TearDown()
	clients := setupLocalClients(th)
	testData := setupData(t, th)

	ttCases := []TestCase{
		{"/teams/test-team/boards", methodGet, "", userAnon, http.StatusUnauthorized, 0},
		{"/teams/test-team/boards", methodGet, "", userNoTeamMember, http.StatusOK, 1},
		{"/teams/test-team/boards", methodGet, "", userTeamMember, http.StatusOK, 1},
		{"/teams/test-team/boards", methodGet, "", userViewer, http.StatusOK, 2},
		{"/teams/test-team/boards", methodGet, "", userCommenter, http.StatusOK, 2},
		{"/teams/test-team/boards", methodGet, "", userEditor, http.StatusOK, 2},
		{"/teams/test-team/boards", methodGet, "", userAdmin, http.StatusOK, 2},
	}
	runTestCases(t, ttCases, testData, clients)
}

func TestLocalPermissionsSearchTeamBoards(t *testing.T) {
	th := SetupTestHelperLocalMode(t)
	defer th.TearDown()
	clients := setupLocalClients(th)
	testData := setupData(t, th)

	ttCases := []TestCase{
		// Search boards
		{"/teams/test-team/boards/search?q=b", methodGet, "", userAnon, http.StatusUnauthorized, 0},
		{"/teams/test-team/boards/search?q=b", methodGet, "", userNoTeamMember, http.StatusOK, 1},
		{"/teams/test-team/boards/search?q=b", methodGet, "", userTeamMember, http.StatusOK, 1},
		{"/teams/test-team/boards/search?q=b", methodGet, "", userViewer, http.StatusOK, 2},
		{"/teams/test-team/boards/search?q=b", methodGet, "", userCommenter, http.StatusOK, 2},
		{"/teams/test-team/boards/search?q=b", methodGet, "", userEditor, http.StatusOK, 2},
		{"/teams/test-team/boards/search?q=b", methodGet, "", userAdmin, http.StatusOK, 2},
	}
	runTestCases(t, ttCases, testData, clients)
}

func TestLocalPermissionsGetTeamTemplates(t *testing.T) {
	th := SetupTestHelperLocalMode(t)
	defer th.TearDown()
	clients := setupLocalClients(th)
	testData := setupData(t, th)

	err := th.Server.App().InitTemplates()
	require.NoError(t, err, "InitTemplates should succeed")

	builtInTemplateCount := 7

	ttCases := []TestCase{
		// Get Team Boards
		{"/teams/test-team/templates", methodGet, "", userAnon, http.StatusUnauthorized, 0},
		{"/teams/test-team/templates", methodGet, "", userNoTeamMember, http.StatusOK, 1},
		{"/teams/test-team/templates", methodGet, "", userTeamMember, http.StatusOK, 1},
		{"/teams/test-team/templates", methodGet, "", userViewer, http.StatusOK, 2},
		{"/teams/test-team/templates", methodGet, "", userCommenter, http.StatusOK, 2},
		{"/teams/test-team/templates", methodGet, "", userEditor, http.StatusOK, 2},
		{"/teams/test-team/templates", methodGet, "", userAdmin, http.StatusOK, 2},
		// Built-in templates
		{"/teams/0/templates", methodGet, "", userAnon, http.StatusUnauthorized, 0},
		{"/teams/0/templates", methodGet, "", userNoTeamMember, http.StatusOK, builtInTemplateCount},
		{"/teams/0/templates", methodGet, "", userTeamMember, http.StatusOK, builtInTemplateCount},
		{"/teams/0/templates", methodGet, "", userViewer, http.StatusOK, builtInTemplateCount},
		{"/teams/0/templates", methodGet, "", userCommenter, http.StatusOK, builtInTemplateCount},
		{"/teams/0/templates", methodGet, "", userEditor, http.StatusOK, builtInTemplateCount},
		{"/teams/0/templates", methodGet, "", userAdmin, http.StatusOK, builtInTemplateCount},
	}
	runTestCases(t, ttCases, testData, clients)
}

func TestLocalPermissionsCreateBoard(t *testing.T) {
	th := SetupTestHelperLocalMode(t)
	defer th.TearDown()
	clients := setupLocalClients(th)
	testData := setupData(t, th)

	publicBoard := toJSON(t, model.Board{Title: "Board To Create", TeamID: "test-team", Type: model.BoardTypeOpen})
	privateBoard := toJSON(t, model.Board{Title: "Board To Create", TeamID: "test-team", Type: model.BoardTypeOpen})

	ttCases := []TestCase{
		// Create Public boards
		{"/boards", methodPost, publicBoard, userAnon, http.StatusUnauthorized, 0},
		{"/boards", methodPost, publicBoard, userNoTeamMember, http.StatusOK, 1},
		{"/boards", methodPost, publicBoard, userTeamMember, http.StatusOK, 1},

		// Create private boards
		{"/boards", methodPost, privateBoard, userAnon, http.StatusUnauthorized, 0},
		{"/boards", methodPost, privateBoard, userNoTeamMember, http.StatusOK, 1},
		{"/boards", methodPost, privateBoard, userTeamMember, http.StatusOK, 1},
	}
	runTestCases(t, ttCases, testData, clients)
}

func TestLocalPermissionsGetBoard(t *testing.T) {
	th := SetupTestHelperLocalMode(t)
	defer th.TearDown()
	clients := setupLocalClients(th)
	testData := setupData(t, th)

	ttCases := []TestCase{
		{"/boards/{PRIVATE_BOARD_ID}", methodGet, "", userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PRIVATE_BOARD_ID}", methodGet, "", userNoTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}", methodGet, "", userTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}", methodGet, "", userViewer, http.StatusOK, 1},
		{"/boards/{PRIVATE_BOARD_ID}", methodGet, "", userCommenter, http.StatusOK, 1},
		{"/boards/{PRIVATE_BOARD_ID}", methodGet, "", userEditor, http.StatusOK, 1},
		{"/boards/{PRIVATE_BOARD_ID}", methodGet, "", userAdmin, http.StatusOK, 1},

		{"/boards/{PUBLIC_BOARD_ID}", methodGet, "", userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PUBLIC_BOARD_ID}", methodGet, "", userNoTeamMember, http.StatusOK, 1},
		{"/boards/{PUBLIC_BOARD_ID}", methodGet, "", userTeamMember, http.StatusOK, 1},
		{"/boards/{PUBLIC_BOARD_ID}", methodGet, "", userViewer, http.StatusOK, 1},
		{"/boards/{PUBLIC_BOARD_ID}", methodGet, "", userCommenter, http.StatusOK, 1},
		{"/boards/{PUBLIC_BOARD_ID}", methodGet, "", userEditor, http.StatusOK, 1},
		{"/boards/{PUBLIC_BOARD_ID}", methodGet, "", userAdmin, http.StatusOK, 1},

		{"/boards/{PRIVATE_TEMPLATE_ID}", methodGet, "", userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}", methodGet, "", userNoTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}", methodGet, "", userTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}", methodGet, "", userViewer, http.StatusOK, 1},
		{"/boards/{PRIVATE_TEMPLATE_ID}", methodGet, "", userCommenter, http.StatusOK, 1},
		{"/boards/{PRIVATE_TEMPLATE_ID}", methodGet, "", userEditor, http.StatusOK, 1},
		{"/boards/{PRIVATE_TEMPLATE_ID}", methodGet, "", userAdmin, http.StatusOK, 1},

		{"/boards/{PUBLIC_TEMPLATE_ID}", methodGet, "", userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}", methodGet, "", userNoTeamMember, http.StatusOK, 1},
		{"/boards/{PUBLIC_TEMPLATE_ID}", methodGet, "", userTeamMember, http.StatusOK, 1},
		{"/boards/{PUBLIC_TEMPLATE_ID}", methodGet, "", userViewer, http.StatusOK, 1},
		{"/boards/{PUBLIC_TEMPLATE_ID}", methodGet, "", userCommenter, http.StatusOK, 1},
		{"/boards/{PUBLIC_TEMPLATE_ID}", methodGet, "", userEditor, http.StatusOK, 1},
		{"/boards/{PUBLIC_TEMPLATE_ID}", methodGet, "", userAdmin, http.StatusOK, 1},

		{"/boards/{PRIVATE_BOARD_ID}?read_token=invalid", methodGet, "", userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PRIVATE_BOARD_ID}?read_token=valid", methodGet, "", userAnon, http.StatusOK, 1},
		{"/boards/{PRIVATE_BOARD_ID}?read_token=invalid", methodGet, "", userNoTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}?read_token=valid", methodGet, "", userTeamMember, http.StatusOK, 1},
	}
	runTestCases(t, ttCases, testData, clients)
}

func TestLocalPermissionsPatchBoard(t *testing.T) {
	th := SetupTestHelperLocalMode(t)
	defer th.TearDown()
	clients := setupLocalClients(th)
	testData := setupData(t, th)

	ttCases := []TestCase{
		{"/boards/{PRIVATE_BOARD_ID}", methodPatch, "{\"title\": \"test\"}", userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PRIVATE_BOARD_ID}", methodPatch, "{\"title\": \"test\"}", userNoTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}", methodPatch, "{\"title\": \"test\"}", userTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}", methodPatch, "{\"title\": \"test\"}", userViewer, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}", methodPatch, "{\"title\": \"test\"}", userCommenter, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}", methodPatch, "{\"title\": \"test\"}", userEditor, http.StatusOK, 1},
		{"/boards/{PRIVATE_BOARD_ID}", methodPatch, "{\"title\": \"test\"}", userAdmin, http.StatusOK, 1},

		{"/boards/{PUBLIC_BOARD_ID}", methodPatch, "{\"title\": \"test\"}", userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PUBLIC_BOARD_ID}", methodPatch, "{\"title\": \"test\"}", userNoTeamMember, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_BOARD_ID}", methodPatch, "{\"title\": \"test\"}", userTeamMember, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_BOARD_ID}", methodPatch, "{\"title\": \"test\"}", userViewer, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_BOARD_ID}", methodPatch, "{\"title\": \"test\"}", userCommenter, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_BOARD_ID}", methodPatch, "{\"title\": \"test\"}", userEditor, http.StatusOK, 1},
		{"/boards/{PUBLIC_BOARD_ID}", methodPatch, "{\"title\": \"test\"}", userAdmin, http.StatusOK, 1},

		{"/boards/{PRIVATE_TEMPLATE_ID}", methodPatch, "{\"title\": \"test\"}", userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}", methodPatch, "{\"title\": \"test\"}", userNoTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}", methodPatch, "{\"title\": \"test\"}", userTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}", methodPatch, "{\"title\": \"test\"}", userViewer, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}", methodPatch, "{\"title\": \"test\"}", userCommenter, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}", methodPatch, "{\"title\": \"test\"}", userEditor, http.StatusOK, 1},
		{"/boards/{PRIVATE_TEMPLATE_ID}", methodPatch, "{\"title\": \"test\"}", userAdmin, http.StatusOK, 1},

		{"/boards/{PUBLIC_TEMPLATE_ID}", methodPatch, "{\"title\": \"test\"}", userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}", methodPatch, "{\"title\": \"test\"}", userNoTeamMember, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}", methodPatch, "{\"title\": \"test\"}", userTeamMember, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}", methodPatch, "{\"title\": \"test\"}", userViewer, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}", methodPatch, "{\"title\": \"test\"}", userCommenter, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}", methodPatch, "{\"title\": \"test\"}", userEditor, http.StatusOK, 1},
		{"/boards/{PUBLIC_TEMPLATE_ID}", methodPatch, "{\"title\": \"test\"}", userAdmin, http.StatusOK, 1},
	}
	runTestCases(t, ttCases, testData, clients)
}

func TestLocalPermissionsDeleteBoard(t *testing.T) {
	th := SetupTestHelperLocalMode(t)
	defer th.TearDown()
	clients := setupLocalClients(th)
	testData := setupData(t, th)

	ttCases := []TestCase{
		{"/boards/{PRIVATE_BOARD_ID}", methodDelete, "", userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PRIVATE_BOARD_ID}", methodDelete, "", userNoTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}", methodDelete, "", userTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}", methodDelete, "", userViewer, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}", methodDelete, "", userCommenter, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}", methodDelete, "", userEditor, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}", methodDelete, "", userAdmin, http.StatusOK, 0},

		{"/boards/{PUBLIC_BOARD_ID}", methodDelete, "", userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PUBLIC_BOARD_ID}", methodDelete, "", userNoTeamMember, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_BOARD_ID}", methodDelete, "", userTeamMember, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_BOARD_ID}", methodDelete, "", userViewer, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_BOARD_ID}", methodDelete, "", userCommenter, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_BOARD_ID}", methodDelete, "", userEditor, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_BOARD_ID}", methodDelete, "", userAdmin, http.StatusOK, 0},

		{"/boards/{PRIVATE_TEMPLATE_ID}", methodDelete, "", userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}", methodDelete, "", userNoTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}", methodDelete, "", userTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}", methodDelete, "", userViewer, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}", methodDelete, "", userCommenter, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}", methodDelete, "", userEditor, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}", methodDelete, "", userAdmin, http.StatusOK, 0},

		{"/boards/{PUBLIC_TEMPLATE_ID}", methodDelete, "", userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}", methodDelete, "", userNoTeamMember, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}", methodDelete, "", userTeamMember, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}", methodDelete, "", userViewer, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}", methodDelete, "", userCommenter, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}", methodDelete, "", userEditor, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}", methodDelete, "", userAdmin, http.StatusOK, 0},
	}
	runTestCases(t, ttCases, testData, clients)
}

func TestLocalPermissionsDuplicateBoard(t *testing.T) {
	th := SetupTestHelperLocalMode(t)
	defer th.TearDown()
	clients := setupLocalClients(th)
	testData := setupData(t, th)

	// In same team
	ttCases := []TestCase{
		{"/boards/{PRIVATE_BOARD_ID}/duplicate", methodPost, "", userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PRIVATE_BOARD_ID}/duplicate", methodPost, "", userNoTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}/duplicate", methodPost, "", userTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}/duplicate", methodPost, "", userViewer, http.StatusOK, 1},
		{"/boards/{PRIVATE_BOARD_ID}/duplicate", methodPost, "", userCommenter, http.StatusOK, 1},
		{"/boards/{PRIVATE_BOARD_ID}/duplicate", methodPost, "", userEditor, http.StatusOK, 1},
		{"/boards/{PRIVATE_BOARD_ID}/duplicate", methodPost, "", userAdmin, http.StatusOK, 1},

		{"/boards/{PUBLIC_BOARD_ID}/duplicate", methodPost, "", userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PUBLIC_BOARD_ID}/duplicate", methodPost, "", userNoTeamMember, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_BOARD_ID}/duplicate", methodPost, "", userTeamMember, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_BOARD_ID}/duplicate", methodPost, "", userViewer, http.StatusOK, 1},
		{"/boards/{PUBLIC_BOARD_ID}/duplicate", methodPost, "", userCommenter, http.StatusOK, 1},
		{"/boards/{PUBLIC_BOARD_ID}/duplicate", methodPost, "", userEditor, http.StatusOK, 1},
		{"/boards/{PUBLIC_BOARD_ID}/duplicate", methodPost, "", userAdmin, http.StatusOK, 1},

		{"/boards/{PRIVATE_TEMPLATE_ID}/duplicate", methodPost, "", userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/duplicate", methodPost, "", userNoTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/duplicate", methodPost, "", userTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/duplicate", methodPost, "", userViewer, http.StatusOK, 1},
		{"/boards/{PRIVATE_TEMPLATE_ID}/duplicate", methodPost, "", userCommenter, http.StatusOK, 1},
		{"/boards/{PRIVATE_TEMPLATE_ID}/duplicate", methodPost, "", userEditor, http.StatusOK, 1},
		{"/boards/{PRIVATE_TEMPLATE_ID}/duplicate", methodPost, "", userAdmin, http.StatusOK, 1},

		{"/boards/{PUBLIC_TEMPLATE_ID}/duplicate", methodPost, "", userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/duplicate", methodPost, "", userNoTeamMember, http.StatusOK, 1},
		{"/boards/{PUBLIC_TEMPLATE_ID}/duplicate", methodPost, "", userTeamMember, http.StatusOK, 1},
		{"/boards/{PUBLIC_TEMPLATE_ID}/duplicate", methodPost, "", userViewer, http.StatusOK, 1},
		{"/boards/{PUBLIC_TEMPLATE_ID}/duplicate", methodPost, "", userCommenter, http.StatusOK, 1},
		{"/boards/{PUBLIC_TEMPLATE_ID}/duplicate", methodPost, "", userEditor, http.StatusOK, 1},
		{"/boards/{PUBLIC_TEMPLATE_ID}/duplicate", methodPost, "", userAdmin, http.StatusOK, 1},
	}
	runTestCases(t, ttCases, testData, clients)

	// In other team
	ttCases = []TestCase{
		{"/boards/{PRIVATE_BOARD_ID}/duplicate?toTeam=other-team", methodPost, "", userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PRIVATE_BOARD_ID}/duplicate?toTeam=other-team", methodPost, "", userNoTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}/duplicate?toTeam=other-team", methodPost, "", userTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}/duplicate?toTeam=other-team", methodPost, "", userViewer, http.StatusOK, 1},
		{"/boards/{PRIVATE_BOARD_ID}/duplicate?toTeam=other-team", methodPost, "", userCommenter, http.StatusOK, 1},
		{"/boards/{PRIVATE_BOARD_ID}/duplicate?toTeam=other-team", methodPost, "", userEditor, http.StatusOK, 1},
		{"/boards/{PRIVATE_BOARD_ID}/duplicate?toTeam=other-team", methodPost, "", userAdmin, http.StatusOK, 1},

		{"/boards/{PUBLIC_BOARD_ID}/duplicate?toTeam=other-team", methodPost, "", userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PUBLIC_BOARD_ID}/duplicate?toTeam=other-team", methodPost, "", userNoTeamMember, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_BOARD_ID}/duplicate?toTeam=other-team", methodPost, "", userTeamMember, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_BOARD_ID}/duplicate?toTeam=other-team", methodPost, "", userViewer, http.StatusOK, 1},
		{"/boards/{PUBLIC_BOARD_ID}/duplicate?toTeam=other-team", methodPost, "", userCommenter, http.StatusOK, 1},
		{"/boards/{PUBLIC_BOARD_ID}/duplicate?toTeam=other-team", methodPost, "", userEditor, http.StatusOK, 1},
		{"/boards/{PUBLIC_BOARD_ID}/duplicate?toTeam=other-team", methodPost, "", userAdmin, http.StatusOK, 1},

		{"/boards/{PRIVATE_TEMPLATE_ID}/duplicate?toTeam=other-team", methodPost, "", userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/duplicate?toTeam=other-team", methodPost, "", userNoTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/duplicate?toTeam=other-team", methodPost, "", userTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/duplicate?toTeam=other-team", methodPost, "", userViewer, http.StatusOK, 1},
		{"/boards/{PRIVATE_TEMPLATE_ID}/duplicate?toTeam=other-team", methodPost, "", userCommenter, http.StatusOK, 1},
		{"/boards/{PRIVATE_TEMPLATE_ID}/duplicate?toTeam=other-team", methodPost, "", userEditor, http.StatusOK, 1},
		{"/boards/{PRIVATE_TEMPLATE_ID}/duplicate?toTeam=other-team", methodPost, "", userAdmin, http.StatusOK, 1},

		{"/boards/{PUBLIC_TEMPLATE_ID}/duplicate?toTeam=other-team", methodPost, "", userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/duplicate?toTeam=other-team", methodPost, "", userNoTeamMember, http.StatusOK, 1},
		{"/boards/{PUBLIC_TEMPLATE_ID}/duplicate?toTeam=other-team", methodPost, "", userTeamMember, http.StatusOK, 1},
		{"/boards/{PUBLIC_TEMPLATE_ID}/duplicate?toTeam=other-team", methodPost, "", userViewer, http.StatusOK, 1},
		{"/boards/{PUBLIC_TEMPLATE_ID}/duplicate?toTeam=other-team", methodPost, "", userCommenter, http.StatusOK, 1},
		{"/boards/{PUBLIC_TEMPLATE_ID}/duplicate?toTeam=other-team", methodPost, "", userEditor, http.StatusOK, 1},
		{"/boards/{PUBLIC_TEMPLATE_ID}/duplicate?toTeam=other-team", methodPost, "", userAdmin, http.StatusOK, 1},
	}
	runTestCases(t, ttCases, testData, clients)
}

func TestLocalPermissionsGetBoardBlocks(t *testing.T) {
	th := SetupTestHelperLocalMode(t)
	defer th.TearDown()
	clients := setupLocalClients(th)
	testData := setupData(t, th)

	ttCases := []TestCase{
		{"/boards/{PRIVATE_BOARD_ID}/blocks", methodGet, "", userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PRIVATE_BOARD_ID}/blocks", methodGet, "", userNoTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}/blocks", methodGet, "", userTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}/blocks", methodGet, "", userViewer, http.StatusOK, 1},
		{"/boards/{PRIVATE_BOARD_ID}/blocks", methodGet, "", userCommenter, http.StatusOK, 1},
		{"/boards/{PRIVATE_BOARD_ID}/blocks", methodGet, "", userEditor, http.StatusOK, 1},
		{"/boards/{PRIVATE_BOARD_ID}/blocks", methodGet, "", userAdmin, http.StatusOK, 1},

		{"/boards/{PUBLIC_BOARD_ID}/blocks", methodGet, "", userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PUBLIC_BOARD_ID}/blocks", methodGet, "", userNoTeamMember, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_BOARD_ID}/blocks", methodGet, "", userTeamMember, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_BOARD_ID}/blocks", methodGet, "", userViewer, http.StatusOK, 1},
		{"/boards/{PUBLIC_BOARD_ID}/blocks", methodGet, "", userCommenter, http.StatusOK, 1},
		{"/boards/{PUBLIC_BOARD_ID}/blocks", methodGet, "", userEditor, http.StatusOK, 1},
		{"/boards/{PUBLIC_BOARD_ID}/blocks", methodGet, "", userAdmin, http.StatusOK, 1},

		{"/boards/{PRIVATE_TEMPLATE_ID}/blocks", methodGet, "", userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/blocks", methodGet, "", userNoTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/blocks", methodGet, "", userTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/blocks", methodGet, "", userViewer, http.StatusOK, 1},
		{"/boards/{PRIVATE_TEMPLATE_ID}/blocks", methodGet, "", userCommenter, http.StatusOK, 1},
		{"/boards/{PRIVATE_TEMPLATE_ID}/blocks", methodGet, "", userEditor, http.StatusOK, 1},
		{"/boards/{PRIVATE_TEMPLATE_ID}/blocks", methodGet, "", userAdmin, http.StatusOK, 1},

		{"/boards/{PUBLIC_TEMPLATE_ID}/blocks", methodGet, "", userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/blocks", methodGet, "", userNoTeamMember, http.StatusOK, 1},
		{"/boards/{PUBLIC_TEMPLATE_ID}/blocks", methodGet, "", userTeamMember, http.StatusOK, 1},
		{"/boards/{PUBLIC_TEMPLATE_ID}/blocks", methodGet, "", userViewer, http.StatusOK, 1},
		{"/boards/{PUBLIC_TEMPLATE_ID}/blocks", methodGet, "", userCommenter, http.StatusOK, 1},
		{"/boards/{PUBLIC_TEMPLATE_ID}/blocks", methodGet, "", userEditor, http.StatusOK, 1},
		{"/boards/{PUBLIC_TEMPLATE_ID}/blocks", methodGet, "", userAdmin, http.StatusOK, 1},

		{"/boards/{PRIVATE_BOARD_ID}/blocks?read_token=invalid", methodGet, "", userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PRIVATE_BOARD_ID}/blocks?read_token=valid", methodGet, "", userAnon, http.StatusOK, 1},
		{"/boards/{PRIVATE_BOARD_ID}/blocks?read_token=invalid", methodGet, "", userNoTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}/blocks?read_token=valid", methodGet, "", userTeamMember, http.StatusOK, 1},
	}
	runTestCases(t, ttCases, testData, clients)
}

func TestLocalPermissionsCreateBoardBlocks(t *testing.T) {
	th := SetupTestHelperLocalMode(t)
	defer th.TearDown()
	clients := setupLocalClients(th)
	testData := setupData(t, th)

	counter := 0
	newBlockJSON := func(boardID string) string {
		counter++
		return toJSON(t, []*model.Block{{
			ID:       fmt.Sprintf("%d", counter),
			Title:    "Board To Create",
			BoardID:  boardID,
			Type:     "card",
			CreateAt: model.GetMillis(),
			UpdateAt: model.GetMillis(),
		}})
	}

	ttCases := []TestCase{
		{"/boards/{PRIVATE_BOARD_ID}/blocks", methodPost, newBlockJSON(testData.privateBoard.ID), userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PRIVATE_BOARD_ID}/blocks", methodPost, newBlockJSON(testData.privateBoard.ID), userNoTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}/blocks", methodPost, newBlockJSON(testData.privateBoard.ID), userTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}/blocks", methodPost, newBlockJSON(testData.privateBoard.ID), userViewer, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}/blocks", methodPost, newBlockJSON(testData.privateBoard.ID), userCommenter, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}/blocks", methodPost, newBlockJSON(testData.privateBoard.ID), userEditor, http.StatusOK, 1},
		{"/boards/{PRIVATE_BOARD_ID}/blocks", methodPost, newBlockJSON(testData.privateBoard.ID), userAdmin, http.StatusOK, 1},

		{"/boards/{PUBLIC_BOARD_ID}/blocks", methodPost, newBlockJSON(testData.publicBoard.ID), userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PUBLIC_BOARD_ID}/blocks", methodPost, newBlockJSON(testData.publicBoard.ID), userNoTeamMember, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_BOARD_ID}/blocks", methodPost, newBlockJSON(testData.publicBoard.ID), userTeamMember, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_BOARD_ID}/blocks", methodPost, newBlockJSON(testData.publicBoard.ID), userViewer, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_BOARD_ID}/blocks", methodPost, newBlockJSON(testData.publicBoard.ID), userCommenter, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_BOARD_ID}/blocks", methodPost, newBlockJSON(testData.publicBoard.ID), userEditor, http.StatusOK, 1},
		{"/boards/{PUBLIC_BOARD_ID}/blocks", methodPost, newBlockJSON(testData.publicBoard.ID), userAdmin, http.StatusOK, 1},

		{"/boards/{PRIVATE_TEMPLATE_ID}/blocks", methodPost, newBlockJSON(testData.privateTemplate.ID), userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/blocks", methodPost, newBlockJSON(testData.privateTemplate.ID), userNoTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/blocks", methodPost, newBlockJSON(testData.privateTemplate.ID), userTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/blocks", methodPost, newBlockJSON(testData.privateTemplate.ID), userViewer, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/blocks", methodPost, newBlockJSON(testData.privateTemplate.ID), userCommenter, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/blocks", methodPost, newBlockJSON(testData.privateTemplate.ID), userEditor, http.StatusOK, 1},
		{"/boards/{PRIVATE_TEMPLATE_ID}/blocks", methodPost, newBlockJSON(testData.privateTemplate.ID), userAdmin, http.StatusOK, 1},

		{"/boards/{PUBLIC_TEMPLATE_ID}/blocks", methodPost, newBlockJSON(testData.publicTemplate.ID), userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/blocks", methodPost, newBlockJSON(testData.publicTemplate.ID), userNoTeamMember, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/blocks", methodPost, newBlockJSON(testData.publicTemplate.ID), userTeamMember, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/blocks", methodPost, newBlockJSON(testData.publicTemplate.ID), userViewer, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/blocks", methodPost, newBlockJSON(testData.publicTemplate.ID), userCommenter, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/blocks", methodPost, newBlockJSON(testData.publicTemplate.ID), userEditor, http.StatusOK, 1},
		{"/boards/{PUBLIC_TEMPLATE_ID}/blocks", methodPost, newBlockJSON(testData.publicTemplate.ID), userAdmin, http.StatusOK, 1},
	}
	runTestCases(t, ttCases, testData, clients)
}

func TestLocalPermissionsPatchBoardBlocks(t *testing.T) {
	th := SetupTestHelperLocalMode(t)
	defer th.TearDown()
	clients := setupLocalClients(th)
	testData := setupData(t, th)

	counter := 0
	newBlocksPatchJSON := func(blockID string) string {
		counter++
		newTitle := "New Patch Block Title"
		return toJSON(t, model.BlockPatchBatch{
			BlockIDs: []string{blockID},
			BlockPatches: []model.BlockPatch{
				{Title: &newTitle},
			},
		})
	}

	ttCases := []TestCase{
		{"/boards/{PRIVATE_BOARD_ID}/blocks", methodPatch, newBlocksPatchJSON("block-4"), userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PRIVATE_BOARD_ID}/blocks", methodPatch, newBlocksPatchJSON("block-4"), userNoTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}/blocks", methodPatch, newBlocksPatchJSON("block-4"), userTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}/blocks", methodPatch, newBlocksPatchJSON("block-4"), userViewer, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}/blocks", methodPatch, newBlocksPatchJSON("block-4"), userCommenter, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}/blocks", methodPatch, newBlocksPatchJSON("block-4"), userEditor, http.StatusOK, 0},
		{"/boards/{PRIVATE_BOARD_ID}/blocks", methodPatch, newBlocksPatchJSON("block-4"), userAdmin, http.StatusOK, 0},

		{"/boards/{PUBLIC_BOARD_ID}/blocks", methodPatch, newBlocksPatchJSON("block-3"), userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PUBLIC_BOARD_ID}/blocks", methodPatch, newBlocksPatchJSON("block-3"), userNoTeamMember, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_BOARD_ID}/blocks", methodPatch, newBlocksPatchJSON("block-3"), userTeamMember, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_BOARD_ID}/blocks", methodPatch, newBlocksPatchJSON("block-3"), userViewer, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_BOARD_ID}/blocks", methodPatch, newBlocksPatchJSON("block-3"), userCommenter, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_BOARD_ID}/blocks", methodPatch, newBlocksPatchJSON("block-3"), userEditor, http.StatusOK, 0},
		{"/boards/{PUBLIC_BOARD_ID}/blocks", methodPatch, newBlocksPatchJSON("block-3"), userAdmin, http.StatusOK, 0},

		{"/boards/{PRIVATE_TEMPLATE_ID}/blocks", methodPatch, newBlocksPatchJSON("block-2"), userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/blocks", methodPatch, newBlocksPatchJSON("block-2"), userNoTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/blocks", methodPatch, newBlocksPatchJSON("block-2"), userTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/blocks", methodPatch, newBlocksPatchJSON("block-2"), userViewer, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/blocks", methodPatch, newBlocksPatchJSON("block-2"), userCommenter, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/blocks", methodPatch, newBlocksPatchJSON("block-2"), userEditor, http.StatusOK, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/blocks", methodPatch, newBlocksPatchJSON("block-2"), userAdmin, http.StatusOK, 0},

		{"/boards/{PUBLIC_TEMPLATE_ID}/blocks", methodPatch, newBlocksPatchJSON("block-1"), userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/blocks", methodPatch, newBlocksPatchJSON("block-1"), userNoTeamMember, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/blocks", methodPatch, newBlocksPatchJSON("block-1"), userTeamMember, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/blocks", methodPatch, newBlocksPatchJSON("block-1"), userViewer, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/blocks", methodPatch, newBlocksPatchJSON("block-1"), userCommenter, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/blocks", methodPatch, newBlocksPatchJSON("block-1"), userEditor, http.StatusOK, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/blocks", methodPatch, newBlocksPatchJSON("block-1"), userAdmin, http.StatusOK, 0},
	}
	runTestCases(t, ttCases, testData, clients)
}

func TestLocalPermissionsPatchBoardBlock(t *testing.T) {
	th := SetupTestHelperLocalMode(t)
	defer th.TearDown()
	clients := setupLocalClients(th)
	testData := setupData(t, th)

	newTitle := "New Patch Title"
	patchJSON := toJSON(t, model.BlockPatch{Title: &newTitle})

	ttCases := []TestCase{
		{"/boards/{PRIVATE_BOARD_ID}/blocks/block-4", methodPatch, patchJSON, userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PRIVATE_BOARD_ID}/blocks/block-4", methodPatch, patchJSON, userNoTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}/blocks/block-4", methodPatch, patchJSON, userTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}/blocks/block-4", methodPatch, patchJSON, userViewer, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}/blocks/block-4", methodPatch, patchJSON, userCommenter, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}/blocks/block-4", methodPatch, patchJSON, userEditor, http.StatusOK, 0},
		{"/boards/{PRIVATE_BOARD_ID}/blocks/block-4", methodPatch, patchJSON, userAdmin, http.StatusOK, 0},

		{"/boards/{PUBLIC_BOARD_ID}/blocks/block-3", methodPatch, patchJSON, userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PUBLIC_BOARD_ID}/blocks/block-3", methodPatch, patchJSON, userNoTeamMember, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_BOARD_ID}/blocks/block-3", methodPatch, patchJSON, userTeamMember, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_BOARD_ID}/blocks/block-3", methodPatch, patchJSON, userViewer, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_BOARD_ID}/blocks/block-3", methodPatch, patchJSON, userCommenter, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_BOARD_ID}/blocks/block-3", methodPatch, patchJSON, userEditor, http.StatusOK, 0},
		{"/boards/{PUBLIC_BOARD_ID}/blocks/block-3", methodPatch, patchJSON, userAdmin, http.StatusOK, 0},

		{"/boards/{PRIVATE_TEMPLATE_ID}/blocks/block-2", methodPatch, patchJSON, userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/blocks/block-2", methodPatch, patchJSON, userNoTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/blocks/block-2", methodPatch, patchJSON, userTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/blocks/block-2", methodPatch, patchJSON, userViewer, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/blocks/block-2", methodPatch, patchJSON, userCommenter, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/blocks/block-2", methodPatch, patchJSON, userEditor, http.StatusOK, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/blocks/block-2", methodPatch, patchJSON, userAdmin, http.StatusOK, 0},

		{"/boards/{PUBLIC_TEMPLATE_ID}/blocks/block-1", methodPatch, patchJSON, userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/blocks/block-1", methodPatch, patchJSON, userNoTeamMember, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/blocks/block-1", methodPatch, patchJSON, userTeamMember, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/blocks/block-1", methodPatch, patchJSON, userViewer, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/blocks/block-1", methodPatch, patchJSON, userCommenter, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/blocks/block-1", methodPatch, patchJSON, userEditor, http.StatusOK, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/blocks/block-1", methodPatch, patchJSON, userAdmin, http.StatusOK, 0},

		// Invalid boardID/blockID combination
		{"/boards/{PUBLIC_TEMPLATE_ID}/blocks/block-3", methodPatch, patchJSON, userAdmin, http.StatusNotFound, 0},
	}
	runTestCases(t, ttCases, testData, clients)
}

func TestLocalPermissionsDeleteBoardBlock(t *testing.T) {
	th := SetupTestHelperLocalMode(t)
	defer th.TearDown()
	clients := setupLocalClients(th)
	testData := setupData(t, th)

	err := th.Server.App().InsertBlock(model.Block{ID: "block-5", Title: "Test", Type: "card", BoardID: testData.publicTemplate.ID}, userAdmin)
	require.NoError(t, err)
	err = th.Server.App().InsertBlock(model.Block{ID: "block-6", Title: "Test", Type: "card", BoardID: testData.privateTemplate.ID}, userAdmin)
	require.NoError(t, err)
	err = th.Server.App().InsertBlock(model.Block{ID: "block-7", Title: "Test", Type: "card", BoardID: testData.publicBoard.ID}, userAdmin)
	require.NoError(t, err)
	err = th.Server.App().InsertBlock(model.Block{ID: "block-8", Title: "Test", Type: "card", BoardID: testData.privateBoard.ID}, userAdmin)
	require.NoError(t, err)

	ttCases := []TestCase{
		{"/boards/{PRIVATE_BOARD_ID}/blocks/block-4", methodDelete, "", userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PRIVATE_BOARD_ID}/blocks/block-4", methodDelete, "", userNoTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}/blocks/block-4", methodDelete, "", userTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}/blocks/block-4", methodDelete, "", userViewer, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}/blocks/block-4", methodDelete, "", userCommenter, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}/blocks/block-4", methodDelete, "", userEditor, http.StatusOK, 0},
		{"/boards/{PRIVATE_BOARD_ID}/blocks/block-8", methodDelete, "", userAdmin, http.StatusOK, 0},

		{"/boards/{PUBLIC_BOARD_ID}/blocks/block-3", methodDelete, "", userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PUBLIC_BOARD_ID}/blocks/block-3", methodDelete, "", userNoTeamMember, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_BOARD_ID}/blocks/block-3", methodDelete, "", userTeamMember, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_BOARD_ID}/blocks/block-3", methodDelete, "", userViewer, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_BOARD_ID}/blocks/block-3", methodDelete, "", userCommenter, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_BOARD_ID}/blocks/block-3", methodDelete, "", userEditor, http.StatusOK, 0},
		{"/boards/{PUBLIC_BOARD_ID}/blocks/block-7", methodDelete, "", userAdmin, http.StatusOK, 0},

		{"/boards/{PRIVATE_TEMPLATE_ID}/blocks/block-2", methodDelete, "", userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/blocks/block-2", methodDelete, "", userNoTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/blocks/block-2", methodDelete, "", userTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/blocks/block-2", methodDelete, "", userViewer, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/blocks/block-2", methodDelete, "", userCommenter, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/blocks/block-2", methodDelete, "", userEditor, http.StatusOK, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/blocks/block-6", methodDelete, "", userAdmin, http.StatusOK, 0},

		{"/boards/{PUBLIC_TEMPLATE_ID}/blocks/block-1", methodDelete, "", userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/blocks/block-1", methodDelete, "", userNoTeamMember, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/blocks/block-1", methodDelete, "", userTeamMember, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/blocks/block-1", methodDelete, "", userViewer, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/blocks/block-1", methodDelete, "", userCommenter, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/blocks/block-1", methodDelete, "", userEditor, http.StatusOK, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/blocks/block-5", methodDelete, "", userAdmin, http.StatusOK, 0},

		// Invalid boardID/blockID combination
		{"/boards/{PUBLIC_TEMPLATE_ID}/blocks/block-3", methodDelete, "", userAdmin, http.StatusNotFound, 0},
	}
	runTestCases(t, ttCases, testData, clients)
}

func TestLocalPermissionsUndeleteBoardBlock(t *testing.T) {
	th := SetupTestHelperLocalMode(t)
	defer th.TearDown()
	clients := setupLocalClients(th)
	testData := setupData(t, th)

	err := th.Server.App().InsertBlock(model.Block{ID: "block-5", Title: "Test", Type: "card", BoardID: testData.publicTemplate.ID}, userAdmin)
	require.NoError(t, err)
	err = th.Server.App().InsertBlock(model.Block{ID: "block-6", Title: "Test", Type: "card", BoardID: testData.privateTemplate.ID}, userAdmin)
	require.NoError(t, err)
	err = th.Server.App().InsertBlock(model.Block{ID: "block-7", Title: "Test", Type: "card", BoardID: testData.publicBoard.ID}, userAdmin)
	require.NoError(t, err)
	err = th.Server.App().InsertBlock(model.Block{ID: "block-8", Title: "Test", Type: "card", BoardID: testData.privateBoard.ID}, userAdmin)
	require.NoError(t, err)
	err = th.Server.App().DeleteBlock("block-1", userAdmin)
	require.NoError(t, err)
	err = th.Server.App().DeleteBlock("block-2", userAdmin)
	require.NoError(t, err)
	err = th.Server.App().DeleteBlock("block-3", userAdmin)
	require.NoError(t, err)
	err = th.Server.App().DeleteBlock("block-4", userAdmin)
	require.NoError(t, err)
	err = th.Server.App().DeleteBlock("block-5", userAdmin)
	require.NoError(t, err)
	err = th.Server.App().DeleteBlock("block-6", userAdmin)
	require.NoError(t, err)
	err = th.Server.App().DeleteBlock("block-7", userAdmin)
	require.NoError(t, err)
	err = th.Server.App().DeleteBlock("block-8", userAdmin)
	require.NoError(t, err)

	ttCases := []TestCase{
		{"/boards/{PRIVATE_BOARD_ID}/blocks/block-4/undelete", methodPost, "", userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PRIVATE_BOARD_ID}/blocks/block-4/undelete", methodPost, "", userNoTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}/blocks/block-4/undelete", methodPost, "", userTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}/blocks/block-4/undelete", methodPost, "", userViewer, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}/blocks/block-4/undelete", methodPost, "", userCommenter, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}/blocks/block-4/undelete", methodPost, "", userEditor, http.StatusOK, 1},
		{"/boards/{PRIVATE_BOARD_ID}/blocks/block-8/undelete", methodPost, "", userAdmin, http.StatusOK, 1},

		{"/boards/{PUBLIC_BOARD_ID}/blocks/block-3/undelete", methodPost, "", userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PUBLIC_BOARD_ID}/blocks/block-3/undelete", methodPost, "", userNoTeamMember, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_BOARD_ID}/blocks/block-3/undelete", methodPost, "", userTeamMember, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_BOARD_ID}/blocks/block-3/undelete", methodPost, "", userViewer, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_BOARD_ID}/blocks/block-3/undelete", methodPost, "", userCommenter, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_BOARD_ID}/blocks/block-3/undelete", methodPost, "", userEditor, http.StatusOK, 1},
		{"/boards/{PUBLIC_BOARD_ID}/blocks/block-7/undelete", methodPost, "", userAdmin, http.StatusOK, 1},

		{"/boards/{PRIVATE_TEMPLATE_ID}/blocks/block-2/undelete", methodPost, "", userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/blocks/block-2/undelete", methodPost, "", userNoTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/blocks/block-2/undelete", methodPost, "", userTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/blocks/block-2/undelete", methodPost, "", userViewer, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/blocks/block-2/undelete", methodPost, "", userCommenter, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/blocks/block-2/undelete", methodPost, "", userEditor, http.StatusOK, 1},
		{"/boards/{PRIVATE_TEMPLATE_ID}/blocks/block-6/undelete", methodPost, "", userAdmin, http.StatusOK, 1},

		{"/boards/{PUBLIC_TEMPLATE_ID}/blocks/block-1/undelete", methodPost, "", userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/blocks/block-1/undelete", methodPost, "", userNoTeamMember, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/blocks/block-1/undelete", methodPost, "", userTeamMember, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/blocks/block-1/undelete", methodPost, "", userViewer, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/blocks/block-1/undelete", methodPost, "", userCommenter, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/blocks/block-1/undelete", methodPost, "", userEditor, http.StatusOK, 1},
		{"/boards/{PUBLIC_TEMPLATE_ID}/blocks/block-5/undelete", methodPost, "", userAdmin, http.StatusOK, 1},

		// Invalid boardID/blockID combination
		{"/boards/{PUBLIC_TEMPLATE_ID}/blocks/block-3/undelete", methodPost, "", userAdmin, http.StatusNotFound, 0},
	}
	runTestCases(t, ttCases, testData, clients)
}

func TestLocalPermissionsUndeleteBoard(t *testing.T) {
	th := SetupTestHelperLocalMode(t)
	defer th.TearDown()
	clients := setupLocalClients(th)
	testData := setupData(t, th)

	err := th.Server.App().DeleteBoard(testData.publicBoard.ID, userAdmin)
	require.NoError(t, err)
	err = th.Server.App().DeleteBoard(testData.privateBoard.ID, userAdmin)
	require.NoError(t, err)
	err = th.Server.App().DeleteBoard(testData.publicTemplate.ID, userAdmin)
	require.NoError(t, err)
	err = th.Server.App().DeleteBoard(testData.privateTemplate.ID, userAdmin)
	require.NoError(t, err)

	ttCases := []TestCase{
		{"/boards/{PRIVATE_BOARD_ID}/undelete", methodPost, "", userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PRIVATE_BOARD_ID}/undelete", methodPost, "", userNoTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}/undelete", methodPost, "", userTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}/undelete", methodPost, "", userViewer, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}/undelete", methodPost, "", userCommenter, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}/undelete", methodPost, "", userEditor, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}/undelete", methodPost, "", userAdmin, http.StatusOK, 0},

		{"/boards/{PUBLIC_BOARD_ID}/undelete", methodPost, "", userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PUBLIC_BOARD_ID}/undelete", methodPost, "", userNoTeamMember, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_BOARD_ID}/undelete", methodPost, "", userTeamMember, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_BOARD_ID}/undelete", methodPost, "", userViewer, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_BOARD_ID}/undelete", methodPost, "", userCommenter, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_BOARD_ID}/undelete", methodPost, "", userEditor, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_BOARD_ID}/undelete", methodPost, "", userAdmin, http.StatusOK, 0},

		{"/boards/{PRIVATE_TEMPLATE_ID}/undelete", methodPost, "", userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/undelete", methodPost, "", userNoTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/undelete", methodPost, "", userTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/undelete", methodPost, "", userViewer, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/undelete", methodPost, "", userCommenter, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/undelete", methodPost, "", userEditor, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/undelete", methodPost, "", userAdmin, http.StatusOK, 0},

		{"/boards/{PUBLIC_TEMPLATE_ID}/undelete", methodPost, "", userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/undelete", methodPost, "", userNoTeamMember, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/undelete", methodPost, "", userTeamMember, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/undelete", methodPost, "", userViewer, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/undelete", methodPost, "", userCommenter, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/undelete", methodPost, "", userEditor, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/undelete", methodPost, "", userAdmin, http.StatusOK, 0},
	}
	runTestCases(t, ttCases, testData, clients)
}

func TestLocalPermissionsDuplicateBoardBlock(t *testing.T) {
	th := SetupTestHelperLocalMode(t)
	defer th.TearDown()
	clients := setupLocalClients(th)
	testData := setupData(t, th)

	err := th.Server.App().InsertBlock(model.Block{ID: "block-5", Title: "Test", Type: "card", BoardID: testData.publicTemplate.ID}, userAdmin)
	require.NoError(t, err)
	err = th.Server.App().InsertBlock(model.Block{ID: "block-6", Title: "Test", Type: "card", BoardID: testData.privateTemplate.ID}, userAdmin)
	require.NoError(t, err)
	err = th.Server.App().InsertBlock(model.Block{ID: "block-7", Title: "Test", Type: "card", BoardID: testData.publicBoard.ID}, userAdmin)
	require.NoError(t, err)
	err = th.Server.App().InsertBlock(model.Block{ID: "block-8", Title: "Test", Type: "card", BoardID: testData.privateBoard.ID}, userAdmin)
	require.NoError(t, err)

	ttCases := []TestCase{
		{"/boards/{PRIVATE_BOARD_ID}/blocks/block-4/duplicate", methodPost, "", userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PRIVATE_BOARD_ID}/blocks/block-4/duplicate", methodPost, "", userNoTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}/blocks/block-4/duplicate", methodPost, "", userTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}/blocks/block-4/duplicate", methodPost, "", userViewer, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}/blocks/block-4/duplicate", methodPost, "", userCommenter, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}/blocks/block-4/duplicate", methodPost, "", userEditor, http.StatusOK, 1},
		{"/boards/{PRIVATE_BOARD_ID}/blocks/block-4/duplicate", methodPost, "", userAdmin, http.StatusOK, 1},

		{"/boards/{PUBLIC_BOARD_ID}/blocks/block-3/duplicate", methodPost, "", userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PUBLIC_BOARD_ID}/blocks/block-3/duplicate", methodPost, "", userNoTeamMember, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_BOARD_ID}/blocks/block-3/duplicate", methodPost, "", userTeamMember, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_BOARD_ID}/blocks/block-3/duplicate", methodPost, "", userViewer, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_BOARD_ID}/blocks/block-3/duplicate", methodPost, "", userCommenter, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_BOARD_ID}/blocks/block-3/duplicate", methodPost, "", userEditor, http.StatusOK, 1},
		{"/boards/{PUBLIC_BOARD_ID}/blocks/block-3/duplicate", methodPost, "", userAdmin, http.StatusOK, 1},

		{"/boards/{PRIVATE_TEMPLATE_ID}/blocks/block-2/duplicate", methodPost, "", userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/blocks/block-2/duplicate", methodPost, "", userNoTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/blocks/block-2/duplicate", methodPost, "", userTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/blocks/block-2/duplicate", methodPost, "", userViewer, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/blocks/block-2/duplicate", methodPost, "", userCommenter, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/blocks/block-2/duplicate", methodPost, "", userEditor, http.StatusOK, 1},
		{"/boards/{PRIVATE_TEMPLATE_ID}/blocks/block-2/duplicate", methodPost, "", userAdmin, http.StatusOK, 1},

		{"/boards/{PUBLIC_TEMPLATE_ID}/blocks/block-1/duplicate", methodPost, "", userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/blocks/block-1/duplicate", methodPost, "", userNoTeamMember, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/blocks/block-1/duplicate", methodPost, "", userTeamMember, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/blocks/block-1/duplicate", methodPost, "", userViewer, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/blocks/block-1/duplicate", methodPost, "", userCommenter, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/blocks/block-1/duplicate", methodPost, "", userEditor, http.StatusOK, 1},
		{"/boards/{PUBLIC_TEMPLATE_ID}/blocks/block-1/duplicate", methodPost, "", userAdmin, http.StatusOK, 1},

		// Invalid boardID/blockID combination
		{"/boards/{PUBLIC_TEMPLATE_ID}/blocks/block-3/duplicate", methodPost, "", userAdmin, http.StatusNotFound, 0},
	}
	runTestCases(t, ttCases, testData, clients)
}

func TestLocalPermissionsGetBoardMembers(t *testing.T) {
	th := SetupTestHelperLocalMode(t)
	defer th.TearDown()
	clients := setupLocalClients(th)
	testData := setupData(t, th)

	ttCases := []TestCase{
		{"/boards/{PRIVATE_BOARD_ID}/members", methodGet, "", userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PRIVATE_BOARD_ID}/members", methodGet, "", userNoTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}/members", methodGet, "", userTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}/members", methodGet, "", userViewer, http.StatusOK, 4},
		{"/boards/{PRIVATE_BOARD_ID}/members", methodGet, "", userCommenter, http.StatusOK, 4},
		{"/boards/{PRIVATE_BOARD_ID}/members", methodGet, "", userEditor, http.StatusOK, 4},
		{"/boards/{PRIVATE_BOARD_ID}/members", methodGet, "", userAdmin, http.StatusOK, 4},

		{"/boards/{PUBLIC_BOARD_ID}/members", methodGet, "", userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PUBLIC_BOARD_ID}/members", methodGet, "", userNoTeamMember, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_BOARD_ID}/members", methodGet, "", userTeamMember, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_BOARD_ID}/members", methodGet, "", userViewer, http.StatusOK, 4},
		{"/boards/{PUBLIC_BOARD_ID}/members", methodGet, "", userCommenter, http.StatusOK, 4},
		{"/boards/{PUBLIC_BOARD_ID}/members", methodGet, "", userEditor, http.StatusOK, 4},
		{"/boards/{PUBLIC_BOARD_ID}/members", methodGet, "", userAdmin, http.StatusOK, 4},

		{"/boards/{PRIVATE_TEMPLATE_ID}/members", methodGet, "", userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/members", methodGet, "", userNoTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/members", methodGet, "", userTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/members", methodGet, "", userViewer, http.StatusOK, 4},
		{"/boards/{PRIVATE_TEMPLATE_ID}/members", methodGet, "", userCommenter, http.StatusOK, 4},
		{"/boards/{PRIVATE_TEMPLATE_ID}/members", methodGet, "", userEditor, http.StatusOK, 4},
		{"/boards/{PRIVATE_TEMPLATE_ID}/members", methodGet, "", userAdmin, http.StatusOK, 4},

		{"/boards/{PUBLIC_TEMPLATE_ID}/members", methodGet, "", userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/members", methodGet, "", userNoTeamMember, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/members", methodGet, "", userTeamMember, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/members", methodGet, "", userViewer, http.StatusOK, 4},
		{"/boards/{PUBLIC_TEMPLATE_ID}/members", methodGet, "", userCommenter, http.StatusOK, 4},
		{"/boards/{PUBLIC_TEMPLATE_ID}/members", methodGet, "", userEditor, http.StatusOK, 4},
		{"/boards/{PUBLIC_TEMPLATE_ID}/members", methodGet, "", userAdmin, http.StatusOK, 4},
	}
	runTestCases(t, ttCases, testData, clients)
}

func TestLocalPermissionsCreateBoardMembers(t *testing.T) {
	th := SetupTestHelperLocalMode(t)
	defer th.TearDown()
	clients := setupLocalClients(th)
	testData := setupData(t, th)

	boardMemberJSON := func(boardID string) string {
		return toJSON(t, model.BoardMember{
			BoardID:      boardID,
			UserID:       userTeamMember,
			SchemeEditor: true,
		})
	}

	ttCases := []TestCase{
		{"/boards/{PRIVATE_BOARD_ID}/members", methodPost, boardMemberJSON(testData.privateBoard.ID), userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PRIVATE_BOARD_ID}/members", methodPost, boardMemberJSON(testData.privateBoard.ID), userNoTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}/members", methodPost, boardMemberJSON(testData.privateBoard.ID), userTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}/members", methodPost, boardMemberJSON(testData.privateBoard.ID), userViewer, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}/members", methodPost, boardMemberJSON(testData.privateBoard.ID), userCommenter, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}/members", methodPost, boardMemberJSON(testData.privateBoard.ID), userEditor, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}/members", methodPost, boardMemberJSON(testData.privateBoard.ID), userAdmin, http.StatusOK, 1},

		{"/boards/{PUBLIC_BOARD_ID}/members", methodPost, boardMemberJSON(testData.publicBoard.ID), userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PUBLIC_BOARD_ID}/members", methodPost, boardMemberJSON(testData.publicBoard.ID), userNoTeamMember, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_BOARD_ID}/members", methodPost, boardMemberJSON(testData.publicBoard.ID), userTeamMember, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_BOARD_ID}/members", methodPost, boardMemberJSON(testData.publicBoard.ID), userViewer, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_BOARD_ID}/members", methodPost, boardMemberJSON(testData.publicBoard.ID), userCommenter, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_BOARD_ID}/members", methodPost, boardMemberJSON(testData.publicBoard.ID), userEditor, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_BOARD_ID}/members", methodPost, boardMemberJSON(testData.publicBoard.ID), userAdmin, http.StatusOK, 1},

		{"/boards/{PRIVATE_TEMPLATE_ID}/members", methodPost, boardMemberJSON(testData.privateTemplate.ID), userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/members", methodPost, boardMemberJSON(testData.privateTemplate.ID), userNoTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/members", methodPost, boardMemberJSON(testData.privateTemplate.ID), userTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/members", methodPost, boardMemberJSON(testData.privateTemplate.ID), userViewer, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/members", methodPost, boardMemberJSON(testData.privateTemplate.ID), userCommenter, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/members", methodPost, boardMemberJSON(testData.privateTemplate.ID), userEditor, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/members", methodPost, boardMemberJSON(testData.privateTemplate.ID), userAdmin, http.StatusOK, 1},

		{"/boards/{PUBLIC_TEMPLATE_ID}/members", methodPost, boardMemberJSON(testData.publicTemplate.ID), userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/members", methodPost, boardMemberJSON(testData.publicTemplate.ID), userNoTeamMember, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/members", methodPost, boardMemberJSON(testData.publicTemplate.ID), userTeamMember, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/members", methodPost, boardMemberJSON(testData.publicTemplate.ID), userViewer, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/members", methodPost, boardMemberJSON(testData.publicTemplate.ID), userCommenter, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/members", methodPost, boardMemberJSON(testData.publicTemplate.ID), userEditor, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/members", methodPost, boardMemberJSON(testData.publicTemplate.ID), userAdmin, http.StatusOK, 1},
	}
	runTestCases(t, ttCases, testData, clients)
}

func TestLocalPermissionsUpdateBoardMember(t *testing.T) {
	th := SetupTestHelperLocalMode(t)
	defer th.TearDown()
	clients := setupLocalClients(th)
	testData := setupData(t, th)

	boardMemberJSON := func(boardID string) string {
		return toJSON(t, model.BoardMember{
			BoardID:      boardID,
			UserID:       userTeamMember,
			SchemeEditor: false,
			SchemeViewer: true,
		})
	}

	ttCases := []TestCase{
		{"/boards/{PRIVATE_BOARD_ID}/members/{USER_VIEWER_ID}", methodPut, boardMemberJSON(testData.privateBoard.ID), userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PRIVATE_BOARD_ID}/members/{USER_VIEWER_ID}", methodPut, boardMemberJSON(testData.privateBoard.ID), userNoTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}/members/{USER_VIEWER_ID}", methodPut, boardMemberJSON(testData.privateBoard.ID), userTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}/members/{USER_VIEWER_ID}", methodPut, boardMemberJSON(testData.privateBoard.ID), userViewer, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}/members/{USER_VIEWER_ID}", methodPut, boardMemberJSON(testData.privateBoard.ID), userCommenter, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}/members/{USER_VIEWER_ID}", methodPut, boardMemberJSON(testData.privateBoard.ID), userEditor, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}/members/{USER_VIEWER_ID}", methodPut, boardMemberJSON(testData.privateBoard.ID), userAdmin, http.StatusOK, 1},

		{"/boards/{PUBLIC_BOARD_ID}/members/{USER_VIEWER_ID}", methodPut, boardMemberJSON(testData.publicBoard.ID), userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PUBLIC_BOARD_ID}/members/{USER_VIEWER_ID}", methodPut, boardMemberJSON(testData.publicBoard.ID), userNoTeamMember, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_BOARD_ID}/members/{USER_VIEWER_ID}", methodPut, boardMemberJSON(testData.publicBoard.ID), userTeamMember, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_BOARD_ID}/members/{USER_VIEWER_ID}", methodPut, boardMemberJSON(testData.publicBoard.ID), userViewer, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_BOARD_ID}/members/{USER_VIEWER_ID}", methodPut, boardMemberJSON(testData.publicBoard.ID), userCommenter, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_BOARD_ID}/members/{USER_VIEWER_ID}", methodPut, boardMemberJSON(testData.publicBoard.ID), userEditor, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_BOARD_ID}/members/{USER_VIEWER_ID}", methodPut, boardMemberJSON(testData.publicBoard.ID), userAdmin, http.StatusOK, 1},

		{"/boards/{PRIVATE_TEMPLATE_ID}/members/{USER_VIEWER_ID}", methodPut, boardMemberJSON(testData.privateTemplate.ID), userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/members/{USER_VIEWER_ID}", methodPut, boardMemberJSON(testData.privateTemplate.ID), userNoTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/members/{USER_VIEWER_ID}", methodPut, boardMemberJSON(testData.privateTemplate.ID), userTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/members/{USER_VIEWER_ID}", methodPut, boardMemberJSON(testData.privateTemplate.ID), userViewer, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/members/{USER_VIEWER_ID}", methodPut, boardMemberJSON(testData.privateTemplate.ID), userCommenter, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/members/{USER_VIEWER_ID}", methodPut, boardMemberJSON(testData.privateTemplate.ID), userEditor, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/members/{USER_VIEWER_ID}", methodPut, boardMemberJSON(testData.privateTemplate.ID), userAdmin, http.StatusOK, 1},

		{"/boards/{PUBLIC_TEMPLATE_ID}/members/{USER_VIEWER_ID}", methodPut, boardMemberJSON(testData.publicTemplate.ID), userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/members/{USER_VIEWER_ID}", methodPut, boardMemberJSON(testData.publicTemplate.ID), userNoTeamMember, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/members/{USER_VIEWER_ID}", methodPut, boardMemberJSON(testData.publicTemplate.ID), userTeamMember, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/members/{USER_VIEWER_ID}", methodPut, boardMemberJSON(testData.publicTemplate.ID), userViewer, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/members/{USER_VIEWER_ID}", methodPut, boardMemberJSON(testData.publicTemplate.ID), userCommenter, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/members/{USER_VIEWER_ID}", methodPut, boardMemberJSON(testData.publicTemplate.ID), userEditor, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/members/{USER_VIEWER_ID}", methodPut, boardMemberJSON(testData.publicTemplate.ID), userAdmin, http.StatusOK, 1},

		// Invalid boardID/memberID combination
		{"/boards/{PUBLIC_TEMPLATE_ID}/members/{USER_TEAM_MEMBER_ID}", methodPut, "", userAdmin, http.StatusBadRequest, 0},

		// Invalid boardID
		{"/boards/invalid/members/{USER_VIEWER_ID}", methodPut, "", userAdmin, http.StatusBadRequest, 0},

		// Invalid memberID
		{"/boards/{PUBLIC_TEMPLATE_ID}/members/invalid", methodPut, "", userAdmin, http.StatusBadRequest, 0},
	}
	runTestCases(t, ttCases, testData, clients)
}

func TestLocalPermissionsDeleteBoardMember(t *testing.T) {
	th := SetupTestHelperLocalMode(t)
	defer th.TearDown()
	clients := setupLocalClients(th)
	testData := setupData(t, th)

	_, err := th.Server.App().AddMemberToBoard(&model.BoardMember{BoardID: testData.publicBoard.ID, UserID: userTeamMemberID, SchemeViewer: true})
	require.NoError(t, err)
	_, err = th.Server.App().AddMemberToBoard(&model.BoardMember{BoardID: testData.privateBoard.ID, UserID: userTeamMemberID, SchemeViewer: true})
	require.NoError(t, err)
	_, err = th.Server.App().AddMemberToBoard(&model.BoardMember{BoardID: testData.publicTemplate.ID, UserID: userTeamMemberID, SchemeViewer: true})
	require.NoError(t, err)
	_, err = th.Server.App().AddMemberToBoard(&model.BoardMember{BoardID: testData.privateTemplate.ID, UserID: userTeamMemberID, SchemeViewer: true})
	require.NoError(t, err)

	ttCases := []TestCase{
		{"/boards/{PRIVATE_BOARD_ID}/members/{USER_TEAM_MEMBER_ID}", methodDelete, "", userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PRIVATE_BOARD_ID}/members/{USER_TEAM_MEMBER_ID}", methodDelete, "", userNoTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}/members/{USER_TEAM_MEMBER_ID}", methodDelete, "", userTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}/members/{USER_TEAM_MEMBER_ID}", methodDelete, "", userViewer, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}/members/{USER_TEAM_MEMBER_ID}", methodDelete, "", userCommenter, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}/members/{USER_TEAM_MEMBER_ID}", methodDelete, "", userEditor, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}/members/{USER_TEAM_MEMBER_ID}", methodDelete, "", userAdmin, http.StatusOK, 0},

		{"/boards/{PUBLIC_BOARD_ID}/members/{USER_TEAM_MEMBER_ID}", methodDelete, "", userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PUBLIC_BOARD_ID}/members/{USER_TEAM_MEMBER_ID}", methodDelete, "", userNoTeamMember, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_BOARD_ID}/members/{USER_TEAM_MEMBER_ID}", methodDelete, "", userTeamMember, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_BOARD_ID}/members/{USER_TEAM_MEMBER_ID}", methodDelete, "", userViewer, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_BOARD_ID}/members/{USER_TEAM_MEMBER_ID}", methodDelete, "", userCommenter, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_BOARD_ID}/members/{USER_TEAM_MEMBER_ID}", methodDelete, "", userEditor, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_BOARD_ID}/members/{USER_TEAM_MEMBER_ID}", methodDelete, "", userAdmin, http.StatusOK, 0},

		{"/boards/{PRIVATE_TEMPLATE_ID}/members/{USER_TEAM_MEMBER_ID}", methodDelete, "", userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/members/{USER_TEAM_MEMBER_ID}", methodDelete, "", userNoTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/members/{USER_TEAM_MEMBER_ID}", methodDelete, "", userTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/members/{USER_TEAM_MEMBER_ID}", methodDelete, "", userViewer, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/members/{USER_TEAM_MEMBER_ID}", methodDelete, "", userCommenter, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/members/{USER_TEAM_MEMBER_ID}", methodDelete, "", userEditor, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/members/{USER_TEAM_MEMBER_ID}", methodDelete, "", userAdmin, http.StatusOK, 0},

		{"/boards/{PUBLIC_TEMPLATE_ID}/members/{USER_TEAM_MEMBER_ID}", methodDelete, "", userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/members/{USER_TEAM_MEMBER_ID}", methodDelete, "", userNoTeamMember, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/members/{USER_TEAM_MEMBER_ID}", methodDelete, "", userTeamMember, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/members/{USER_TEAM_MEMBER_ID}", methodDelete, "", userViewer, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/members/{USER_TEAM_MEMBER_ID}", methodDelete, "", userCommenter, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/members/{USER_TEAM_MEMBER_ID}", methodDelete, "", userEditor, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/members/{USER_TEAM_MEMBER_ID}", methodDelete, "", userAdmin, http.StatusOK, 0},

		// Invalid boardID/memberID combination
		{"/boards/{PUBLIC_TEMPLATE_ID}/members/{USER_TEAM_MEMBER_ID}", methodDelete, "", userAdmin, http.StatusOK, 0},

		// Invalid boardID
		{"/boards/invalid/members/{USER_VIEWER_ID}", methodDelete, "", userAdmin, http.StatusNotFound, 0},

		// Invalid memberID
		{"/boards/{PUBLIC_TEMPLATE_ID}/members/invalid", methodDelete, "", userAdmin, http.StatusOK, 0},
	}
	runTestCases(t, ttCases, testData, clients)
}

func TestLocalPermissionsJoinBoardAsMember(t *testing.T) {
	th := SetupTestHelperLocalMode(t)
	defer th.TearDown()
	clients := setupLocalClients(th)
	testData := setupData(t, th)

	ttCases := []TestCase{
		{"/boards/{PRIVATE_BOARD_ID}/join", methodPost, "", userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PRIVATE_BOARD_ID}/join", methodPost, "", userNoTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}/join", methodPost, "", userTeamMember, http.StatusForbidden, 0},

		// Do we want to forbid already existing members to join to the board or simply return the current membership?
		{"/boards/{PRIVATE_BOARD_ID}/join", methodPost, "", userViewer, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}/join", methodPost, "", userCommenter, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}/join", methodPost, "", userEditor, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}/join", methodPost, "", userAdmin, http.StatusForbidden, 0},

		{"/boards/{PUBLIC_BOARD_ID}/join", methodPost, "", userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PUBLIC_BOARD_ID}/join", methodPost, "", userNoTeamMember, http.StatusOK, 1},
		{"/boards/{PUBLIC_BOARD_ID}/join", methodPost, "", userTeamMember, http.StatusOK, 1},
		{"/boards/{PUBLIC_BOARD_ID}/join", methodPost, "", userViewer, http.StatusOK, 1},
		{"/boards/{PUBLIC_BOARD_ID}/join", methodPost, "", userCommenter, http.StatusOK, 1},
		{"/boards/{PUBLIC_BOARD_ID}/join", methodPost, "", userEditor, http.StatusOK, 1},
		{"/boards/{PUBLIC_BOARD_ID}/join", methodPost, "", userAdmin, http.StatusOK, 1},

		{"/boards/{PRIVATE_TEMPLATE_ID}/join", methodPost, "", userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/join", methodPost, "", userNoTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/join", methodPost, "", userTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/join", methodPost, "", userViewer, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/join", methodPost, "", userCommenter, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/join", methodPost, "", userEditor, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/join", methodPost, "", userAdmin, http.StatusForbidden, 0},

		{"/boards/{PUBLIC_TEMPLATE_ID}/join", methodPost, "", userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/join", methodPost, "", userNoTeamMember, http.StatusOK, 1},
		{"/boards/{PUBLIC_TEMPLATE_ID}/join", methodPost, "", userTeamMember, http.StatusOK, 1},
		{"/boards/{PUBLIC_TEMPLATE_ID}/join", methodPost, "", userViewer, http.StatusOK, 1},
		{"/boards/{PUBLIC_TEMPLATE_ID}/join", methodPost, "", userCommenter, http.StatusOK, 1},
		{"/boards/{PUBLIC_TEMPLATE_ID}/join", methodPost, "", userEditor, http.StatusOK, 1},
		{"/boards/{PUBLIC_TEMPLATE_ID}/join", methodPost, "", userAdmin, http.StatusOK, 1},
	}
	runTestCases(t, ttCases, testData, clients)
}

func TestLocalPermissionsLeaveBoardAsMember(t *testing.T) {
	th := SetupTestHelperLocalMode(t)
	defer th.TearDown()
	clients := setupLocalClients(th)
	testData := setupData(t, th)

	_, err := th.Server.App().AddMemberToBoard(&model.BoardMember{BoardID: testData.publicBoard.ID, UserID: "not-real-user", SchemeAdmin: true})
	require.NoError(t, err)
	_, err = th.Server.App().AddMemberToBoard(&model.BoardMember{BoardID: testData.privateBoard.ID, UserID: "not-real-user", SchemeAdmin: true})
	require.NoError(t, err)
	_, err = th.Server.App().AddMemberToBoard(&model.BoardMember{BoardID: testData.publicTemplate.ID, UserID: "not-real-user", SchemeAdmin: true})
	require.NoError(t, err)
	_, err = th.Server.App().AddMemberToBoard(&model.BoardMember{BoardID: testData.privateTemplate.ID, UserID: "not-real-user", SchemeAdmin: true})
	require.NoError(t, err)

	ttCases := []TestCase{
		{"/boards/{PRIVATE_BOARD_ID}/leave", methodPost, "", userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PRIVATE_BOARD_ID}/leave", methodPost, "", userNoTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}/leave", methodPost, "", userTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}/leave", methodPost, "", userViewer, http.StatusOK, 0},
		{"/boards/{PRIVATE_BOARD_ID}/leave", methodPost, "", userCommenter, http.StatusOK, 0},
		{"/boards/{PRIVATE_BOARD_ID}/leave", methodPost, "", userEditor, http.StatusOK, 0},
		{"/boards/{PRIVATE_BOARD_ID}/leave", methodPost, "", userAdmin, http.StatusOK, 0},

		{"/boards/{PUBLIC_BOARD_ID}/leave", methodPost, "", userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PUBLIC_BOARD_ID}/leave", methodPost, "", userNoTeamMember, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_BOARD_ID}/leave", methodPost, "", userTeamMember, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_BOARD_ID}/leave", methodPost, "", userViewer, http.StatusOK, 0},
		{"/boards/{PUBLIC_BOARD_ID}/leave", methodPost, "", userCommenter, http.StatusOK, 0},
		{"/boards/{PUBLIC_BOARD_ID}/leave", methodPost, "", userEditor, http.StatusOK, 0},
		{"/boards/{PUBLIC_BOARD_ID}/leave", methodPost, "", userAdmin, http.StatusOK, 0},

		{"/boards/{PRIVATE_TEMPLATE_ID}/leave", methodPost, "", userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/leave", methodPost, "", userNoTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/leave", methodPost, "", userTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/leave", methodPost, "", userViewer, http.StatusOK, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/leave", methodPost, "", userCommenter, http.StatusOK, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/leave", methodPost, "", userEditor, http.StatusOK, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/leave", methodPost, "", userAdmin, http.StatusOK, 0},

		{"/boards/{PUBLIC_TEMPLATE_ID}/leave", methodPost, "", userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/leave", methodPost, "", userNoTeamMember, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/leave", methodPost, "", userTeamMember, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/leave", methodPost, "", userViewer, http.StatusOK, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/leave", methodPost, "", userCommenter, http.StatusOK, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/leave", methodPost, "", userEditor, http.StatusOK, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/leave", methodPost, "", userAdmin, http.StatusOK, 0},
	}
	runTestCases(t, ttCases, testData, clients)

	_, err = th.Server.App().AddMemberToBoard(&model.BoardMember{BoardID: testData.publicBoard.ID, UserID: userAdminID, SchemeAdmin: true})
	require.NoError(t, err)
	_, err = th.Server.App().AddMemberToBoard(&model.BoardMember{BoardID: testData.privateBoard.ID, UserID: userAdminID, SchemeAdmin: true})
	require.NoError(t, err)
	_, err = th.Server.App().AddMemberToBoard(&model.BoardMember{BoardID: testData.publicTemplate.ID, UserID: userAdminID, SchemeAdmin: true})
	require.NoError(t, err)
	_, err = th.Server.App().AddMemberToBoard(&model.BoardMember{BoardID: testData.privateTemplate.ID, UserID: userAdminID, SchemeAdmin: true})
	require.NoError(t, err)

	require.NoError(t, th.Server.App().DeleteBoardMember(testData.publicBoard.ID, "not-real-user"))
	require.NoError(t, th.Server.App().DeleteBoardMember(testData.privateBoard.ID, "not-real-user"))
	require.NoError(t, th.Server.App().DeleteBoardMember(testData.publicTemplate.ID, "not-real-user"))
	require.NoError(t, th.Server.App().DeleteBoardMember(testData.privateTemplate.ID, "not-real-user"))

	// Last admin leave should fail
	ttCases = []TestCase{
		{"/boards/{PRIVATE_BOARD_ID}/leave", methodPost, "", userAdmin, http.StatusBadRequest, 0},
		{"/boards/{PUBLIC_BOARD_ID}/leave", methodPost, "", userAdmin, http.StatusBadRequest, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/leave", methodPost, "", userAdmin, http.StatusBadRequest, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/leave", methodPost, "", userAdmin, http.StatusBadRequest, 0},
	}
	runTestCases(t, ttCases, testData, clients)
}

func TestLocalPermissionsShareBoard(t *testing.T) {
	th := SetupTestHelperLocalMode(t)
	defer th.TearDown()
	clients := setupLocalClients(th)
	testData := setupData(t, th)

	sharing := toJSON(t, model.Sharing{Enabled: true, Token: "test-token"})

	ttCases := []TestCase{
		{"/boards/{PRIVATE_BOARD_ID}/sharing", methodPost, sharing, userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PRIVATE_BOARD_ID}/sharing", methodPost, sharing, userNoTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}/sharing", methodPost, sharing, userTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}/sharing", methodPost, sharing, userViewer, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}/sharing", methodPost, sharing, userCommenter, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}/sharing", methodPost, sharing, userEditor, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}/sharing", methodPost, sharing, userAdmin, http.StatusOK, 0},

		{"/boards/{PUBLIC_BOARD_ID}/sharing", methodPost, sharing, userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PUBLIC_BOARD_ID}/sharing", methodPost, sharing, userNoTeamMember, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_BOARD_ID}/sharing", methodPost, sharing, userTeamMember, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_BOARD_ID}/sharing", methodPost, sharing, userViewer, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_BOARD_ID}/sharing", methodPost, sharing, userCommenter, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_BOARD_ID}/sharing", methodPost, sharing, userEditor, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_BOARD_ID}/sharing", methodPost, sharing, userAdmin, http.StatusOK, 0},

		{"/boards/{PRIVATE_TEMPLATE_ID}/sharing", methodPost, sharing, userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/sharing", methodPost, sharing, userNoTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/sharing", methodPost, sharing, userTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/sharing", methodPost, sharing, userViewer, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/sharing", methodPost, sharing, userCommenter, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/sharing", methodPost, sharing, userEditor, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/sharing", methodPost, sharing, userAdmin, http.StatusOK, 0},

		{"/boards/{PUBLIC_TEMPLATE_ID}/sharing", methodPost, sharing, userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/sharing", methodPost, sharing, userNoTeamMember, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/sharing", methodPost, sharing, userTeamMember, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/sharing", methodPost, sharing, userViewer, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/sharing", methodPost, sharing, userCommenter, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/sharing", methodPost, sharing, userEditor, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/sharing", methodPost, sharing, userAdmin, http.StatusOK, 0},
	}
	runTestCases(t, ttCases, testData, clients)
}

func TestLocalPermissionsGetSharedBoardInfo(t *testing.T) {
	th := SetupTestHelperLocalMode(t)
	defer th.TearDown()
	clients := setupLocalClients(th)
	testData := setupData(t, th)

	clients.Admin.PostSharing(&model.Sharing{ID: testData.publicBoard.ID, Enabled: true, Token: "test-token"})
	clients.Admin.PostSharing(&model.Sharing{ID: testData.privateBoard.ID, Enabled: true, Token: "test-token"})
	clients.Admin.PostSharing(&model.Sharing{ID: testData.publicTemplate.ID, Enabled: true, Token: "test-token"})
	clients.Admin.PostSharing(&model.Sharing{ID: testData.privateTemplate.ID, Enabled: true, Token: "test-token"})

	ttCases := []TestCase{
		{"/boards/{PRIVATE_BOARD_ID}/sharing", methodGet, "", userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PRIVATE_BOARD_ID}/sharing", methodGet, "", userNoTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}/sharing", methodGet, "", userTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}/sharing", methodGet, "", userViewer, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}/sharing", methodGet, "", userCommenter, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}/sharing", methodGet, "", userEditor, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}/sharing", methodGet, "", userAdmin, http.StatusOK, 1},

		{"/boards/{PUBLIC_BOARD_ID}/sharing", methodGet, "", userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PUBLIC_BOARD_ID}/sharing", methodGet, "", userNoTeamMember, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_BOARD_ID}/sharing", methodGet, "", userTeamMember, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_BOARD_ID}/sharing", methodGet, "", userViewer, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_BOARD_ID}/sharing", methodGet, "", userCommenter, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_BOARD_ID}/sharing", methodGet, "", userEditor, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_BOARD_ID}/sharing", methodGet, "", userAdmin, http.StatusOK, 1},

		{"/boards/{PRIVATE_TEMPLATE_ID}/sharing", methodGet, "", userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/sharing", methodGet, "", userNoTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/sharing", methodGet, "", userTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/sharing", methodGet, "", userViewer, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/sharing", methodGet, "", userCommenter, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/sharing", methodGet, "", userEditor, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/sharing", methodGet, "", userAdmin, http.StatusOK, 1},

		{"/boards/{PUBLIC_TEMPLATE_ID}/sharing", methodGet, "", userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/sharing", methodGet, "", userNoTeamMember, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/sharing", methodGet, "", userTeamMember, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/sharing", methodGet, "", userViewer, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/sharing", methodGet, "", userCommenter, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/sharing", methodGet, "", userEditor, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/sharing", methodGet, "", userAdmin, http.StatusOK, 1},
	}
	runTestCases(t, ttCases, testData, clients)
}

func TestLocalPermissionsListTeams(t *testing.T) {
	th := SetupTestHelperLocalMode(t)
	defer th.TearDown()
	clients := setupLocalClients(th)
	testData := setupData(t, th)

	ttCases := []TestCase{
		{"/teams", methodGet, "", userAnon, http.StatusUnauthorized, 0},
		{"/teams", methodGet, "", userNoTeamMember, http.StatusOK, 1},
		{"/teams", methodGet, "", userTeamMember, http.StatusOK, 1},
		{"/teams", methodGet, "", userViewer, http.StatusOK, 1},
		{"/teams", methodGet, "", userCommenter, http.StatusOK, 1},
		{"/teams", methodGet, "", userEditor, http.StatusOK, 1},
		{"/teams", methodGet, "", userAdmin, http.StatusOK, 1},
	}
	runTestCases(t, ttCases, testData, clients)
}

func TestLocalPermissionsGetTeam(t *testing.T) {
	th := SetupTestHelperLocalMode(t)
	defer th.TearDown()
	clients := setupLocalClients(th)
	testData := setupData(t, th)

	ttCases := []TestCase{
		{"/teams/test-team", methodGet, "", userAnon, http.StatusUnauthorized, 0},
		{"/teams/test-team", methodGet, "", userNoTeamMember, http.StatusOK, 1},
		{"/teams/test-team", methodGet, "", userTeamMember, http.StatusOK, 1},
		{"/teams/test-team", methodGet, "", userViewer, http.StatusOK, 1},
		{"/teams/test-team", methodGet, "", userCommenter, http.StatusOK, 1},
		{"/teams/test-team", methodGet, "", userEditor, http.StatusOK, 1},
		{"/teams/test-team", methodGet, "", userAdmin, http.StatusOK, 1},

		// {"/teams/empty-team", methodGet, "", userAnon, http.StatusUnauthorized, 0},
		// {"/teams/empty-team", methodGet, "", userNoTeamMember, http.StatusForbidden, 0},
		// {"/teams/empty-team", methodGet, "", userTeamMember, http.StatusForbidden, 0},
		// {"/teams/empty-team", methodGet, "", userViewer, http.StatusForbidden, 0},
		// {"/teams/empty-team", methodGet, "", userCommenter, http.StatusForbidden, 0},
		// {"/teams/empty-team", methodGet, "", userEditor, http.StatusForbidden, 0},
		// {"/teams/empty-team", methodGet, "", userAdmin, http.StatusForbidden, 0},
	}
	runTestCases(t, ttCases, testData, clients)
}

func TestLocalPermissionsRegenerateSignupToken(t *testing.T) {
	th := SetupTestHelperLocalMode(t)
	defer th.TearDown()
	clients := setupLocalClients(th)
	testData := setupData(t, th)

	ttCases := []TestCase{
		{"/teams/test-team/regenerate_signup_token", methodPost, "", userAnon, http.StatusUnauthorized, 0},
		{"/teams/test-team/regenerate_signup_token", methodPost, "", userAdmin, http.StatusOK, 0},

		{"/teams/empty-team/regenerate_signup_token", methodPost, "", userAnon, http.StatusUnauthorized, 0},
		{"/teams/empty-team/regenerate_signup_token", methodPost, "", userAdmin, http.StatusOK, 0},
	}
	runTestCases(t, ttCases, testData, clients)
}

func TestLocalPermissionsGetTeamUsers(t *testing.T) {
	th := SetupTestHelperLocalMode(t)
	defer th.TearDown()
	clients := setupLocalClients(th)
	testData := setupData(t, th)

	ttCases := []TestCase{
		{"/teams/test-team/users", methodGet, "", userAnon, http.StatusUnauthorized, 0},
		{"/teams/test-team/users", methodGet, "", userNoTeamMember, http.StatusOK, 7},
		{"/teams/test-team/users", methodGet, "", userTeamMember, http.StatusOK, 7},
		{"/teams/test-team/users", methodGet, "", userViewer, http.StatusOK, 7},
		{"/teams/test-team/users", methodGet, "", userCommenter, http.StatusOK, 7},
		{"/teams/test-team/users", methodGet, "", userEditor, http.StatusOK, 7},
		{"/teams/test-team/users", methodGet, "", userAdmin, http.StatusOK, 7},
	}
	runTestCases(t, ttCases, testData, clients)
}

func TestLocalPermissionsTeamArchiveExport(t *testing.T) {
	th := SetupTestHelperLocalMode(t)
	defer th.TearDown()
	clients := setupLocalClients(th)
	testData := setupData(t, th)

	ttCases := []TestCase{
		{"/teams/test-team/archive/export", methodGet, "", userAnon, http.StatusUnauthorized, 0},
		{"/teams/test-team/archive/export", methodGet, "", userAdmin, http.StatusOK, 1},

		{"/teams/empty-team/archive/export", methodGet, "", userAnon, http.StatusUnauthorized, 0},
		{"/teams/empty-team/archive/export", methodGet, "", userAdmin, http.StatusOK, 1},
	}
	runTestCases(t, ttCases, testData, clients)
}

func TestLocalPermissionsUploadFile(t *testing.T) {
	th := SetupTestHelperLocalMode(t)
	defer th.TearDown()
	clients := setupLocalClients(th)
	testData := setupData(t, th)

	ttCases := []TestCase{
		{"/teams/test-team/{PRIVATE_BOARD_ID}/files", methodPost, "", userAnon, http.StatusUnauthorized, 0},
		{"/teams/test-team/{PRIVATE_BOARD_ID}/files", methodPost, "", userNoTeamMember, http.StatusForbidden, 0},
		{"/teams/test-team/{PRIVATE_BOARD_ID}/files", methodPost, "", userTeamMember, http.StatusForbidden, 0},
		{"/teams/test-team/{PRIVATE_BOARD_ID}/files", methodPost, "", userViewer, http.StatusForbidden, 0},
		{"/teams/test-team/{PRIVATE_BOARD_ID}/files", methodPost, "", userCommenter, http.StatusForbidden, 0},
		{"/teams/test-team/{PRIVATE_BOARD_ID}/files", methodPost, "", userEditor, http.StatusBadRequest, 1}, // Not checking the logic, only the permissions
		{"/teams/test-team/{PRIVATE_BOARD_ID}/files", methodPost, "", userAdmin, http.StatusBadRequest, 1},  // Not checking the logic, only the permissions

		{"/teams/test-team/{PUBLIC_BOARD_ID}/files", methodPost, "", userAnon, http.StatusUnauthorized, 0},
		{"/teams/test-team/{PUBLIC_BOARD_ID}/files", methodPost, "", userNoTeamMember, http.StatusForbidden, 0},
		{"/teams/test-team/{PUBLIC_BOARD_ID}/files", methodPost, "", userTeamMember, http.StatusForbidden, 0},
		{"/teams/test-team/{PUBLIC_BOARD_ID}/files", methodPost, "", userViewer, http.StatusForbidden, 0},
		{"/teams/test-team/{PUBLIC_BOARD_ID}/files", methodPost, "", userCommenter, http.StatusForbidden, 0},
		{"/teams/test-team/{PUBLIC_BOARD_ID}/files", methodPost, "", userEditor, http.StatusBadRequest, 1}, // Not checking the logic, only the permissions
		{"/teams/test-team/{PUBLIC_BOARD_ID}/files", methodPost, "", userAdmin, http.StatusBadRequest, 1},  // Not checking the logic, only the permissions

		{"/teams/test-team/{PRIVATE_TEMPLATE_ID}/files", methodPost, "", userAnon, http.StatusUnauthorized, 0},
		{"/teams/test-team/{PRIVATE_TEMPLATE_ID}/files", methodPost, "", userNoTeamMember, http.StatusForbidden, 0},
		{"/teams/test-team/{PRIVATE_TEMPLATE_ID}/files", methodPost, "", userTeamMember, http.StatusForbidden, 0},
		{"/teams/test-team/{PRIVATE_TEMPLATE_ID}/files", methodPost, "", userViewer, http.StatusForbidden, 0},
		{"/teams/test-team/{PRIVATE_TEMPLATE_ID}/files", methodPost, "", userCommenter, http.StatusForbidden, 0},
		{"/teams/test-team/{PRIVATE_TEMPLATE_ID}/files", methodPost, "", userEditor, http.StatusBadRequest, 1}, // Not checking the logic, only the permissions
		{"/teams/test-team/{PRIVATE_TEMPLATE_ID}/files", methodPost, "", userAdmin, http.StatusBadRequest, 1},  // Not checking the logic, only the permissions

		{"/teams/test-team/{PUBLIC_TEMPLATE_ID}/files", methodPost, "", userAnon, http.StatusUnauthorized, 0},
		{"/teams/test-team/{PUBLIC_TEMPLATE_ID}/files", methodPost, "", userNoTeamMember, http.StatusForbidden, 0},
		{"/teams/test-team/{PUBLIC_TEMPLATE_ID}/files", methodPost, "", userTeamMember, http.StatusForbidden, 0},
		{"/teams/test-team/{PUBLIC_TEMPLATE_ID}/files", methodPost, "", userViewer, http.StatusForbidden, 0},
		{"/teams/test-team/{PUBLIC_TEMPLATE_ID}/files", methodPost, "", userCommenter, http.StatusForbidden, 0},
		{"/teams/test-team/{PUBLIC_TEMPLATE_ID}/files", methodPost, "", userEditor, http.StatusBadRequest, 1}, // Not checking the logic, only the permissions
		{"/teams/test-team/{PUBLIC_TEMPLATE_ID}/files", methodPost, "", userAdmin, http.StatusBadRequest, 1},  // Not checking the logic, only the permissions
	}
	runTestCases(t, ttCases, testData, clients)
}

func TestLocalPermissionsGetMe(t *testing.T) {
	th := SetupTestHelperLocalMode(t)
	defer th.TearDown()
	clients := setupLocalClients(th)
	testData := setupData(t, th)

	ttCases := []TestCase{
		{"/users/me", methodGet, "", userAnon, http.StatusUnauthorized, 0},
		{"/users/me", methodGet, "", userNoTeamMember, http.StatusOK, 1},
		{"/users/me", methodGet, "", userTeamMember, http.StatusOK, 1},
		{"/users/me", methodGet, "", userViewer, http.StatusOK, 1},
		{"/users/me", methodGet, "", userCommenter, http.StatusOK, 1},
		{"/users/me", methodGet, "", userEditor, http.StatusOK, 1},
		{"/users/me", methodGet, "", userAdmin, http.StatusOK, 1},
	}
	runTestCases(t, ttCases, testData, clients)
}

func TestLocalPermissionsGetMyMemberships(t *testing.T) {
	th := SetupTestHelperLocalMode(t)
	defer th.TearDown()
	clients := setupLocalClients(th)
	testData := setupData(t, th)

	ttCases := []TestCase{
		{"/users/me/memberships", methodGet, "", userAnon, http.StatusUnauthorized, 0},
		{"/users/me/memberships", methodGet, "", userNoTeamMember, http.StatusOK, 0},
		{"/users/me/memberships", methodGet, "", userTeamMember, http.StatusOK, 0},
		{"/users/me/memberships", methodGet, "", userViewer, http.StatusOK, 4},
		{"/users/me/memberships", methodGet, "", userCommenter, http.StatusOK, 4},
		{"/users/me/memberships", methodGet, "", userEditor, http.StatusOK, 4},
		{"/users/me/memberships", methodGet, "", userAdmin, http.StatusOK, 4},
	}
	runTestCases(t, ttCases, testData, clients)
}

func TestLocalPermissionsGetUser(t *testing.T) {
	th := SetupTestHelperLocalMode(t)
	defer th.TearDown()
	clients := setupLocalClients(th)
	testData := setupData(t, th)

	ttCases := []TestCase{
		{"/users/{USER_NO_TEAM_MEMBER_ID}", methodGet, "", userAnon, http.StatusUnauthorized, 0},
		{"/users/{USER_NO_TEAM_MEMBER_ID}", methodGet, "", userNoTeamMember, http.StatusOK, 1},
		{"/users/{USER_NO_TEAM_MEMBER_ID}", methodGet, "", userTeamMember, http.StatusOK, 1},
		{"/users/{USER_NO_TEAM_MEMBER_ID}", methodGet, "", userViewer, http.StatusOK, 1},
		{"/users/{USER_NO_TEAM_MEMBER_ID}", methodGet, "", userCommenter, http.StatusOK, 1},
		{"/users/{USER_NO_TEAM_MEMBER_ID}", methodGet, "", userEditor, http.StatusOK, 1},
		{"/users/{USER_NO_TEAM_MEMBER_ID}", methodGet, "", userAdmin, http.StatusOK, 1},

		{"/users/{USER_TEAM_MEMBER_ID}", methodGet, "", userAnon, http.StatusUnauthorized, 0},
		{"/users/{USER_TEAM_MEMBER_ID}", methodGet, "", userNoTeamMember, http.StatusOK, 1},
		{"/users/{USER_TEAM_MEMBER_ID}", methodGet, "", userTeamMember, http.StatusOK, 1},
		{"/users/{USER_TEAM_MEMBER_ID}", methodGet, "", userViewer, http.StatusOK, 1},
		{"/users/{USER_TEAM_MEMBER_ID}", methodGet, "", userCommenter, http.StatusOK, 1},
		{"/users/{USER_TEAM_MEMBER_ID}", methodGet, "", userEditor, http.StatusOK, 1},
		{"/users/{USER_TEAM_MEMBER_ID}", methodGet, "", userAdmin, http.StatusOK, 1},

		{"/users/{USER_VIEWER_ID}", methodGet, "", userAnon, http.StatusUnauthorized, 0},
		{"/users/{USER_VIEWER_ID}", methodGet, "", userNoTeamMember, http.StatusOK, 1},
		{"/users/{USER_VIEWER_ID}", methodGet, "", userTeamMember, http.StatusOK, 1},
		{"/users/{USER_VIEWER_ID}", methodGet, "", userViewer, http.StatusOK, 1},
		{"/users/{USER_VIEWER_ID}", methodGet, "", userCommenter, http.StatusOK, 1},
		{"/users/{USER_VIEWER_ID}", methodGet, "", userEditor, http.StatusOK, 1},
		{"/users/{USER_VIEWER_ID}", methodGet, "", userAdmin, http.StatusOK, 1},
	}
	runTestCases(t, ttCases, testData, clients)
}

func TestLocalPermissionsUserChangePassword(t *testing.T) {
	th := SetupTestHelperLocalMode(t)
	defer th.TearDown()
	clients := setupLocalClients(th)
	testData := setupData(t, th)

	postBody := toJSON(t, api.ChangePasswordRequest{
		OldPassword: password,
		NewPassword: "newpa$$word123",
	})

	ttCases := []TestCase{
		{"/users/{USER_ADMIN_ID}/changepassword", methodPost, postBody, userAnon, http.StatusUnauthorized, 0},
		{"/users/{USER_ADMIN_ID}/changepassword", methodPost, postBody, userAdmin, http.StatusOK, 0},
	}
	runTestCases(t, ttCases, testData, clients)
}

func TestLocalPermissionsUpdateUserConfig(t *testing.T) {
	th := SetupTestHelperLocalMode(t)
	defer th.TearDown()
	clients := setupLocalClients(th)
	testData := setupData(t, th)

	patch := toJSON(t, model.UserPropPatch{UpdatedFields: map[string]string{"test": "test"}})

	ttCases := []TestCase{
		{"/users/{USER_TEAM_MEMBER_ID}/config", methodPut, patch, userAnon, http.StatusUnauthorized, 0},
		{"/users/{USER_TEAM_MEMBER_ID}/config", methodPut, patch, userNoTeamMember, http.StatusForbidden, 0},
		{"/users/{USER_TEAM_MEMBER_ID}/config", methodPut, patch, userTeamMember, http.StatusOK, 1},
		{"/users/{USER_TEAM_MEMBER_ID}/config", methodPut, patch, userViewer, http.StatusForbidden, 0},
		{"/users/{USER_TEAM_MEMBER_ID}/config", methodPut, patch, userCommenter, http.StatusForbidden, 0},
		{"/users/{USER_TEAM_MEMBER_ID}/config", methodPut, patch, userEditor, http.StatusForbidden, 0},
		{"/users/{USER_TEAM_MEMBER_ID}/config", methodPut, patch, userAdmin, http.StatusForbidden, 0},
	}
	runTestCases(t, ttCases, testData, clients)
}

func TestLocalPermissionsCreateBoardsAndBlocks(t *testing.T) {
	th := SetupTestHelperLocalMode(t)
	defer th.TearDown()
	clients := setupLocalClients(th)
	testData := setupData(t, th)

	bab := toJSON(t, model.BoardsAndBlocks{
		Boards: []*model.Board{{ID: "test", Title: "Test Board", TeamID: "test-team"}},
		Blocks: []model.Block{
			{ID: "test-block", BoardID: "test", Type: "card", CreateAt: model.GetMillis(), UpdateAt: model.GetMillis()},
		},
	})

	ttCases := []TestCase{
		{"/boards-and-blocks", methodPost, bab, userAnon, http.StatusUnauthorized, 0},
		{"/boards-and-blocks", methodPost, bab, userNoTeamMember, http.StatusOK, 1},
		{"/boards-and-blocks", methodPost, bab, userTeamMember, http.StatusOK, 1},
		{"/boards-and-blocks", methodPost, bab, userViewer, http.StatusOK, 1},
		{"/boards-and-blocks", methodPost, bab, userCommenter, http.StatusOK, 1},
		{"/boards-and-blocks", methodPost, bab, userEditor, http.StatusOK, 1},
		{"/boards-and-blocks", methodPost, bab, userAdmin, http.StatusOK, 1},
	}
	runTestCases(t, ttCases, testData, clients)
}

func TestLocalPermissionsUpdateBoardsAndBlocks(t *testing.T) {
	th := SetupTestHelperLocalMode(t)
	defer th.TearDown()
	clients := setupLocalClients(th)
	testData := setupData(t, th)

	newTitle := "New Block Title"
	bab := toJSON(t, model.PatchBoardsAndBlocks{
		BoardIDs:     []string{testData.publicBoard.ID},
		BoardPatches: []*model.BoardPatch{{Title: &newTitle}},
		BlockIDs:     []string{"block-3"},
		BlockPatches: []*model.BlockPatch{{Title: &newTitle}},
	})

	ttCases := []TestCase{
		{"/boards-and-blocks", methodPatch, bab, userAnon, http.StatusUnauthorized, 0},
		{"/boards-and-blocks", methodPatch, bab, userNoTeamMember, http.StatusForbidden, 0},
		{"/boards-and-blocks", methodPatch, bab, userTeamMember, http.StatusForbidden, 0},
		{"/boards-and-blocks", methodPatch, bab, userViewer, http.StatusForbidden, 0},
		{"/boards-and-blocks", methodPatch, bab, userCommenter, http.StatusForbidden, 0},
		{"/boards-and-blocks", methodPatch, bab, userEditor, http.StatusOK, 1},
		{"/boards-and-blocks", methodPatch, bab, userAdmin, http.StatusOK, 1},
	}
	runTestCases(t, ttCases, testData, clients)

	newType := model.BoardTypePrivate
	// With type change
	bab = toJSON(t, model.PatchBoardsAndBlocks{
		BoardIDs:     []string{testData.publicBoard.ID},
		BoardPatches: []*model.BoardPatch{{Type: &newType}},
		BlockIDs:     []string{"block-3"},
		BlockPatches: []*model.BlockPatch{{Title: &newTitle}},
	})

	ttCases = []TestCase{
		{"/boards-and-blocks", methodPatch, bab, userAnon, http.StatusUnauthorized, 0},
		{"/boards-and-blocks", methodPatch, bab, userNoTeamMember, http.StatusForbidden, 0},
		{"/boards-and-blocks", methodPatch, bab, userTeamMember, http.StatusForbidden, 0},
		{"/boards-and-blocks", methodPatch, bab, userViewer, http.StatusForbidden, 0},
		{"/boards-and-blocks", methodPatch, bab, userCommenter, http.StatusForbidden, 0},
		{"/boards-and-blocks", methodPatch, bab, userEditor, http.StatusForbidden, 0},
		{"/boards-and-blocks", methodPatch, bab, userAdmin, http.StatusOK, 1},
	}
	runTestCases(t, ttCases, testData, clients)
}

func TestLocalPermissionsDeleteBoardsAndBlocks(t *testing.T) {
	th := SetupTestHelperLocalMode(t)
	defer th.TearDown()
	clients := setupLocalClients(th)
	testData := setupData(t, th)

	bab := toJSON(t, model.DeleteBoardsAndBlocks{
		Boards: []string{testData.publicBoard.ID},
		Blocks: []string{"block-3"},
	})

	ttCases := []TestCase{
		{"/boards-and-blocks", methodDelete, bab, userAnon, http.StatusUnauthorized, 0},
		{"/boards-and-blocks", methodDelete, bab, userNoTeamMember, http.StatusForbidden, 0},
		{"/boards-and-blocks", methodDelete, bab, userTeamMember, http.StatusForbidden, 0},
		{"/boards-and-blocks", methodDelete, bab, userViewer, http.StatusForbidden, 0},
		{"/boards-and-blocks", methodDelete, bab, userCommenter, http.StatusForbidden, 0},
		{"/boards-and-blocks", methodDelete, bab, userEditor, http.StatusForbidden, 0},
		{"/boards-and-blocks", methodDelete, bab, userAdmin, http.StatusOK, 0},
	}
	runTestCases(t, ttCases, testData, clients)
}

func TestLocalPermissionsLogin(t *testing.T) {
	th := SetupTestHelperLocalMode(t)
	defer th.TearDown()
	clients := setupLocalClients(th)
	testData := setupData(t, th)

	loginReq := func(username, password string) string {
		return toJSON(t, api.LoginRequest{
			Type:     "normal",
			Username: username,
			Password: password,
		})
	}

	ttCases := []TestCase{
		{"/login", methodPost, loginReq(userAnon, password), userAnon, http.StatusUnauthorized, 0},
		{"/login", methodPost, loginReq(userAdmin, password), userAdmin, http.StatusOK, 1},
	}
	runTestCases(t, ttCases, testData, clients)
}

func TestLocalPermissionsLogout(t *testing.T) {
	th := SetupTestHelperLocalMode(t)
	defer th.TearDown()
	clients := setupLocalClients(th)
	testData := setupData(t, th)

	ttCases := []TestCase{
		{"/logout", methodPost, "", userAnon, http.StatusUnauthorized, 0},
		{"/logout", methodPost, "", userAdmin, http.StatusOK, 0},
	}
	runTestCases(t, ttCases, testData, clients)
}

func TestLocalPermissionsRegister(t *testing.T) {
	th := SetupTestHelperLocalMode(t)
	defer th.TearDown()
	clients := setupLocalClients(th)
	testData := setupData(t, th)

	team, resp := th.Client.GetTeam(model.GlobalTeamID)
	th.CheckOK(resp)
	require.NotNil(th.T, team)
	require.NotNil(th.T, team.SignupToken)

	postData := toJSON(t, api.RegisterRequest{
		Username: "newuser",
		Email:    "newuser@test.com",
		Password: password,
		Token:    team.SignupToken,
	})

	ttCases := []TestCase{
		{"/register", methodPost, postData, userAnon, http.StatusOK, 0},
	}
	runTestCases(t, ttCases, testData, clients)
}

func TestLocalPermissionsClientConfig(t *testing.T) {
	th := SetupTestHelperLocalMode(t)
	defer th.TearDown()
	clients := setupLocalClients(th)
	testData := setupData(t, th)

	ttCases := []TestCase{
		{"/clientConfig", methodGet, "", userAnon, http.StatusOK, 1},
		{"/clientConfig", methodGet, "", userAdmin, http.StatusOK, 1},
	}
	runTestCases(t, ttCases, testData, clients)
}

func TestLocalPermissionsGetCategories(t *testing.T) {
	th := SetupTestHelperLocalMode(t)
	defer th.TearDown()
	clients := setupLocalClients(th)
	testData := setupData(t, th)

	ttCases := []TestCase{
		{"/teams/test-team/categories", methodGet, "", userAnon, http.StatusUnauthorized, 0},
		{"/teams/test-team/categories", methodGet, "", userNoTeamMember, http.StatusOK, 0},
		{"/teams/test-team/categories", methodGet, "", userTeamMember, http.StatusOK, 0},
		{"/teams/test-team/categories", methodGet, "", userViewer, http.StatusOK, 0},
		{"/teams/test-team/categories", methodGet, "", userCommenter, http.StatusOK, 0},
		{"/teams/test-team/categories", methodGet, "", userEditor, http.StatusOK, 0},
		{"/teams/test-team/categories", methodGet, "", userAdmin, http.StatusOK, 0},
	}
	runTestCases(t, ttCases, testData, clients)
}

func TestLocalPermissionsCreateCategory(t *testing.T) {
	th := SetupTestHelperLocalMode(t)
	defer th.TearDown()
	clients := setupLocalClients(th)
	testData := setupData(t, th)

	category := func(userID string) string {
		return toJSON(t, model.Category{
			Name:     "Test category",
			TeamID:   "test-team",
			UserID:   userID,
			CreateAt: model.GetMillis(),
			UpdateAt: model.GetMillis(),
		})
	}

	ttCases := []TestCase{
		{"/teams/test-team/categories", methodPost, category(""), userAnon, http.StatusUnauthorized, 0},
		{"/teams/test-team/categories", methodPost, category(userNoTeamMemberID), userNoTeamMember, http.StatusOK, 1},
		{"/teams/test-team/categories", methodPost, category(userTeamMemberID), userTeamMember, http.StatusOK, 1},
		{"/teams/test-team/categories", methodPost, category(userViewerID), userViewer, http.StatusOK, 1},
		{"/teams/test-team/categories", methodPost, category(userCommenterID), userCommenter, http.StatusOK, 1},
		{"/teams/test-team/categories", methodPost, category(userEditorID), userEditor, http.StatusOK, 1},
		{"/teams/test-team/categories", methodPost, category(userAdminID), userAdmin, http.StatusOK, 1},

		{"/teams/test-team/categories", methodPost, category("other"), userAnon, http.StatusUnauthorized, 0},
		{"/teams/test-team/categories", methodPost, category("other"), userNoTeamMember, http.StatusBadRequest, 0},
		{"/teams/test-team/categories", methodPost, category("other"), userTeamMember, http.StatusBadRequest, 0},
		{"/teams/test-team/categories", methodPost, category("other"), userViewer, http.StatusBadRequest, 0},
		{"/teams/test-team/categories", methodPost, category("other"), userCommenter, http.StatusBadRequest, 0},
		{"/teams/test-team/categories", methodPost, category("other"), userEditor, http.StatusBadRequest, 0},
		{"/teams/test-team/categories", methodPost, category("other"), userAdmin, http.StatusBadRequest, 0},

		{"/teams/other-team/categories", methodPost, category(""), userAnon, http.StatusUnauthorized, 0},
		{"/teams/other-team/categories", methodPost, category(userNoTeamMemberID), userNoTeamMember, http.StatusBadRequest, 0},
		{"/teams/other-team/categories", methodPost, category(userTeamMemberID), userTeamMember, http.StatusBadRequest, 0},
		{"/teams/other-team/categories", methodPost, category(userViewerID), userViewer, http.StatusBadRequest, 0},
		{"/teams/other-team/categories", methodPost, category(userCommenterID), userCommenter, http.StatusBadRequest, 0},
		{"/teams/other-team/categories", methodPost, category(userEditorID), userEditor, http.StatusBadRequest, 0},
		{"/teams/other-team/categories", methodPost, category(userAdminID), userAdmin, http.StatusBadRequest, 0},
	}
	runTestCases(t, ttCases, testData, clients)
}

func TestLocalPermissionsUpdateCategory(t *testing.T) {
	th := SetupTestHelperLocalMode(t)
	defer th.TearDown()
	clients := setupLocalClients(th)
	testData := setupData(t, th)

	categoryNoTeamMember, err := th.Server.App().CreateCategory(
		&model.Category{Name: "Test category", TeamID: "test-team", UserID: userNoTeamMemberID, CreateAt: model.GetMillis(), UpdateAt: model.GetMillis()},
	)
	require.NoError(t, err)
	categoryTeamMember, err := th.Server.App().CreateCategory(
		&model.Category{Name: "Test category", TeamID: "test-team", UserID: userTeamMemberID, CreateAt: model.GetMillis(), UpdateAt: model.GetMillis()},
	)
	require.NoError(t, err)
	categoryViewer, err := th.Server.App().CreateCategory(
		&model.Category{Name: "Test category", TeamID: "test-team", UserID: userViewerID, CreateAt: model.GetMillis(), UpdateAt: model.GetMillis()},
	)
	require.NoError(t, err)
	categoryCommenter, err := th.Server.App().CreateCategory(
		&model.Category{Name: "Test category", TeamID: "test-team", UserID: userCommenterID, CreateAt: model.GetMillis(), UpdateAt: model.GetMillis()},
	)
	require.NoError(t, err)
	categoryEditor, err := th.Server.App().CreateCategory(
		&model.Category{Name: "Test category", TeamID: "test-team", UserID: userEditorID, CreateAt: model.GetMillis(), UpdateAt: model.GetMillis()},
	)
	require.NoError(t, err)
	categoryAdmin, err := th.Server.App().CreateCategory(
		&model.Category{Name: "Test category", TeamID: "test-team", UserID: userAdminID, CreateAt: model.GetMillis(), UpdateAt: model.GetMillis()},
	)
	require.NoError(t, err)

	category := func(userID string, categoryID string) string {
		return toJSON(t, model.Category{
			ID:       categoryID,
			Name:     "Test category",
			TeamID:   "test-team",
			UserID:   userID,
			CreateAt: model.GetMillis(),
			UpdateAt: model.GetMillis(),
		})
	}

	ttCases := []TestCase{
		{"/teams/test-team/categories/any", methodPut, category("", "any"), userAnonID, http.StatusUnauthorized, 0},
		{"/teams/test-team/categories/" + categoryNoTeamMember.ID, methodPut, category(userNoTeamMemberID, categoryNoTeamMember.ID), userNoTeamMember, http.StatusOK, 1},
		{"/teams/test-team/categories/" + categoryTeamMember.ID, methodPut, category(userTeamMemberID, categoryTeamMember.ID), userTeamMember, http.StatusOK, 1},
		{"/teams/test-team/categories/" + categoryViewer.ID, methodPut, category(userViewerID, categoryViewer.ID), userViewer, http.StatusOK, 1},
		{"/teams/test-team/categories/" + categoryCommenter.ID, methodPut, category(userCommenterID, categoryCommenter.ID), userCommenter, http.StatusOK, 1},
		{"/teams/test-team/categories/" + categoryEditor.ID, methodPut, category(userEditorID, categoryEditor.ID), userEditor, http.StatusOK, 1},
		{"/teams/test-team/categories/" + categoryAdmin.ID, methodPut, category(userAdminID, categoryAdmin.ID), userAdmin, http.StatusOK, 1},

		{"/teams/test-team/categories/any", methodPut, category("other", "any"), userAnonID, http.StatusUnauthorized, 0},
		{"/teams/test-team/categories/" + categoryNoTeamMember.ID, methodPut, category("other", categoryNoTeamMember.ID), userNoTeamMember, http.StatusBadRequest, 0},
		{"/teams/test-team/categories/" + categoryTeamMember.ID, methodPut, category("other", categoryTeamMember.ID), userTeamMember, http.StatusBadRequest, 0},
		{"/teams/test-team/categories/" + categoryViewer.ID, methodPut, category("other", categoryViewer.ID), userViewer, http.StatusBadRequest, 0},
		{"/teams/test-team/categories/" + categoryCommenter.ID, methodPut, category("other", categoryCommenter.ID), userCommenter, http.StatusBadRequest, 0},
		{"/teams/test-team/categories/" + categoryEditor.ID, methodPut, category("other", categoryEditor.ID), userEditor, http.StatusBadRequest, 0},
		{"/teams/test-team/categories/" + categoryAdmin.ID, methodPut, category("other", categoryAdmin.ID), userAdmin, http.StatusBadRequest, 0},

		{"/teams/other-team/categories/any", methodPut, category("", "any"), userAnonID, http.StatusUnauthorized, 0},
		{"/teams/other-team/categories/" + categoryNoTeamMember.ID, methodPut, category(userNoTeamMemberID, categoryNoTeamMember.ID), userNoTeamMember, http.StatusBadRequest, 0},
		{"/teams/other-team/categories/" + categoryTeamMember.ID, methodPut, category(userTeamMemberID, categoryTeamMember.ID), userTeamMember, http.StatusBadRequest, 0},
		{"/teams/other-team/categories/" + categoryViewer.ID, methodPut, category(userViewerID, categoryViewer.ID), userViewer, http.StatusBadRequest, 0},
		{"/teams/other-team/categories/" + categoryCommenter.ID, methodPut, category(userCommenterID, categoryCommenter.ID), userCommenter, http.StatusBadRequest, 0},
		{"/teams/other-team/categories/" + categoryEditor.ID, methodPut, category(userEditorID, categoryEditor.ID), userEditor, http.StatusBadRequest, 0},
		{"/teams/other-team/categories/" + categoryAdmin.ID, methodPut, category(userAdminID, categoryAdmin.ID), userAdmin, http.StatusBadRequest, 0},
	}
	runTestCases(t, ttCases, testData, clients)
}

func TestLocalPermissionsDeleteCategory(t *testing.T) {
	th := SetupTestHelperLocalMode(t)
	defer th.TearDown()
	clients := setupLocalClients(th)
	testData := setupData(t, th)

	categoryNoTeamMember, err := th.Server.App().CreateCategory(
		&model.Category{Name: "Test category", TeamID: "test-team", UserID: userNoTeamMemberID, CreateAt: model.GetMillis(), UpdateAt: model.GetMillis()},
	)
	require.NoError(t, err)
	categoryTeamMember, err := th.Server.App().CreateCategory(
		&model.Category{Name: "Test category", TeamID: "test-team", UserID: userTeamMemberID, CreateAt: model.GetMillis(), UpdateAt: model.GetMillis()},
	)
	require.NoError(t, err)
	categoryViewer, err := th.Server.App().CreateCategory(
		&model.Category{Name: "Test category", TeamID: "test-team", UserID: userViewerID, CreateAt: model.GetMillis(), UpdateAt: model.GetMillis()},
	)
	require.NoError(t, err)
	categoryCommenter, err := th.Server.App().CreateCategory(
		&model.Category{Name: "Test category", TeamID: "test-team", UserID: userCommenterID, CreateAt: model.GetMillis(), UpdateAt: model.GetMillis()},
	)
	require.NoError(t, err)
	categoryEditor, err := th.Server.App().CreateCategory(
		&model.Category{Name: "Test category", TeamID: "test-team", UserID: userEditorID, CreateAt: model.GetMillis(), UpdateAt: model.GetMillis()},
	)
	require.NoError(t, err)
	categoryAdmin, err := th.Server.App().CreateCategory(
		&model.Category{Name: "Test category", TeamID: "test-team", UserID: userAdminID, CreateAt: model.GetMillis(), UpdateAt: model.GetMillis()},
	)
	require.NoError(t, err)

	ttCases := []TestCase{
		{"/teams/other-team/categories/any", methodDelete, "", userAnon, http.StatusUnauthorized, 0},
		{"/teams/other-team/categories/" + categoryNoTeamMember.ID, methodDelete, "", userNoTeamMember, http.StatusBadRequest, 0},
		{"/teams/other-team/categories/" + categoryTeamMember.ID, methodDelete, "", userTeamMember, http.StatusBadRequest, 0},
		{"/teams/other-team/categories/" + categoryViewer.ID, methodDelete, "", userViewer, http.StatusBadRequest, 0},
		{"/teams/other-team/categories/" + categoryCommenter.ID, methodDelete, "", userCommenter, http.StatusBadRequest, 0},
		{"/teams/other-team/categories/" + categoryEditor.ID, methodDelete, "", userEditor, http.StatusBadRequest, 0},
		{"/teams/other-team/categories/" + categoryAdmin.ID, methodDelete, "", userAdmin, http.StatusBadRequest, 0},

		{"/teams/test-team/categories/any", methodDelete, "", userAnon, http.StatusUnauthorized, 0},
		{"/teams/test-team/categories/" + categoryNoTeamMember.ID, methodDelete, "", userNoTeamMember, http.StatusOK, 1},
		{"/teams/test-team/categories/" + categoryTeamMember.ID, methodDelete, "", userTeamMember, http.StatusOK, 1},
		{"/teams/test-team/categories/" + categoryViewer.ID, methodDelete, "", userViewer, http.StatusOK, 1},
		{"/teams/test-team/categories/" + categoryCommenter.ID, methodDelete, "", userCommenter, http.StatusOK, 1},
		{"/teams/test-team/categories/" + categoryEditor.ID, methodDelete, "", userEditor, http.StatusOK, 1},
		{"/teams/test-team/categories/" + categoryAdmin.ID, methodDelete, "", userAdmin, http.StatusOK, 1},
	}
	runTestCases(t, ttCases, testData, clients)
}

func TestLocalPermissionsUpdateCategoryBoard(t *testing.T) {
	th := SetupTestHelperLocalMode(t)
	defer th.TearDown()
	clients := setupLocalClients(th)
	testData := setupData(t, th)

	categoryNoTeamMember, err := th.Server.App().CreateCategory(
		&model.Category{Name: "Test category", TeamID: "test-team", UserID: userNoTeamMemberID, CreateAt: model.GetMillis(), UpdateAt: model.GetMillis()},
	)
	require.NoError(t, err)
	categoryTeamMember, err := th.Server.App().CreateCategory(
		&model.Category{Name: "Test category", TeamID: "test-team", UserID: userTeamMemberID, CreateAt: model.GetMillis(), UpdateAt: model.GetMillis()},
	)
	require.NoError(t, err)
	categoryViewer, err := th.Server.App().CreateCategory(
		&model.Category{Name: "Test category", TeamID: "test-team", UserID: userViewerID, CreateAt: model.GetMillis(), UpdateAt: model.GetMillis()},
	)
	require.NoError(t, err)
	categoryCommenter, err := th.Server.App().CreateCategory(
		&model.Category{Name: "Test category", TeamID: "test-team", UserID: userCommenterID, CreateAt: model.GetMillis(), UpdateAt: model.GetMillis()},
	)
	require.NoError(t, err)
	categoryEditor, err := th.Server.App().CreateCategory(
		&model.Category{Name: "Test category", TeamID: "test-team", UserID: userEditorID, CreateAt: model.GetMillis(), UpdateAt: model.GetMillis()},
	)
	require.NoError(t, err)
	categoryAdmin, err := th.Server.App().CreateCategory(
		&model.Category{Name: "Test category", TeamID: "test-team", UserID: userAdminID, CreateAt: model.GetMillis(), UpdateAt: model.GetMillis()},
	)
	require.NoError(t, err)

	ttCases := []TestCase{
		{"/teams/test-team/categories/any/boards/any", methodPost, "", userAnon, http.StatusUnauthorized, 0},
		{"/teams/test-team/categories/" + categoryNoTeamMember.ID + "/boards/" + testData.publicBoard.ID, methodPost, "", userNoTeamMember, http.StatusOK, 0},
		{"/teams/test-team/categories/" + categoryTeamMember.ID + "/boards/" + testData.publicBoard.ID, methodPost, "", userTeamMember, http.StatusOK, 0},
		{"/teams/test-team/categories/" + categoryViewer.ID + "/boards/" + testData.publicBoard.ID, methodPost, "", userViewer, http.StatusOK, 0},
		{"/teams/test-team/categories/" + categoryCommenter.ID + "/boards/" + testData.publicBoard.ID, methodPost, "", userCommenter, http.StatusOK, 0},
		{"/teams/test-team/categories/" + categoryEditor.ID + "/boards/" + testData.publicBoard.ID, methodPost, "", userEditor, http.StatusOK, 0},
		{"/teams/test-team/categories/" + categoryAdmin.ID + "/boards/" + testData.publicBoard.ID, methodPost, "", userAdmin, http.StatusOK, 0},
	}
	runTestCases(t, ttCases, testData, clients)
}

func TestLocalPermissionsGetFile(t *testing.T) {
	th := SetupTestHelperLocalMode(t)
	defer th.TearDown()
	clients := setupLocalClients(th)
	testData := setupData(t, th)

	newFileID, err := th.Server.App().SaveFile(bytes.NewBuffer([]byte("test")), "test-team", testData.privateBoard.ID, "test.png")
	require.NoError(t, err)

	ttCases := []TestCase{
		{"/files/teams/test-team/{PRIVATE_BOARD_ID}/" + newFileID, methodGet, "", userAnon, http.StatusUnauthorized, 0},
		{"/files/teams/test-team/{PRIVATE_BOARD_ID}/" + newFileID, methodGet, "", userNoTeamMember, http.StatusForbidden, 0},
		{"/files/teams/test-team/{PRIVATE_BOARD_ID}/" + newFileID, methodGet, "", userTeamMember, http.StatusForbidden, 0},
		{"/files/teams/test-team/{PRIVATE_BOARD_ID}/" + newFileID, methodGet, "", userViewer, http.StatusOK, 1},
		{"/files/teams/test-team/{PRIVATE_BOARD_ID}/" + newFileID, methodGet, "", userCommenter, http.StatusOK, 1},
		{"/files/teams/test-team/{PRIVATE_BOARD_ID}/" + newFileID, methodGet, "", userEditor, http.StatusOK, 1},
		{"/files/teams/test-team/{PRIVATE_BOARD_ID}/" + newFileID, methodGet, "", userAdmin, http.StatusOK, 1},

		{"/files/teams/test-team/{PRIVATE_BOARD_ID}/" + newFileID + "?read_token=invalid", methodGet, "", userAnon, http.StatusUnauthorized, 0},
		{"/files/teams/test-team/{PRIVATE_BOARD_ID}/" + newFileID + "?read_token=valid", methodGet, "", userAnon, http.StatusOK, 1},
		{"/files/teams/test-team/{PRIVATE_BOARD_ID}/" + newFileID + "?read_token=invalid", methodGet, "", userNoTeamMember, http.StatusForbidden, 0},
		{"/files/teams/test-team/{PRIVATE_BOARD_ID}/" + newFileID + "?read_token=valid", methodGet, "", userTeamMember, http.StatusOK, 1},
	}
	runTestCases(t, ttCases, testData, clients)
}

func TestLocalPermissionsCreateSubscription(t *testing.T) {
	th := SetupTestHelperLocalMode(t)
	defer th.TearDown()
	clients := setupLocalClients(th)
	testData := setupData(t, th)

	subscription := func(userID string) string {
		return toJSON(t, model.Subscription{
			BlockType:      "card",
			BlockID:        "block-3",
			SubscriberType: "user",
			SubscriberID:   userID,
			CreateAt:       model.GetMillis(),
		})
	}
	ttCases := []TestCase{
		{"/subscriptions", methodPost, subscription(""), userAnon, http.StatusUnauthorized, 0},
		{"/subscriptions", methodPost, subscription(userNoTeamMemberID), userNoTeamMember, http.StatusOK, 1},
		{"/subscriptions", methodPost, subscription(userTeamMemberID), userTeamMember, http.StatusOK, 1},
		{"/subscriptions", methodPost, subscription(userViewerID), userViewer, http.StatusOK, 1},
		{"/subscriptions", methodPost, subscription(userCommenterID), userCommenter, http.StatusOK, 1},
		{"/subscriptions", methodPost, subscription(userEditorID), userEditor, http.StatusOK, 1},
		{"/subscriptions", methodPost, subscription(userAdminID), userAdmin, http.StatusOK, 1},
	}
	runTestCases(t, ttCases, testData, clients)
}

func TestLocalPermissionsGetSubscriptions(t *testing.T) {
	th := SetupTestHelperLocalMode(t)
	defer th.TearDown()
	clients := setupLocalClients(th)
	testData := setupData(t, th)

	ttCases := []TestCase{
		{"/subscriptions/{USER_ANON_ID}", methodGet, "", userAnon, http.StatusUnauthorized, 0},
		{"/subscriptions/{USER_NO_TEAM_MEMBER_ID}", methodGet, "", userNoTeamMember, http.StatusOK, 0},
		{"/subscriptions/{USER_TEAM_MEMBER_ID}", methodGet, "", userTeamMember, http.StatusOK, 0},
		{"/subscriptions/{USER_VIEWER_ID}", methodGet, "", userViewer, http.StatusOK, 0},
		{"/subscriptions/{USER_COMMENTER_ID}", methodGet, "", userCommenter, http.StatusOK, 0},
		{"/subscriptions/{USER_EDITOR_ID}", methodGet, "", userEditor, http.StatusOK, 0},
		{"/subscriptions/{USER_ADMIN_ID}", methodGet, "", userAdmin, http.StatusOK, 0},

		{"/subscriptions/other", methodGet, "", userNoTeamMember, http.StatusForbidden, 0},
		{"/subscriptions/other", methodGet, "", userTeamMember, http.StatusForbidden, 0},
		{"/subscriptions/other", methodGet, "", userViewer, http.StatusForbidden, 0},
		{"/subscriptions/other", methodGet, "", userCommenter, http.StatusForbidden, 0},
		{"/subscriptions/other", methodGet, "", userEditor, http.StatusForbidden, 0},
		{"/subscriptions/other", methodGet, "", userAdmin, http.StatusForbidden, 0},
	}
	runTestCases(t, ttCases, testData, clients)
}

func TestLocalPermissionsDeleteSubscription(t *testing.T) {
	th := SetupTestHelperLocalMode(t)
	defer th.TearDown()
	clients := setupLocalClients(th)
	testData := setupData(t, th)

	_, err := th.Server.App().CreateSubscription(
		&model.Subscription{BlockType: "card", BlockID: "block-3", SubscriberType: "user", SubscriberID: userNoTeamMemberID, CreateAt: model.GetMillis()},
	)
	require.NoError(t, err)
	_, err = th.Server.App().CreateSubscription(
		&model.Subscription{BlockType: "card", BlockID: "block-3", SubscriberType: "user", SubscriberID: userTeamMemberID, CreateAt: model.GetMillis()},
	)
	require.NoError(t, err)
	_, err = th.Server.App().CreateSubscription(
		&model.Subscription{BlockType: "card", BlockID: "block-3", SubscriberType: "user", SubscriberID: userViewerID, CreateAt: model.GetMillis()},
	)
	require.NoError(t, err)
	_, err = th.Server.App().CreateSubscription(
		&model.Subscription{BlockType: "card", BlockID: "block-3", SubscriberType: "user", SubscriberID: userCommenterID, CreateAt: model.GetMillis()},
	)
	require.NoError(t, err)
	_, err = th.Server.App().CreateSubscription(
		&model.Subscription{BlockType: "card", BlockID: "block-3", SubscriberType: "user", SubscriberID: userEditorID, CreateAt: model.GetMillis()},
	)
	require.NoError(t, err)
	_, err = th.Server.App().CreateSubscription(
		&model.Subscription{BlockType: "card", BlockID: "block-3", SubscriberType: "user", SubscriberID: userAdminID, CreateAt: model.GetMillis()},
	)
	require.NoError(t, err)
	_, err = th.Server.App().CreateSubscription(
		&model.Subscription{BlockType: "card", BlockID: "block-3", SubscriberType: "user", SubscriberID: "other", CreateAt: model.GetMillis()},
	)
	require.NoError(t, err)

	ttCases := []TestCase{
		{"/subscriptions/block-3/{USER_ANON_ID}", methodDelete, "", userAnon, http.StatusUnauthorized, 0},
		{"/subscriptions/block-3/{USER_NO_TEAM_MEMBER_ID}", methodDelete, "", userNoTeamMember, http.StatusOK, 0},
		{"/subscriptions/block-3/{USER_TEAM_MEMBER_ID}", methodDelete, "", userTeamMember, http.StatusOK, 0},
		{"/subscriptions/block-3/{USER_VIEWER_ID}", methodDelete, "", userViewer, http.StatusOK, 0},
		{"/subscriptions/block-3/{USER_COMMENTER_ID}", methodDelete, "", userCommenter, http.StatusOK, 0},
		{"/subscriptions/block-3/{USER_EDITOR_ID}", methodDelete, "", userEditor, http.StatusOK, 0},
		{"/subscriptions/block-3/{USER_ADMIN_ID}", methodDelete, "", userAdmin, http.StatusOK, 0},

		{"/subscriptions/block-3/other", methodDelete, "", userNoTeamMember, http.StatusForbidden, 0},
		{"/subscriptions/block-3/other", methodDelete, "", userTeamMember, http.StatusForbidden, 0},
		{"/subscriptions/block-3/other", methodDelete, "", userViewer, http.StatusForbidden, 0},
		{"/subscriptions/block-3/other", methodDelete, "", userCommenter, http.StatusForbidden, 0},
		{"/subscriptions/block-3/other", methodDelete, "", userEditor, http.StatusForbidden, 0},
		{"/subscriptions/block-3/other", methodDelete, "", userAdmin, http.StatusForbidden, 0},
	}
	runTestCases(t, ttCases, testData, clients)
}

func TestLocalPermissionsOnboard(t *testing.T) {
	th := SetupTestHelperLocalMode(t)
	defer th.TearDown()
	clients := setupLocalClients(th)
	testData := setupData(t, th)

	err := th.Server.App().InitTemplates()
	require.NoError(t, err, "InitTemplates should not fail")

	ttCases := []TestCase{
		{"/teams/test-team/onboard", methodPost, "", userAnon, http.StatusUnauthorized, 0},
		{"/teams/test-team/onboard", methodPost, "", userNoTeamMember, http.StatusOK, 1},
		{"/teams/test-team/onboard", methodPost, "", userTeamMember, http.StatusOK, 1},
		{"/teams/test-team/onboard", methodPost, "", userViewer, http.StatusOK, 1},
		{"/teams/test-team/onboard", methodPost, "", userCommenter, http.StatusOK, 1},
		{"/teams/test-team/onboard", methodPost, "", userEditor, http.StatusOK, 1},
		{"/teams/test-team/onboard", methodPost, "", userAdmin, http.StatusOK, 1},
	}
	runTestCases(t, ttCases, testData, clients)
}

func TestLocalPermissionsBoardArchiveExport(t *testing.T) {
	th := SetupTestHelperLocalMode(t)
	defer th.TearDown()
	clients := setupLocalClients(th)
	testData := setupData(t, th)

	ttCases := []TestCase{
		{"/boards/{PUBLIC_BOARD_ID}/archive/export", methodGet, "", userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PUBLIC_BOARD_ID}/archive/export", methodGet, "", userNoTeamMember, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_BOARD_ID}/archive/export", methodGet, "", userTeamMember, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_BOARD_ID}/archive/export", methodGet, "", userViewer, http.StatusOK, 1},
		{"/boards/{PUBLIC_BOARD_ID}/archive/export", methodGet, "", userCommenter, http.StatusOK, 1},
		{"/boards/{PUBLIC_BOARD_ID}/archive/export", methodGet, "", userEditor, http.StatusOK, 1},
		{"/boards/{PUBLIC_BOARD_ID}/archive/export", methodGet, "", userAdmin, http.StatusOK, 1},

		{"/boards/{PRIVATE_BOARD_ID}/archive/export", methodGet, "", userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PRIVATE_BOARD_ID}/archive/export", methodGet, "", userNoTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}/archive/export", methodGet, "", userTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}/archive/export", methodGet, "", userViewer, http.StatusOK, 1},
		{"/boards/{PRIVATE_BOARD_ID}/archive/export", methodGet, "", userCommenter, http.StatusOK, 1},
		{"/boards/{PRIVATE_BOARD_ID}/archive/export", methodGet, "", userEditor, http.StatusOK, 1},
		{"/boards/{PRIVATE_BOARD_ID}/archive/export", methodGet, "", userAdmin, http.StatusOK, 1},

		{"/boards/{PUBLIC_TEMPLATE_ID}/archive/export", methodGet, "", userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/archive/export", methodGet, "", userNoTeamMember, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/archive/export", methodGet, "", userTeamMember, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/archive/export", methodGet, "", userViewer, http.StatusOK, 1},
		{"/boards/{PUBLIC_TEMPLATE_ID}/archive/export", methodGet, "", userCommenter, http.StatusOK, 1},
		{"/boards/{PUBLIC_TEMPLATE_ID}/archive/export", methodGet, "", userEditor, http.StatusOK, 1},
		{"/boards/{PUBLIC_TEMPLATE_ID}/archive/export", methodGet, "", userAdmin, http.StatusOK, 1},

		{"/boards/{PRIVATE_TEMPLATE_ID}/archive/export", methodGet, "", userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/archive/export", methodGet, "", userNoTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/archive/export", methodGet, "", userTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/archive/export", methodGet, "", userViewer, http.StatusOK, 1},
		{"/boards/{PRIVATE_TEMPLATE_ID}/archive/export", methodGet, "", userCommenter, http.StatusOK, 1},
		{"/boards/{PRIVATE_TEMPLATE_ID}/archive/export", methodGet, "", userEditor, http.StatusOK, 1},
		{"/boards/{PRIVATE_TEMPLATE_ID}/archive/export", methodGet, "", userAdmin, http.StatusOK, 1},
	}
	runTestCases(t, ttCases, testData, clients)
}

func TestLocalPermissionsBoardArchiveImport(t *testing.T) {
	th := SetupTestHelperLocalMode(t)
	defer th.TearDown()
	clients := setupLocalClients(th)
	testData := setupData(t, th)

	ttCases := []TestCase{
		{"/teams/test-team/archive/import", methodPost, "", userAnon, http.StatusUnauthorized, 0},
		{"/teams/test-team/archive/import", methodPost, "", userNoTeamMember, http.StatusOK, 1},
		{"/teams/test-team/archive/import", methodPost, "", userTeamMember, http.StatusOK, 1},
		{"/teams/test-team/archive/import", methodPost, "", userViewer, http.StatusOK, 1},
		{"/teams/test-team/archive/import", methodPost, "", userCommenter, http.StatusOK, 1},
		{"/teams/test-team/archive/import", methodPost, "", userEditor, http.StatusOK, 1},
		{"/teams/test-team/archive/import", methodPost, "", userAdmin, http.StatusOK, 1},
	}
	runTestCases(t, ttCases, testData, clients)
}
