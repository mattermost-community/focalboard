//nolint:dupl
package integrationtests

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"strings"
	"testing"

	"github.com/mattermost/focalboard/server/client"
	"github.com/mattermost/focalboard/server/model"
	"github.com/stretchr/testify/require"
)

type Clients struct {
	Anon         *client.Client
	NoTeamMember *client.Client
	TeamMember   *client.Client
	Viewer       *client.Client
	Commenter    *client.Client
	Editor       *client.Client
	Admin        *client.Client
}

const (
	methodPost   = "POST"
	methodGet    = "GET"
	methodPut    = "PUT"
	methodDelete = "DELETE"
	methodPatch  = "PATCH"
)

type TestCase struct {
	url                string
	method             string
	body               string
	userRole           string // userAnon, userNoTeamMember, userTeamMember, userViewer, userCommenter, userEditor or userAdmin
	expectedStatusCode int
	totalResults       int
}

func setupClients(th *TestHelper) Clients {
	// user1
	clients := Clients{
		Anon:         client.NewClient(th.Server.Config().ServerRoot, ""),
		NoTeamMember: client.NewClient(th.Server.Config().ServerRoot, ""),
		TeamMember:   client.NewClient(th.Server.Config().ServerRoot, ""),
		Viewer:       client.NewClient(th.Server.Config().ServerRoot, ""),
		Commenter:    client.NewClient(th.Server.Config().ServerRoot, ""),
		Editor:       client.NewClient(th.Server.Config().ServerRoot, ""),
		Admin:        client.NewClient(th.Server.Config().ServerRoot, ""),
	}

	clients.NoTeamMember.HTTPHeader["Mattermost-User-Id"] = userNoTeamMember
	clients.TeamMember.HTTPHeader["Mattermost-User-Id"] = userTeamMember
	clients.Viewer.HTTPHeader["Mattermost-User-Id"] = userViewer
	clients.Commenter.HTTPHeader["Mattermost-User-Id"] = userCommenter
	clients.Editor.HTTPHeader["Mattermost-User-Id"] = userEditor
	clients.Admin.HTTPHeader["Mattermost-User-Id"] = userAdmin

	return clients
}

func toJSON(t *testing.T, obj interface{}) string {
	result, err := json.Marshal(obj)
	require.NoError(t, err)
	return string(result)
}

type TestData struct {
	publicBoard     *model.Board
	privateBoard    *model.Board
	publicTemplate  *model.Board
	privateTemplate *model.Board
}

func setupData(t *testing.T, th *TestHelper) TestData {
	customTemplate1, err := th.Server.App().CreateBoard(&model.Board{Title: "Custom template 1", TeamID: "test-team", IsTemplate: true, Type: model.BoardTypeOpen}, userAdmin, true)
	require.NoError(t, err)
	err = th.Server.App().InsertBlock(model.Block{ID: "block-1", Title: "Test", Type: "card", BoardID: customTemplate1.ID}, userAdmin)
	require.NoError(t, err)
	customTemplate2, err := th.Server.App().CreateBoard(&model.Board{Title: "Custom template 2", TeamID: "test-team", IsTemplate: true, Type: model.BoardTypePrivate}, userAdmin, true)
	require.NoError(t, err)
	err = th.Server.App().InsertBlock(model.Block{ID: "block-2", Title: "Test", Type: "card", BoardID: customTemplate2.ID}, userAdmin)
	require.NoError(t, err)

	board1, err := th.Server.App().CreateBoard(&model.Board{Title: "Board 1", TeamID: "test-team", Type: model.BoardTypeOpen}, userAdmin, true)
	require.NoError(t, err)
	err = th.Server.App().InsertBlock(model.Block{ID: "block-3", Title: "Test", Type: "card", BoardID: board1.ID}, userAdmin)
	require.NoError(t, err)
	board2, err := th.Server.App().CreateBoard(&model.Board{Title: "Board 2", TeamID: "test-team", Type: model.BoardTypePrivate}, userAdmin, true)
	require.NoError(t, err)
	err = th.Server.App().InsertBlock(model.Block{ID: "block-4", Title: "Test", Type: "card", BoardID: board2.ID}, userAdmin)
	require.NoError(t, err)

	err = th.Server.App().UpsertSharing(model.Sharing{ID: board2.ID, Enabled: true, Token: "valid", ModifiedBy: userAdmin, UpdateAt: model.GetMillis()})
	require.NoError(t, err)

	_, err = th.Server.App().AddMemberToBoard(&model.BoardMember{BoardID: customTemplate1.ID, UserID: userViewer, SchemeViewer: true})
	require.NoError(t, err)
	_, err = th.Server.App().AddMemberToBoard(&model.BoardMember{BoardID: customTemplate2.ID, UserID: userViewer, SchemeViewer: true})
	require.NoError(t, err)
	_, err = th.Server.App().AddMemberToBoard(&model.BoardMember{BoardID: customTemplate1.ID, UserID: userCommenter, SchemeCommenter: true})
	require.NoError(t, err)
	_, err = th.Server.App().AddMemberToBoard(&model.BoardMember{BoardID: customTemplate2.ID, UserID: userCommenter, SchemeCommenter: true})
	require.NoError(t, err)
	_, err = th.Server.App().AddMemberToBoard(&model.BoardMember{BoardID: customTemplate1.ID, UserID: userEditor, SchemeEditor: true})
	require.NoError(t, err)
	_, err = th.Server.App().AddMemberToBoard(&model.BoardMember{BoardID: customTemplate2.ID, UserID: userEditor, SchemeEditor: true})
	require.NoError(t, err)
	_, err = th.Server.App().AddMemberToBoard(&model.BoardMember{BoardID: customTemplate1.ID, UserID: userAdmin, SchemeAdmin: true})
	require.NoError(t, err)
	_, err = th.Server.App().AddMemberToBoard(&model.BoardMember{BoardID: customTemplate2.ID, UserID: userAdmin, SchemeAdmin: true})
	require.NoError(t, err)

	_, err = th.Server.App().AddMemberToBoard(&model.BoardMember{BoardID: board1.ID, UserID: userViewer, SchemeViewer: true})
	require.NoError(t, err)
	_, err = th.Server.App().AddMemberToBoard(&model.BoardMember{BoardID: board2.ID, UserID: userViewer, SchemeViewer: true})
	require.NoError(t, err)
	_, err = th.Server.App().AddMemberToBoard(&model.BoardMember{BoardID: board1.ID, UserID: userCommenter, SchemeCommenter: true})
	require.NoError(t, err)
	_, err = th.Server.App().AddMemberToBoard(&model.BoardMember{BoardID: board2.ID, UserID: userCommenter, SchemeCommenter: true})
	require.NoError(t, err)
	_, err = th.Server.App().AddMemberToBoard(&model.BoardMember{BoardID: board1.ID, UserID: userEditor, SchemeEditor: true})
	require.NoError(t, err)
	_, err = th.Server.App().AddMemberToBoard(&model.BoardMember{BoardID: board2.ID, UserID: userEditor, SchemeEditor: true})
	require.NoError(t, err)
	_, err = th.Server.App().AddMemberToBoard(&model.BoardMember{BoardID: board1.ID, UserID: userAdmin, SchemeAdmin: true})
	require.NoError(t, err)
	_, err = th.Server.App().AddMemberToBoard(&model.BoardMember{BoardID: board2.ID, UserID: userAdmin, SchemeAdmin: true})
	require.NoError(t, err)

	return TestData{
		publicBoard:     board1,
		privateBoard:    board2,
		publicTemplate:  customTemplate1,
		privateTemplate: customTemplate2,
	}
}

func runTestCases(t *testing.T, ttCases []TestCase, testData TestData, clients Clients) {
	for _, tc := range ttCases {
		t.Run(tc.userRole+": "+tc.method+" "+tc.url, func(t *testing.T) {
			reqClient := clients.Anon
			switch tc.userRole {
			case userAnon:
				reqClient = clients.Anon
			case userNoTeamMember:
				reqClient = clients.NoTeamMember
			case userTeamMember:
				reqClient = clients.TeamMember
			case userViewer:
				reqClient = clients.Viewer
			case userCommenter:
				reqClient = clients.Commenter
			case userEditor:
				reqClient = clients.Editor
			case userAdmin:
				reqClient = clients.Admin
			}

			url := strings.ReplaceAll(tc.url, "{PRIVATE_BOARD_ID}", testData.privateBoard.ID)
			url = strings.ReplaceAll(url, "{PUBLIC_BOARD_ID}", testData.publicBoard.ID)
			url = strings.ReplaceAll(url, "{PUBLIC_TEMPLATE_ID}", testData.publicTemplate.ID)
			url = strings.ReplaceAll(url, "{PRIVATE_TEMPLATE_ID}", testData.privateTemplate.ID)

			var response *http.Response
			var err error
			switch tc.method {
			case methodGet:
				response, err = reqClient.DoAPIGet(url, "")
				defer response.Body.Close()
			case methodPost:
				response, err = reqClient.DoAPIPost(url, tc.body)
				defer response.Body.Close()
			case methodPatch:
				response, err = reqClient.DoAPIPatch(url, tc.body)
				defer response.Body.Close()
			case methodPut:
				response, err = reqClient.DoAPIPut(url, tc.body)
				defer response.Body.Close()
			case methodDelete:
				response, err = reqClient.DoAPIDelete(url, tc.body)
				defer response.Body.Close()
			}

			require.Equal(t, tc.expectedStatusCode, response.StatusCode)
			if tc.expectedStatusCode >= 200 && tc.expectedStatusCode < 300 {
				require.NoError(t, err)
			}
			if tc.expectedStatusCode >= 200 && tc.expectedStatusCode < 300 {
				body, err := ioutil.ReadAll(response.Body)
				if err != nil {
					require.Fail(t, err.Error())
				}
				if strings.HasPrefix(string(body), "[") {
					var data []interface{}
					err = json.Unmarshal(body, &data)
					if err != nil {
						require.Fail(t, err.Error())
					}
					require.Len(t, data, tc.totalResults)
				} else {
					if tc.totalResults > 0 {
						require.Equal(t, 1, tc.totalResults)
						require.Greater(t, len(string(body)), 2)
					} else {
						require.Len(t, string(body), 2)
					}
				}
			}
		})
	}
}

func TestPermissionsGetTeamBoards(t *testing.T) {
	th := SetupTestHelperPluginMode(t)
	defer th.TearDown()
	testData := setupData(t, th)
	clients := setupClients(th)

	ttCases := []TestCase{
		{"/teams/test-team/boards", methodGet, "", userAnon, http.StatusUnauthorized, 0},
		{"/teams/test-team/boards", methodGet, "", userNoTeamMember, http.StatusForbidden, 0},
		{"/teams/test-team/boards", methodGet, "", userTeamMember, http.StatusOK, 1},
		{"/teams/test-team/boards", methodGet, "", userViewer, http.StatusOK, 2},
		{"/teams/test-team/boards", methodGet, "", userCommenter, http.StatusOK, 2},
		{"/teams/test-team/boards", methodGet, "", userEditor, http.StatusOK, 2},
		{"/teams/test-team/boards", methodGet, "", userAdmin, http.StatusOK, 2},
	}
	runTestCases(t, ttCases, testData, clients)
}

func TestPermissionsSearchTeamBoards(t *testing.T) {
	th := SetupTestHelperPluginMode(t)
	defer th.TearDown()
	testData := setupData(t, th)
	clients := setupClients(th)

	ttCases := []TestCase{
		// Search boards
		{"/teams/test-team/boards/search?q=b", methodGet, "", userAnon, http.StatusUnauthorized, 0},
		{"/teams/test-team/boards/search?q=b", methodGet, "", userNoTeamMember, http.StatusForbidden, 0},
		{"/teams/test-team/boards/search?q=b", methodGet, "", userTeamMember, http.StatusOK, 1},
		{"/teams/test-team/boards/search?q=b", methodGet, "", userViewer, http.StatusOK, 2},
		{"/teams/test-team/boards/search?q=b", methodGet, "", userCommenter, http.StatusOK, 2},
		{"/teams/test-team/boards/search?q=b", methodGet, "", userEditor, http.StatusOK, 2},
		{"/teams/test-team/boards/search?q=b", methodGet, "", userAdmin, http.StatusOK, 2},
	}
	runTestCases(t, ttCases, testData, clients)
}

func TestPermissionsGetTeamTemplates(t *testing.T) {
	th := SetupTestHelperPluginMode(t)
	defer th.TearDown()
	testData := setupData(t, th)
	clients := setupClients(th)

	err := th.Server.App().InitTemplates()
	require.NoError(t, err, "InitTemplates should succeed")

	builtInTemplateCount := 7

	ttCases := []TestCase{
		// Get Team Boards
		{"/teams/test-team/templates", methodGet, "", userAnon, http.StatusUnauthorized, 0},
		{"/teams/test-team/templates", methodGet, "", userNoTeamMember, http.StatusForbidden, 0},
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

func TestPermissionsCreateBoard(t *testing.T) {
	th := SetupTestHelperPluginMode(t)
	defer th.TearDown()
	testData := setupData(t, th)
	clients := setupClients(th)

	publicBoard := toJSON(t, model.Board{Title: "Board To Create", TeamID: "test-team", Type: model.BoardTypeOpen})
	privateBoard := toJSON(t, model.Board{Title: "Board To Create", TeamID: "test-team", Type: model.BoardTypeOpen})

	ttCases := []TestCase{
		// Create Public boards
		{"/boards", methodPost, publicBoard, userAnon, http.StatusUnauthorized, 0},
		{"/boards", methodPost, publicBoard, userNoTeamMember, http.StatusForbidden, 0},
		{"/boards", methodPost, publicBoard, userTeamMember, http.StatusOK, 1},

		// Create private boards
		{"/boards", methodPost, privateBoard, userAnon, http.StatusUnauthorized, 0},
		{"/boards", methodPost, privateBoard, userNoTeamMember, http.StatusForbidden, 0},
		{"/boards", methodPost, privateBoard, userTeamMember, http.StatusOK, 1},
	}
	runTestCases(t, ttCases, testData, clients)
}

func TestPermissionsGetBoard(t *testing.T) {
	th := SetupTestHelperPluginMode(t)
	defer th.TearDown()
	testData := setupData(t, th)
	clients := setupClients(th)

	ttCases := []TestCase{
		{"/boards/{PRIVATE_BOARD_ID}", methodGet, "", userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PRIVATE_BOARD_ID}", methodGet, "", userNoTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}", methodGet, "", userTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}", methodGet, "", userViewer, http.StatusOK, 1},
		{"/boards/{PRIVATE_BOARD_ID}", methodGet, "", userCommenter, http.StatusOK, 1},
		{"/boards/{PRIVATE_BOARD_ID}", methodGet, "", userEditor, http.StatusOK, 1},
		{"/boards/{PRIVATE_BOARD_ID}", methodGet, "", userAdmin, http.StatusOK, 1},

		{"/boards/{PUBLIC_BOARD_ID}", methodGet, "", userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PUBLIC_BOARD_ID}", methodGet, "", userNoTeamMember, http.StatusForbidden, 0},
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
		{"/boards/{PUBLIC_TEMPLATE_ID}", methodGet, "", userNoTeamMember, http.StatusForbidden, 0},
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

func TestPermissionsPatchBoard(t *testing.T) {
	th := SetupTestHelperPluginMode(t)
	defer th.TearDown()
	testData := setupData(t, th)
	clients := setupClients(th)

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

func TestPermissionsDeleteBoard(t *testing.T) {
	th := SetupTestHelperPluginMode(t)
	defer th.TearDown()
	testData := setupData(t, th)
	clients := setupClients(th)

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

func TestPermissionsDuplicateBoard(t *testing.T) {
	th := SetupTestHelperPluginMode(t)
	defer th.TearDown()
	testData := setupData(t, th)
	clients := setupClients(th)

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
		{"/boards/{PUBLIC_TEMPLATE_ID}/duplicate", methodPost, "", userNoTeamMember, http.StatusForbidden, 0},
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
		{"/boards/{PUBLIC_TEMPLATE_ID}/duplicate?toTeam=other-team", methodPost, "", userNoTeamMember, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/duplicate?toTeam=other-team", methodPost, "", userTeamMember, http.StatusOK, 1},
		{"/boards/{PUBLIC_TEMPLATE_ID}/duplicate?toTeam=other-team", methodPost, "", userViewer, http.StatusOK, 1},
		{"/boards/{PUBLIC_TEMPLATE_ID}/duplicate?toTeam=other-team", methodPost, "", userCommenter, http.StatusOK, 1},
		{"/boards/{PUBLIC_TEMPLATE_ID}/duplicate?toTeam=other-team", methodPost, "", userEditor, http.StatusOK, 1},
		{"/boards/{PUBLIC_TEMPLATE_ID}/duplicate?toTeam=other-team", methodPost, "", userAdmin, http.StatusOK, 1},
	}
	runTestCases(t, ttCases, testData, clients)
}

func TestPermissionsGetBoardBlocks(t *testing.T) {
	th := SetupTestHelperPluginMode(t)
	defer th.TearDown()
	testData := setupData(t, th)
	clients := setupClients(th)

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
		{"/boards/{PUBLIC_TEMPLATE_ID}/blocks", methodGet, "", userNoTeamMember, http.StatusForbidden, 0},
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

func TestPermissionsCreateBoardBlocks(t *testing.T) {
	th := SetupTestHelperPluginMode(t)
	defer th.TearDown()
	testData := setupData(t, th)
	clients := setupClients(th)

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

func TestPermissionsPatchBoardBlocks(t *testing.T) {
	th := SetupTestHelperPluginMode(t)
	defer th.TearDown()
	testData := setupData(t, th)
	clients := setupClients(th)

	counter := 0
	newBlocksPatchJSON := func(blockID string) string {
		counter++
		newTitle := "New Title"
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

func TestPermissionsPatchBoardBlock(t *testing.T) {
	th := SetupTestHelperPluginMode(t)
	defer th.TearDown()
	testData := setupData(t, th)
	clients := setupClients(th)

	newTitle := "New Title"
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

func TestPermissionsDeleteBoardBlock(t *testing.T) {
	th := SetupTestHelperPluginMode(t)
	defer th.TearDown()
	testData := setupData(t, th)
	clients := setupClients(th)

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

func TestPermissionsUndeleteBoardBlock(t *testing.T) {
	th := SetupTestHelperPluginMode(t)
	defer th.TearDown()
	testData := setupData(t, th)
	clients := setupClients(th)

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

func TestPermissionsUndeleteBoard(t *testing.T) {
	th := SetupTestHelperPluginMode(t)
	defer th.TearDown()
	testData := setupData(t, th)
	clients := setupClients(th)

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

func TestPermissionsDuplicateBoardBlock(t *testing.T) {
	th := SetupTestHelperPluginMode(t)
	defer th.TearDown()
	testData := setupData(t, th)
	clients := setupClients(th)

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

func TestPermissionsGetBoardMembers(t *testing.T) {
	th := SetupTestHelperPluginMode(t)
	defer th.TearDown()
	testData := setupData(t, th)
	clients := setupClients(th)

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

func TestPermissionsCreateBoardMembers(t *testing.T) {
	th := SetupTestHelperPluginMode(t)
	defer th.TearDown()
	testData := setupData(t, th)
	clients := setupClients(th)

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

func TestPermissionsUpdateBoardMember(t *testing.T) {
	th := SetupTestHelperPluginMode(t)
	defer th.TearDown()
	testData := setupData(t, th)
	clients := setupClients(th)

	boardMemberJSON := func(boardID string) string {
		return toJSON(t, model.BoardMember{
			BoardID:      boardID,
			UserID:       userTeamMember,
			SchemeEditor: false,
			SchemeViewer: true,
		})
	}

	ttCases := []TestCase{
		{"/boards/{PRIVATE_BOARD_ID}/members/viewer", methodPut, boardMemberJSON(testData.privateBoard.ID), userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PRIVATE_BOARD_ID}/members/viewer", methodPut, boardMemberJSON(testData.privateBoard.ID), userNoTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}/members/viewer", methodPut, boardMemberJSON(testData.privateBoard.ID), userTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}/members/viewer", methodPut, boardMemberJSON(testData.privateBoard.ID), userViewer, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}/members/viewer", methodPut, boardMemberJSON(testData.privateBoard.ID), userCommenter, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}/members/viewer", methodPut, boardMemberJSON(testData.privateBoard.ID), userEditor, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}/members/viewer", methodPut, boardMemberJSON(testData.privateBoard.ID), userAdmin, http.StatusOK, 1},

		{"/boards/{PUBLIC_BOARD_ID}/members/viewer", methodPut, boardMemberJSON(testData.publicBoard.ID), userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PUBLIC_BOARD_ID}/members/viewer", methodPut, boardMemberJSON(testData.publicBoard.ID), userNoTeamMember, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_BOARD_ID}/members/viewer", methodPut, boardMemberJSON(testData.publicBoard.ID), userTeamMember, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_BOARD_ID}/members/viewer", methodPut, boardMemberJSON(testData.publicBoard.ID), userViewer, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_BOARD_ID}/members/viewer", methodPut, boardMemberJSON(testData.publicBoard.ID), userCommenter, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_BOARD_ID}/members/viewer", methodPut, boardMemberJSON(testData.publicBoard.ID), userEditor, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_BOARD_ID}/members/viewer", methodPut, boardMemberJSON(testData.publicBoard.ID), userAdmin, http.StatusOK, 1},

		{"/boards/{PRIVATE_TEMPLATE_ID}/members/viewer", methodPut, boardMemberJSON(testData.privateTemplate.ID), userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/members/viewer", methodPut, boardMemberJSON(testData.privateTemplate.ID), userNoTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/members/viewer", methodPut, boardMemberJSON(testData.privateTemplate.ID), userTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/members/viewer", methodPut, boardMemberJSON(testData.privateTemplate.ID), userViewer, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/members/viewer", methodPut, boardMemberJSON(testData.privateTemplate.ID), userCommenter, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/members/viewer", methodPut, boardMemberJSON(testData.privateTemplate.ID), userEditor, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/members/viewer", methodPut, boardMemberJSON(testData.privateTemplate.ID), userAdmin, http.StatusOK, 1},

		{"/boards/{PUBLIC_TEMPLATE_ID}/members/viewer", methodPut, boardMemberJSON(testData.publicTemplate.ID), userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/members/viewer", methodPut, boardMemberJSON(testData.publicTemplate.ID), userNoTeamMember, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/members/viewer", methodPut, boardMemberJSON(testData.publicTemplate.ID), userTeamMember, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/members/viewer", methodPut, boardMemberJSON(testData.publicTemplate.ID), userViewer, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/members/viewer", methodPut, boardMemberJSON(testData.publicTemplate.ID), userCommenter, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/members/viewer", methodPut, boardMemberJSON(testData.publicTemplate.ID), userEditor, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/members/viewer", methodPut, boardMemberJSON(testData.publicTemplate.ID), userAdmin, http.StatusOK, 1},

		// Invalid boardID/memberID combination
		{"/boards/{PUBLIC_TEMPLATE_ID}/members/team-member", methodPut, "", userAdmin, http.StatusBadRequest, 0},

		// Invalid boardID
		{"/boards/invalid/members/viewer", methodPut, "", userAdmin, http.StatusBadRequest, 0},

		// Invalid memberID
		{"/boards/{PUBLIC_TEMPLATE_ID}/members/invalid", methodPut, "", userAdmin, http.StatusBadRequest, 0},
	}
	runTestCases(t, ttCases, testData, clients)
}

func TestPermissionsDeleteBoardMember(t *testing.T) {
	th := SetupTestHelperPluginMode(t)
	defer th.TearDown()
	testData := setupData(t, th)
	clients := setupClients(th)

	_, err := th.Server.App().AddMemberToBoard(&model.BoardMember{BoardID: testData.publicBoard.ID, UserID: userTeamMember, SchemeViewer: true})
	require.NoError(t, err)
	_, err = th.Server.App().AddMemberToBoard(&model.BoardMember{BoardID: testData.privateBoard.ID, UserID: userTeamMember, SchemeViewer: true})
	require.NoError(t, err)
	_, err = th.Server.App().AddMemberToBoard(&model.BoardMember{BoardID: testData.publicTemplate.ID, UserID: userTeamMember, SchemeViewer: true})
	require.NoError(t, err)
	_, err = th.Server.App().AddMemberToBoard(&model.BoardMember{BoardID: testData.privateTemplate.ID, UserID: userTeamMember, SchemeViewer: true})
	require.NoError(t, err)

	ttCases := []TestCase{
		{"/boards/{PRIVATE_BOARD_ID}/members/team-member", methodDelete, "", userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PRIVATE_BOARD_ID}/members/team-member", methodDelete, "", userNoTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}/members/team-member", methodDelete, "", userTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}/members/team-member", methodDelete, "", userViewer, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}/members/team-member", methodDelete, "", userCommenter, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}/members/team-member", methodDelete, "", userEditor, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}/members/team-member", methodDelete, "", userAdmin, http.StatusOK, 0},

		{"/boards/{PUBLIC_BOARD_ID}/members/team-member", methodDelete, "", userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PUBLIC_BOARD_ID}/members/team-member", methodDelete, "", userNoTeamMember, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_BOARD_ID}/members/team-member", methodDelete, "", userTeamMember, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_BOARD_ID}/members/team-member", methodDelete, "", userViewer, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_BOARD_ID}/members/team-member", methodDelete, "", userCommenter, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_BOARD_ID}/members/team-member", methodDelete, "", userEditor, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_BOARD_ID}/members/team-member", methodDelete, "", userAdmin, http.StatusOK, 0},

		{"/boards/{PRIVATE_TEMPLATE_ID}/members/team-member", methodDelete, "", userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/members/team-member", methodDelete, "", userNoTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/members/team-member", methodDelete, "", userTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/members/team-member", methodDelete, "", userViewer, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/members/team-member", methodDelete, "", userCommenter, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/members/team-member", methodDelete, "", userEditor, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/members/team-member", methodDelete, "", userAdmin, http.StatusOK, 0},

		{"/boards/{PUBLIC_TEMPLATE_ID}/members/team-member", methodDelete, "", userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/members/team-member", methodDelete, "", userNoTeamMember, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/members/team-member", methodDelete, "", userTeamMember, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/members/team-member", methodDelete, "", userViewer, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/members/team-member", methodDelete, "", userCommenter, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/members/team-member", methodDelete, "", userEditor, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/members/team-member", methodDelete, "", userAdmin, http.StatusOK, 0},

		// Invalid boardID/memberID combination
		{"/boards/{PUBLIC_TEMPLATE_ID}/members/team-member", methodDelete, "", userAdmin, http.StatusOK, 0},

		// Invalid boardID
		{"/boards/invalid/members/viewer", methodDelete, "", userAdmin, http.StatusNotFound, 0},

		// Invalid memberID
		{"/boards/{PUBLIC_TEMPLATE_ID}/members/invalid", methodDelete, "", userAdmin, http.StatusOK, 0},
	}
	runTestCases(t, ttCases, testData, clients)
}

func TestPermissionsJoinBoardAsMember(t *testing.T) {
	th := SetupTestHelperPluginMode(t)
	defer th.TearDown()
	testData := setupData(t, th)
	clients := setupClients(th)

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
		{"/boards/{PUBLIC_BOARD_ID}/join", methodPost, "", userNoTeamMember, http.StatusForbidden, 0},
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
		{"/boards/{PUBLIC_TEMPLATE_ID}/join", methodPost, "", userNoTeamMember, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/join", methodPost, "", userTeamMember, http.StatusOK, 1},
		{"/boards/{PUBLIC_TEMPLATE_ID}/join", methodPost, "", userViewer, http.StatusOK, 1},
		{"/boards/{PUBLIC_TEMPLATE_ID}/join", methodPost, "", userCommenter, http.StatusOK, 1},
		{"/boards/{PUBLIC_TEMPLATE_ID}/join", methodPost, "", userEditor, http.StatusOK, 1},
		{"/boards/{PUBLIC_TEMPLATE_ID}/join", methodPost, "", userAdmin, http.StatusOK, 1},
	}
	runTestCases(t, ttCases, testData, clients)
}

func TestPermissionsLeaveBoardAsMember(t *testing.T) {
	th := SetupTestHelperPluginMode(t)
	defer th.TearDown()
	testData := setupData(t, th)
	clients := setupClients(th)

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

	_, err = th.Server.App().AddMemberToBoard(&model.BoardMember{BoardID: testData.publicBoard.ID, UserID: userAdmin, SchemeAdmin: true})
	require.NoError(t, err)
	_, err = th.Server.App().AddMemberToBoard(&model.BoardMember{BoardID: testData.privateBoard.ID, UserID: userAdmin, SchemeAdmin: true})
	require.NoError(t, err)
	_, err = th.Server.App().AddMemberToBoard(&model.BoardMember{BoardID: testData.publicTemplate.ID, UserID: userAdmin, SchemeAdmin: true})
	require.NoError(t, err)
	_, err = th.Server.App().AddMemberToBoard(&model.BoardMember{BoardID: testData.privateTemplate.ID, UserID: userAdmin, SchemeAdmin: true})
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

func TestPermissionsShareBoard(t *testing.T) {
	th := SetupTestHelperPluginMode(t)
	defer th.TearDown()
	testData := setupData(t, th)
	clients := setupClients(th)

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

func TestPermissionsGetSharedBoardInfo(t *testing.T) {
	th := SetupTestHelperPluginMode(t)
	defer th.TearDown()
	testData := setupData(t, th)
	clients := setupClients(th)

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

func TestPermissionsListTeams(t *testing.T) {
	th := SetupTestHelperPluginMode(t)
	defer th.TearDown()
	testData := setupData(t, th)
	clients := setupClients(th)

	ttCases := []TestCase{
		{"/teams", methodGet, "", userAnon, http.StatusUnauthorized, 0},
		{"/teams", methodGet, "", userNoTeamMember, http.StatusOK, 0},
		{"/teams", methodGet, "", userTeamMember, http.StatusOK, 2},
		{"/teams", methodGet, "", userViewer, http.StatusOK, 2},
		{"/teams", methodGet, "", userCommenter, http.StatusOK, 2},
		{"/teams", methodGet, "", userEditor, http.StatusOK, 2},
		{"/teams", methodGet, "", userAdmin, http.StatusOK, 2},
	}
	runTestCases(t, ttCases, testData, clients)
}

func TestPermissionsGetTeam(t *testing.T) {
	th := SetupTestHelperPluginMode(t)
	defer th.TearDown()
	testData := setupData(t, th)
	clients := setupClients(th)

	ttCases := []TestCase{
		{"/teams/test-team", methodGet, "", userAnon, http.StatusUnauthorized, 0},
		{"/teams/test-team", methodGet, "", userNoTeamMember, http.StatusForbidden, 0},
		{"/teams/test-team", methodGet, "", userTeamMember, http.StatusOK, 1},
		{"/teams/test-team", methodGet, "", userViewer, http.StatusOK, 1},
		{"/teams/test-team", methodGet, "", userCommenter, http.StatusOK, 1},
		{"/teams/test-team", methodGet, "", userEditor, http.StatusOK, 1},
		{"/teams/test-team", methodGet, "", userAdmin, http.StatusOK, 1},

		{"/teams/empty-team", methodGet, "", userAnon, http.StatusUnauthorized, 0},
		{"/teams/empty-team", methodGet, "", userNoTeamMember, http.StatusForbidden, 0},
		{"/teams/empty-team", methodGet, "", userTeamMember, http.StatusForbidden, 0},
		{"/teams/empty-team", methodGet, "", userViewer, http.StatusForbidden, 0},
		{"/teams/empty-team", methodGet, "", userCommenter, http.StatusForbidden, 0},
		{"/teams/empty-team", methodGet, "", userEditor, http.StatusForbidden, 0},
		{"/teams/empty-team", methodGet, "", userAdmin, http.StatusForbidden, 0},
	}
	runTestCases(t, ttCases, testData, clients)
}

func TestPermissionsRegenerateSignupTokenPluginMode(t *testing.T) {
	th := SetupTestHelperPluginMode(t)
	defer th.TearDown()
	testData := setupData(t, th)
	clients := setupClients(th)

	ttCases := []TestCase{
		{"/teams/test-team/regenerate_signup_token", methodPost, "", userAnon, http.StatusUnauthorized, 0},
		{"/teams/test-team/regenerate_signup_token", methodPost, "", userAdmin, http.StatusNotImplemented, 0},

		{"/teams/empty-team/regenerate_signup_token", methodPost, "", userAnon, http.StatusUnauthorized, 0},
		{"/teams/empty-team/regenerate_signup_token", methodPost, "", userAdmin, http.StatusNotImplemented, 0},
	}
	runTestCases(t, ttCases, testData, clients)
}

func TestPermissionsGetTeamUsers(t *testing.T) {
	th := SetupTestHelperPluginMode(t)
	defer th.TearDown()
	testData := setupData(t, th)
	clients := setupClients(th)

	ttCases := []TestCase{
		{"/teams/test-team/users", methodGet, "", userAnon, http.StatusUnauthorized, 0},
		{"/teams/test-team/users", methodGet, "", userNoTeamMember, http.StatusForbidden, 0},
		{"/teams/test-team/users", methodGet, "", userTeamMember, http.StatusOK, 5},
		{"/teams/test-team/users", methodGet, "", userViewer, http.StatusOK, 5},
		{"/teams/test-team/users", methodGet, "", userCommenter, http.StatusOK, 5},
		{"/teams/test-team/users", methodGet, "", userEditor, http.StatusOK, 5},
		{"/teams/test-team/users", methodGet, "", userAdmin, http.StatusOK, 5},

		{"/teams/empty-team/users", methodGet, "", userAnon, http.StatusUnauthorized, 0},
		{"/teams/empty-team/users", methodGet, "", userNoTeamMember, http.StatusForbidden, 0},
		{"/teams/empty-team/users", methodGet, "", userTeamMember, http.StatusForbidden, 0},
		{"/teams/empty-team/users", methodGet, "", userViewer, http.StatusForbidden, 0},
		{"/teams/empty-team/users", methodGet, "", userCommenter, http.StatusForbidden, 0},
		{"/teams/empty-team/users", methodGet, "", userEditor, http.StatusForbidden, 0},
		{"/teams/empty-team/users", methodGet, "", userAdmin, http.StatusForbidden, 0},
	}
	runTestCases(t, ttCases, testData, clients)
}

func TestPermissionsTeamArchiveExportPluginMode(t *testing.T) {
	th := SetupTestHelperPluginMode(t)
	defer th.TearDown()
	testData := setupData(t, th)
	clients := setupClients(th)

	ttCases := []TestCase{
		{"/teams/test-team/archive/export", methodGet, "", userAnon, http.StatusUnauthorized, 0},
		{"/teams/test-team/archive/export", methodGet, "", userAdmin, http.StatusNotImplemented, 0},

		{"/teams/empty-team/archive/export", methodGet, "", userAnon, http.StatusUnauthorized, 0},
		{"/teams/empty-team/archive/export", methodGet, "", userAdmin, http.StatusNotImplemented, 0},
	}
	runTestCases(t, ttCases, testData, clients)
}

func TestPermissionsUploadFile(t *testing.T) {
	th := SetupTestHelperPluginMode(t)
	defer th.TearDown()
	testData := setupData(t, th)
	clients := setupClients(th)

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

func TestPermissionsGetMe(t *testing.T) {
	th := SetupTestHelperPluginMode(t)
	defer th.TearDown()
	testData := setupData(t, th)
	clients := setupClients(th)

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

func TestPermissionsGetMyMemberships(t *testing.T) {
	th := SetupTestHelperPluginMode(t)
	defer th.TearDown()
	testData := setupData(t, th)
	clients := setupClients(th)

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

func TestPermissionsGetUser(t *testing.T) {
	th := SetupTestHelperPluginMode(t)
	defer th.TearDown()
	testData := setupData(t, th)
	clients := setupClients(th)

	ttCases := []TestCase{
		{"/users/no-team-member", methodGet, "", userAnon, http.StatusUnauthorized, 0},
		{"/users/no-team-member", methodGet, "", userNoTeamMember, http.StatusOK, 1},
		{"/users/no-team-member", methodGet, "", userTeamMember, http.StatusOK, 1},
		{"/users/no-team-member", methodGet, "", userViewer, http.StatusOK, 1},
		{"/users/no-team-member", methodGet, "", userCommenter, http.StatusOK, 1},
		{"/users/no-team-member", methodGet, "", userEditor, http.StatusOK, 1},
		{"/users/no-team-member", methodGet, "", userAdmin, http.StatusOK, 1},

		{"/users/team-member", methodGet, "", userAnon, http.StatusUnauthorized, 0},
		{"/users/team-member", methodGet, "", userNoTeamMember, http.StatusOK, 1},
		{"/users/team-member", methodGet, "", userTeamMember, http.StatusOK, 1},
		{"/users/team-member", methodGet, "", userViewer, http.StatusOK, 1},
		{"/users/team-member", methodGet, "", userCommenter, http.StatusOK, 1},
		{"/users/team-member", methodGet, "", userEditor, http.StatusOK, 1},
		{"/users/team-member", methodGet, "", userAdmin, http.StatusOK, 1},

		{"/users/viewer", methodGet, "", userAnon, http.StatusUnauthorized, 0},
		{"/users/viewer", methodGet, "", userNoTeamMember, http.StatusOK, 1},
		{"/users/viewer", methodGet, "", userTeamMember, http.StatusOK, 1},
		{"/users/viewer", methodGet, "", userViewer, http.StatusOK, 1},
		{"/users/viewer", methodGet, "", userCommenter, http.StatusOK, 1},
		{"/users/viewer", methodGet, "", userEditor, http.StatusOK, 1},
		{"/users/viewer", methodGet, "", userAdmin, http.StatusOK, 1},
	}
	runTestCases(t, ttCases, testData, clients)
}

func TestPermissionsUserChangePasswordPluginMode(t *testing.T) {
	th := SetupTestHelperPluginMode(t)
	defer th.TearDown()
	testData := setupData(t, th)
	clients := setupClients(th)

	ttCases := []TestCase{
		{"/users/admin/changepassword", methodPost, "", userAnon, http.StatusUnauthorized, 0},
		{"/users/admin/changepassword", methodPost, "", userAdmin, http.StatusNotImplemented, 0},
	}
	runTestCases(t, ttCases, testData, clients)
}

func TestPermissionsUpdateUserConfig(t *testing.T) {
	th := SetupTestHelperPluginMode(t)
	defer th.TearDown()
	testData := setupData(t, th)
	clients := setupClients(th)

	patch := toJSON(t, model.UserPropPatch{UpdatedFields: map[string]string{"test": "test"}})

	ttCases := []TestCase{
		{"/users/team-member/config", methodPut, patch, userAnon, http.StatusUnauthorized, 0},
		{"/users/team-member/config", methodPut, patch, userNoTeamMember, http.StatusForbidden, 0},
		{"/users/team-member/config", methodPut, patch, userTeamMember, http.StatusOK, 1},
		{"/users/team-member/config", methodPut, patch, userViewer, http.StatusForbidden, 0},
		{"/users/team-member/config", methodPut, patch, userCommenter, http.StatusForbidden, 0},
		{"/users/team-member/config", methodPut, patch, userEditor, http.StatusForbidden, 0},
		{"/users/team-member/config", methodPut, patch, userAdmin, http.StatusForbidden, 0},
	}
	runTestCases(t, ttCases, testData, clients)
}

func TestPermissionsCreateBoardsAndBlocks(t *testing.T) {
	th := SetupTestHelperPluginMode(t)
	defer th.TearDown()
	testData := setupData(t, th)
	clients := setupClients(th)

	bab := toJSON(t, model.BoardsAndBlocks{
		Boards: []*model.Board{{ID: "test", Title: "Test Board", TeamID: "test-team"}},
		Blocks: []model.Block{
			{ID: "test-block", BoardID: "test", Type: "card", CreateAt: model.GetMillis(), UpdateAt: model.GetMillis()},
		},
	})

	ttCases := []TestCase{
		{"/boards-and-blocks", methodPost, bab, userAnon, http.StatusUnauthorized, 0},
		{"/boards-and-blocks", methodPost, bab, userNoTeamMember, http.StatusForbidden, 0},
		{"/boards-and-blocks", methodPost, bab, userTeamMember, http.StatusOK, 1},
		{"/boards-and-blocks", methodPost, bab, userViewer, http.StatusOK, 1},
		{"/boards-and-blocks", methodPost, bab, userCommenter, http.StatusOK, 1},
		{"/boards-and-blocks", methodPost, bab, userEditor, http.StatusOK, 1},
		{"/boards-and-blocks", methodPost, bab, userAdmin, http.StatusOK, 1},
	}
	runTestCases(t, ttCases, testData, clients)
}

func TestPermissionsUpdateBoardsAndBlocks(t *testing.T) {
	th := SetupTestHelperPluginMode(t)
	defer th.TearDown()
	testData := setupData(t, th)
	clients := setupClients(th)

	newTitle := "new title"
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

func TestPermissionsDeleteBoardsAndBlocks(t *testing.T) {
	th := SetupTestHelperPluginMode(t)
	defer th.TearDown()
	testData := setupData(t, th)
	clients := setupClients(th)

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

func TestPermissionsLoginPluginMode(t *testing.T) {
	th := SetupTestHelperPluginMode(t)
	defer th.TearDown()
	testData := setupData(t, th)
	clients := setupClients(th)

	ttCases := []TestCase{
		{"/login", methodPost, "", userAnon, http.StatusNotImplemented, 0},
		{"/login", methodPost, "", userAdmin, http.StatusNotImplemented, 0},
	}
	runTestCases(t, ttCases, testData, clients)
}

func TestPermissionsLogoutPluginMode(t *testing.T) {
	th := SetupTestHelperPluginMode(t)
	defer th.TearDown()
	testData := setupData(t, th)
	clients := setupClients(th)

	ttCases := []TestCase{
		{"/logout", methodPost, "", userAnon, http.StatusUnauthorized, 0},
		{"/logout", methodPost, "", userAdmin, http.StatusNotImplemented, 0},
	}
	runTestCases(t, ttCases, testData, clients)
}

func TestPermissionsRegisterPluginMode(t *testing.T) {
	th := SetupTestHelperPluginMode(t)
	defer th.TearDown()
	testData := setupData(t, th)
	clients := setupClients(th)

	ttCases := []TestCase{
		{"/register", methodPost, "", userAnon, http.StatusNotImplemented, 0},
		{"/register", methodPost, "", userAdmin, http.StatusNotImplemented, 0},
	}
	runTestCases(t, ttCases, testData, clients)
}

func TestPermissionsClientConfig(t *testing.T) {
	th := SetupTestHelperPluginMode(t)
	defer th.TearDown()
	testData := setupData(t, th)
	clients := setupClients(th)

	ttCases := []TestCase{
		{"/clientConfig", methodGet, "", userAnon, http.StatusOK, 1},
		{"/clientConfig", methodGet, "", userAdmin, http.StatusOK, 1},
	}
	runTestCases(t, ttCases, testData, clients)
}

func TestPermissionsGetCategories(t *testing.T) {
	th := SetupTestHelperPluginMode(t)
	defer th.TearDown()
	testData := setupData(t, th)
	clients := setupClients(th)

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

func TestPermissionsCreateCategory(t *testing.T) {
	th := SetupTestHelperPluginMode(t)
	defer th.TearDown()
	testData := setupData(t, th)
	clients := setupClients(th)

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
		{"/teams/test-team/categories", methodPost, category(userNoTeamMember), userNoTeamMember, http.StatusOK, 1},
		{"/teams/test-team/categories", methodPost, category(userTeamMember), userTeamMember, http.StatusOK, 1},
		{"/teams/test-team/categories", methodPost, category(userViewer), userViewer, http.StatusOK, 1},
		{"/teams/test-team/categories", methodPost, category(userCommenter), userCommenter, http.StatusOK, 1},
		{"/teams/test-team/categories", methodPost, category(userEditor), userEditor, http.StatusOK, 1},
		{"/teams/test-team/categories", methodPost, category(userAdmin), userAdmin, http.StatusOK, 1},

		{"/teams/test-team/categories", methodPost, category("other"), userAnon, http.StatusUnauthorized, 0},
		{"/teams/test-team/categories", methodPost, category("other"), userNoTeamMember, http.StatusBadRequest, 0},
		{"/teams/test-team/categories", methodPost, category("other"), userTeamMember, http.StatusBadRequest, 0},
		{"/teams/test-team/categories", methodPost, category("other"), userViewer, http.StatusBadRequest, 0},
		{"/teams/test-team/categories", methodPost, category("other"), userCommenter, http.StatusBadRequest, 0},
		{"/teams/test-team/categories", methodPost, category("other"), userEditor, http.StatusBadRequest, 0},
		{"/teams/test-team/categories", methodPost, category("other"), userAdmin, http.StatusBadRequest, 0},

		{"/teams/other-team/categories", methodPost, category(""), userAnon, http.StatusUnauthorized, 0},
		{"/teams/other-team/categories", methodPost, category(userNoTeamMember), userNoTeamMember, http.StatusBadRequest, 0},
		{"/teams/other-team/categories", methodPost, category(userTeamMember), userTeamMember, http.StatusBadRequest, 0},
		{"/teams/other-team/categories", methodPost, category(userViewer), userViewer, http.StatusBadRequest, 0},
		{"/teams/other-team/categories", methodPost, category(userCommenter), userCommenter, http.StatusBadRequest, 0},
		{"/teams/other-team/categories", methodPost, category(userEditor), userEditor, http.StatusBadRequest, 0},
		{"/teams/other-team/categories", methodPost, category(userAdmin), userAdmin, http.StatusBadRequest, 0},
	}
	runTestCases(t, ttCases, testData, clients)
}

func TestPermissionsUpdateCategory(t *testing.T) {
	th := SetupTestHelperPluginMode(t)
	defer th.TearDown()
	testData := setupData(t, th)
	clients := setupClients(th)

	categoryNoTeamMember, err := th.Server.App().CreateCategory(
		&model.Category{Name: "Test category", TeamID: "test-team", UserID: userNoTeamMember, CreateAt: model.GetMillis(), UpdateAt: model.GetMillis()},
	)
	require.NoError(t, err)
	categoryTeamMember, err := th.Server.App().CreateCategory(
		&model.Category{Name: "Test category", TeamID: "test-team", UserID: userTeamMember, CreateAt: model.GetMillis(), UpdateAt: model.GetMillis()},
	)
	require.NoError(t, err)
	categoryViewer, err := th.Server.App().CreateCategory(
		&model.Category{Name: "Test category", TeamID: "test-team", UserID: userViewer, CreateAt: model.GetMillis(), UpdateAt: model.GetMillis()},
	)
	require.NoError(t, err)
	categoryCommenter, err := th.Server.App().CreateCategory(
		&model.Category{Name: "Test category", TeamID: "test-team", UserID: userCommenter, CreateAt: model.GetMillis(), UpdateAt: model.GetMillis()},
	)
	require.NoError(t, err)
	categoryEditor, err := th.Server.App().CreateCategory(
		&model.Category{Name: "Test category", TeamID: "test-team", UserID: userEditor, CreateAt: model.GetMillis(), UpdateAt: model.GetMillis()},
	)
	require.NoError(t, err)
	categoryAdmin, err := th.Server.App().CreateCategory(
		&model.Category{Name: "Test category", TeamID: "test-team", UserID: userAdmin, CreateAt: model.GetMillis(), UpdateAt: model.GetMillis()},
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
		{"/teams/test-team/categories/any", methodPut, category("", "any"), userAnon, http.StatusUnauthorized, 0},
		{"/teams/test-team/categories/" + categoryNoTeamMember.ID, methodPut, category(userNoTeamMember, categoryNoTeamMember.ID), userNoTeamMember, http.StatusOK, 1},
		{"/teams/test-team/categories/" + categoryTeamMember.ID, methodPut, category(userTeamMember, categoryTeamMember.ID), userTeamMember, http.StatusOK, 1},
		{"/teams/test-team/categories/" + categoryViewer.ID, methodPut, category(userViewer, categoryViewer.ID), userViewer, http.StatusOK, 1},
		{"/teams/test-team/categories/" + categoryCommenter.ID, methodPut, category(userCommenter, categoryCommenter.ID), userCommenter, http.StatusOK, 1},
		{"/teams/test-team/categories/" + categoryEditor.ID, methodPut, category(userEditor, categoryEditor.ID), userEditor, http.StatusOK, 1},
		{"/teams/test-team/categories/" + categoryAdmin.ID, methodPut, category(userAdmin, categoryAdmin.ID), userAdmin, http.StatusOK, 1},

		{"/teams/test-team/categories/any", methodPut, category("other", "any"), userAnon, http.StatusUnauthorized, 0},
		{"/teams/test-team/categories/" + categoryNoTeamMember.ID, methodPut, category("other", categoryNoTeamMember.ID), userNoTeamMember, http.StatusBadRequest, 0},
		{"/teams/test-team/categories/" + categoryTeamMember.ID, methodPut, category("other", categoryTeamMember.ID), userTeamMember, http.StatusBadRequest, 0},
		{"/teams/test-team/categories/" + categoryViewer.ID, methodPut, category("other", categoryViewer.ID), userViewer, http.StatusBadRequest, 0},
		{"/teams/test-team/categories/" + categoryCommenter.ID, methodPut, category("other", categoryCommenter.ID), userCommenter, http.StatusBadRequest, 0},
		{"/teams/test-team/categories/" + categoryEditor.ID, methodPut, category("other", categoryEditor.ID), userEditor, http.StatusBadRequest, 0},
		{"/teams/test-team/categories/" + categoryAdmin.ID, methodPut, category("other", categoryAdmin.ID), userAdmin, http.StatusBadRequest, 0},

		{"/teams/other-team/categories/any", methodPut, category("", "any"), userAnon, http.StatusUnauthorized, 0},
		{"/teams/other-team/categories/" + categoryNoTeamMember.ID, methodPut, category(userNoTeamMember, categoryNoTeamMember.ID), userNoTeamMember, http.StatusBadRequest, 0},
		{"/teams/other-team/categories/" + categoryTeamMember.ID, methodPut, category(userTeamMember, categoryTeamMember.ID), userTeamMember, http.StatusBadRequest, 0},
		{"/teams/other-team/categories/" + categoryViewer.ID, methodPut, category(userViewer, categoryViewer.ID), userViewer, http.StatusBadRequest, 0},
		{"/teams/other-team/categories/" + categoryCommenter.ID, methodPut, category(userCommenter, categoryCommenter.ID), userCommenter, http.StatusBadRequest, 0},
		{"/teams/other-team/categories/" + categoryEditor.ID, methodPut, category(userEditor, categoryEditor.ID), userEditor, http.StatusBadRequest, 0},
		{"/teams/other-team/categories/" + categoryAdmin.ID, methodPut, category(userAdmin, categoryAdmin.ID), userAdmin, http.StatusBadRequest, 0},
	}
	runTestCases(t, ttCases, testData, clients)
}

func TestPermissionsDeleteCategory(t *testing.T) {
	th := SetupTestHelperPluginMode(t)
	defer th.TearDown()
	testData := setupData(t, th)
	clients := setupClients(th)

	categoryNoTeamMember, err := th.Server.App().CreateCategory(
		&model.Category{Name: "Test category", TeamID: "test-team", UserID: userNoTeamMember, CreateAt: model.GetMillis(), UpdateAt: model.GetMillis()},
	)
	require.NoError(t, err)
	categoryTeamMember, err := th.Server.App().CreateCategory(
		&model.Category{Name: "Test category", TeamID: "test-team", UserID: userTeamMember, CreateAt: model.GetMillis(), UpdateAt: model.GetMillis()},
	)
	require.NoError(t, err)
	categoryViewer, err := th.Server.App().CreateCategory(
		&model.Category{Name: "Test category", TeamID: "test-team", UserID: userViewer, CreateAt: model.GetMillis(), UpdateAt: model.GetMillis()},
	)
	require.NoError(t, err)
	categoryCommenter, err := th.Server.App().CreateCategory(
		&model.Category{Name: "Test category", TeamID: "test-team", UserID: userCommenter, CreateAt: model.GetMillis(), UpdateAt: model.GetMillis()},
	)
	require.NoError(t, err)
	categoryEditor, err := th.Server.App().CreateCategory(
		&model.Category{Name: "Test category", TeamID: "test-team", UserID: userEditor, CreateAt: model.GetMillis(), UpdateAt: model.GetMillis()},
	)
	require.NoError(t, err)
	categoryAdmin, err := th.Server.App().CreateCategory(
		&model.Category{Name: "Test category", TeamID: "test-team", UserID: userAdmin, CreateAt: model.GetMillis(), UpdateAt: model.GetMillis()},
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

func TestPermissionsUpdateCategoryBoard(t *testing.T) {
	th := SetupTestHelperPluginMode(t)
	defer th.TearDown()
	testData := setupData(t, th)
	clients := setupClients(th)

	categoryNoTeamMember, err := th.Server.App().CreateCategory(
		&model.Category{Name: "Test category", TeamID: "test-team", UserID: userNoTeamMember, CreateAt: model.GetMillis(), UpdateAt: model.GetMillis()},
	)
	require.NoError(t, err)
	categoryTeamMember, err := th.Server.App().CreateCategory(
		&model.Category{Name: "Test category", TeamID: "test-team", UserID: userTeamMember, CreateAt: model.GetMillis(), UpdateAt: model.GetMillis()},
	)
	require.NoError(t, err)
	categoryViewer, err := th.Server.App().CreateCategory(
		&model.Category{Name: "Test category", TeamID: "test-team", UserID: userViewer, CreateAt: model.GetMillis(), UpdateAt: model.GetMillis()},
	)
	require.NoError(t, err)
	categoryCommenter, err := th.Server.App().CreateCategory(
		&model.Category{Name: "Test category", TeamID: "test-team", UserID: userCommenter, CreateAt: model.GetMillis(), UpdateAt: model.GetMillis()},
	)
	require.NoError(t, err)
	categoryEditor, err := th.Server.App().CreateCategory(
		&model.Category{Name: "Test category", TeamID: "test-team", UserID: userEditor, CreateAt: model.GetMillis(), UpdateAt: model.GetMillis()},
	)
	require.NoError(t, err)
	categoryAdmin, err := th.Server.App().CreateCategory(
		&model.Category{Name: "Test category", TeamID: "test-team", UserID: userAdmin, CreateAt: model.GetMillis(), UpdateAt: model.GetMillis()},
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

func TestPermissionsGetFile(t *testing.T) {
	th := SetupTestHelperPluginMode(t)
	defer th.TearDown()
	testData := setupData(t, th)
	clients := setupClients(th)

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

func TestPermissionsCreateSubscription(t *testing.T) {
	th := SetupTestHelperPluginMode(t)
	defer th.TearDown()
	testData := setupData(t, th)
	clients := setupClients(th)

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
		{"/subscriptions", methodPost, subscription(userNoTeamMember), userNoTeamMember, http.StatusOK, 1},
		{"/subscriptions", methodPost, subscription(userTeamMember), userTeamMember, http.StatusOK, 1},
		{"/subscriptions", methodPost, subscription(userViewer), userViewer, http.StatusOK, 1},
		{"/subscriptions", methodPost, subscription(userCommenter), userCommenter, http.StatusOK, 1},
		{"/subscriptions", methodPost, subscription(userEditor), userEditor, http.StatusOK, 1},
		{"/subscriptions", methodPost, subscription(userAdmin), userAdmin, http.StatusOK, 1},
	}
	runTestCases(t, ttCases, testData, clients)
}

func TestPermissionsGetSubscriptions(t *testing.T) {
	th := SetupTestHelperPluginMode(t)
	defer th.TearDown()
	testData := setupData(t, th)
	clients := setupClients(th)

	ttCases := []TestCase{
		{"/subscriptions/anon", methodGet, "", userAnon, http.StatusUnauthorized, 0},
		{"/subscriptions/no-team-member", methodGet, "", userNoTeamMember, http.StatusOK, 0},
		{"/subscriptions/team-member", methodGet, "", userTeamMember, http.StatusOK, 0},
		{"/subscriptions/viewer", methodGet, "", userViewer, http.StatusOK, 0},
		{"/subscriptions/commenter", methodGet, "", userCommenter, http.StatusOK, 0},
		{"/subscriptions/editor", methodGet, "", userEditor, http.StatusOK, 0},
		{"/subscriptions/admin", methodGet, "", userAdmin, http.StatusOK, 0},

		{"/subscriptions/other", methodGet, "", userNoTeamMember, http.StatusForbidden, 0},
		{"/subscriptions/other", methodGet, "", userTeamMember, http.StatusForbidden, 0},
		{"/subscriptions/other", methodGet, "", userViewer, http.StatusForbidden, 0},
		{"/subscriptions/other", methodGet, "", userCommenter, http.StatusForbidden, 0},
		{"/subscriptions/other", methodGet, "", userEditor, http.StatusForbidden, 0},
		{"/subscriptions/other", methodGet, "", userAdmin, http.StatusForbidden, 0},
	}
	runTestCases(t, ttCases, testData, clients)
}

func TestPermissionsDeleteSubscription(t *testing.T) {
	th := SetupTestHelperPluginMode(t)
	defer th.TearDown()
	testData := setupData(t, th)
	clients := setupClients(th)

	_, err := th.Server.App().CreateSubscription(
		&model.Subscription{BlockType: "card", BlockID: "block-3", SubscriberType: "user", SubscriberID: userNoTeamMember, CreateAt: model.GetMillis()},
	)
	require.NoError(t, err)
	_, err = th.Server.App().CreateSubscription(
		&model.Subscription{BlockType: "card", BlockID: "block-3", SubscriberType: "user", SubscriberID: userTeamMember, CreateAt: model.GetMillis()},
	)
	require.NoError(t, err)
	_, err = th.Server.App().CreateSubscription(
		&model.Subscription{BlockType: "card", BlockID: "block-3", SubscriberType: "user", SubscriberID: userViewer, CreateAt: model.GetMillis()},
	)
	require.NoError(t, err)
	_, err = th.Server.App().CreateSubscription(
		&model.Subscription{BlockType: "card", BlockID: "block-3", SubscriberType: "user", SubscriberID: userCommenter, CreateAt: model.GetMillis()},
	)
	require.NoError(t, err)
	_, err = th.Server.App().CreateSubscription(
		&model.Subscription{BlockType: "card", BlockID: "block-3", SubscriberType: "user", SubscriberID: userEditor, CreateAt: model.GetMillis()},
	)
	require.NoError(t, err)
	_, err = th.Server.App().CreateSubscription(
		&model.Subscription{BlockType: "card", BlockID: "block-3", SubscriberType: "user", SubscriberID: userAdmin, CreateAt: model.GetMillis()},
	)
	require.NoError(t, err)
	_, err = th.Server.App().CreateSubscription(
		&model.Subscription{BlockType: "card", BlockID: "block-3", SubscriberType: "user", SubscriberID: "other", CreateAt: model.GetMillis()},
	)
	require.NoError(t, err)

	ttCases := []TestCase{
		{"/subscriptions/block-3/anon", methodDelete, "", userAnon, http.StatusUnauthorized, 0},
		{"/subscriptions/block-3/no-team-member", methodDelete, "", userNoTeamMember, http.StatusOK, 0},
		{"/subscriptions/block-3/team-member", methodDelete, "", userTeamMember, http.StatusOK, 0},
		{"/subscriptions/block-3/viewer", methodDelete, "", userViewer, http.StatusOK, 0},
		{"/subscriptions/block-3/commenter", methodDelete, "", userCommenter, http.StatusOK, 0},
		{"/subscriptions/block-3/editor", methodDelete, "", userEditor, http.StatusOK, 0},
		{"/subscriptions/block-3/admin", methodDelete, "", userAdmin, http.StatusOK, 0},

		{"/subscriptions/block-3/other", methodDelete, "", userNoTeamMember, http.StatusForbidden, 0},
		{"/subscriptions/block-3/other", methodDelete, "", userTeamMember, http.StatusForbidden, 0},
		{"/subscriptions/block-3/other", methodDelete, "", userViewer, http.StatusForbidden, 0},
		{"/subscriptions/block-3/other", methodDelete, "", userCommenter, http.StatusForbidden, 0},
		{"/subscriptions/block-3/other", methodDelete, "", userEditor, http.StatusForbidden, 0},
		{"/subscriptions/block-3/other", methodDelete, "", userAdmin, http.StatusForbidden, 0},
	}
	runTestCases(t, ttCases, testData, clients)
}

func TestPermissionsOnboard(t *testing.T) {
	th := SetupTestHelperPluginMode(t)
	defer th.TearDown()
	testData := setupData(t, th)
	clients := setupClients(th)

	err := th.Server.App().InitTemplates()
	require.NoError(t, err, "InitTemplates should not fail")

	ttCases := []TestCase{
		{"/teams/test-team/onboard", methodPost, "", userAnon, http.StatusUnauthorized, 0},
		{"/teams/test-team/onboard", methodPost, "", userNoTeamMember, http.StatusForbidden, 0},
		{"/teams/test-team/onboard", methodPost, "", userTeamMember, http.StatusOK, 1},
		{"/teams/test-team/onboard", methodPost, "", userViewer, http.StatusOK, 1},
		{"/teams/test-team/onboard", methodPost, "", userCommenter, http.StatusOK, 1},
		{"/teams/test-team/onboard", methodPost, "", userEditor, http.StatusOK, 1},
		{"/teams/test-team/onboard", methodPost, "", userAdmin, http.StatusOK, 1},
	}
	runTestCases(t, ttCases, testData, clients)
}

func TestPermissionsBoardArchiveExport(t *testing.T) {
	th := SetupTestHelperPluginMode(t)
	defer th.TearDown()
	testData := setupData(t, th)
	clients := setupClients(th)

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

func TestPermissionsBoardArchiveImport(t *testing.T) {
	th := SetupTestHelperPluginMode(t)
	defer th.TearDown()
	testData := setupData(t, th)
	clients := setupClients(th)

	ttCases := []TestCase{
		{"/teams/test-team/archive/import", methodPost, "", userAnon, http.StatusUnauthorized, 0},
		{"/teams/test-team/archive/import", methodPost, "", userNoTeamMember, http.StatusForbidden, 1},
		{"/teams/test-team/archive/import", methodPost, "", userTeamMember, http.StatusOK, 1},
		{"/teams/test-team/archive/import", methodPost, "", userViewer, http.StatusOK, 1},
		{"/teams/test-team/archive/import", methodPost, "", userCommenter, http.StatusOK, 1},
		{"/teams/test-team/archive/import", methodPost, "", userEditor, http.StatusOK, 1},
		{"/teams/test-team/archive/import", methodPost, "", userAdmin, http.StatusOK, 1},
	}
	runTestCases(t, ttCases, testData, clients)
}
