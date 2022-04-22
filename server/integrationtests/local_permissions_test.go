//nolint:dupl
package integrationtests

import (
	"fmt"
	"net/http"
	"testing"

	"github.com/mattermost/focalboard/server/model"
	"github.com/stretchr/testify/require"
)

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
