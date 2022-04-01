package integrationtests

import (
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

const (
	userAnon         string = "anon"
	userNoTeamMember        = "no-team-member"
	userTeamMember          = "team-member"
	userViewer              = "viewer"
	userCommenter           = "commenter"
	userEditor              = "editor"
	userAdmin               = "admin"
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

	clients.NoTeamMember.HTTPHeader["Mattermost-User-Id"] = "no-team-member"
	clients.TeamMember.HTTPHeader["Mattermost-User-Id"] = "team-member"
	clients.Viewer.HTTPHeader["Mattermost-User-Id"] = "viewer"
	clients.Commenter.HTTPHeader["Mattermost-User-Id"] = "commenter"
	clients.Editor.HTTPHeader["Mattermost-User-Id"] = "editor"
	clients.Admin.HTTPHeader["Mattermost-User-Id"] = "admin"

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
	customTemplate1, err := th.Server.App().CreateBoard(&model.Board{Title: "Custom template 1", TeamID: "test-team", IsTemplate: true, Type: model.BoardTypeOpen}, "admin", true)
	require.NoError(t, err)
	err = th.Server.App().InsertBlock(model.Block{ID: "block-1", Title: "Test", Type: "card", BoardID: customTemplate1.ID}, "admin")
	require.NoError(t, err)
	customTemplate2, err := th.Server.App().CreateBoard(&model.Board{Title: "Custom template 2", TeamID: "test-team", IsTemplate: true, Type: model.BoardTypePrivate}, "admin", true)
	require.NoError(t, err)
	err = th.Server.App().InsertBlock(model.Block{ID: "block-2", Title: "Test", Type: "card", BoardID: customTemplate2.ID}, "admin")
	require.NoError(t, err)

	board1, err := th.Server.App().CreateBoard(&model.Board{Title: "Board 1", TeamID: "test-team", Type: model.BoardTypeOpen}, "admin", true)
	require.NoError(t, err)
	err = th.Server.App().InsertBlock(model.Block{ID: "block-3", Title: "Test", Type: "card", BoardID: board1.ID}, "admin")
	require.NoError(t, err)
	board2, err := th.Server.App().CreateBoard(&model.Board{Title: "Board 2", TeamID: "test-team", Type: model.BoardTypePrivate}, "admin", true)
	require.NoError(t, err)
	err = th.Server.App().InsertBlock(model.Block{ID: "block-4", Title: "Test", Type: "card", BoardID: board2.ID}, "admin")
	require.NoError(t, err)

	err = th.Server.App().UpsertSharing(model.Sharing{ID: board2.ID, Enabled: true, Token: "valid", ModifiedBy: "admin", UpdateAt: model.GetMillis()})

	_, err = th.Server.App().AddMemberToBoard(&model.BoardMember{BoardID: customTemplate1.ID, UserID: "viewer", SchemeViewer: true})
	require.NoError(t, err)
	_, err = th.Server.App().AddMemberToBoard(&model.BoardMember{BoardID: customTemplate2.ID, UserID: "viewer", SchemeViewer: true})
	require.NoError(t, err)
	_, err = th.Server.App().AddMemberToBoard(&model.BoardMember{BoardID: customTemplate1.ID, UserID: "commenter", SchemeCommenter: true})
	require.NoError(t, err)
	_, err = th.Server.App().AddMemberToBoard(&model.BoardMember{BoardID: customTemplate2.ID, UserID: "commenter", SchemeCommenter: true})
	require.NoError(t, err)
	_, err = th.Server.App().AddMemberToBoard(&model.BoardMember{BoardID: customTemplate1.ID, UserID: "editor", SchemeEditor: true})
	require.NoError(t, err)
	_, err = th.Server.App().AddMemberToBoard(&model.BoardMember{BoardID: customTemplate2.ID, UserID: "editor", SchemeEditor: true})
	require.NoError(t, err)
	_, err = th.Server.App().AddMemberToBoard(&model.BoardMember{BoardID: customTemplate1.ID, UserID: "admin", SchemeAdmin: true})
	require.NoError(t, err)
	_, err = th.Server.App().AddMemberToBoard(&model.BoardMember{BoardID: customTemplate2.ID, UserID: "admin", SchemeAdmin: true})
	require.NoError(t, err)

	_, err = th.Server.App().AddMemberToBoard(&model.BoardMember{BoardID: board1.ID, UserID: "viewer", SchemeViewer: true})
	require.NoError(t, err)
	_, err = th.Server.App().AddMemberToBoard(&model.BoardMember{BoardID: board2.ID, UserID: "viewer", SchemeViewer: true})
	require.NoError(t, err)
	_, err = th.Server.App().AddMemberToBoard(&model.BoardMember{BoardID: board1.ID, UserID: "commenter", SchemeCommenter: true})
	require.NoError(t, err)
	_, err = th.Server.App().AddMemberToBoard(&model.BoardMember{BoardID: board2.ID, UserID: "commenter", SchemeCommenter: true})
	require.NoError(t, err)
	_, err = th.Server.App().AddMemberToBoard(&model.BoardMember{BoardID: board1.ID, UserID: "editor", SchemeEditor: true})
	require.NoError(t, err)
	_, err = th.Server.App().AddMemberToBoard(&model.BoardMember{BoardID: board2.ID, UserID: "editor", SchemeEditor: true})
	require.NoError(t, err)
	_, err = th.Server.App().AddMemberToBoard(&model.BoardMember{BoardID: board1.ID, UserID: "admin", SchemeAdmin: true})
	require.NoError(t, err)
	_, err = th.Server.App().AddMemberToBoard(&model.BoardMember{BoardID: board2.ID, UserID: "admin", SchemeAdmin: true})
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
			case methodPost:
				response, err = reqClient.DoAPIPost(url, tc.body)
			case methodPatch:
				response, err = reqClient.DoAPIPatch(url, tc.body)
			case methodPut:
				response, err = reqClient.DoAPIPut(url, tc.body)
			case methodDelete:
				response, err = reqClient.DoAPIDelete(url, tc.body)
			}

			if tc.expectedStatusCode >= 200 && tc.expectedStatusCode < 300 {
				require.NoError(t, err)
			}
			require.Equal(t, tc.expectedStatusCode, response.StatusCode)
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
						require.Equal(t, len(string(body)), 2)
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

	ttCases := []TestCase{
		// Get Team Boards
		{"/teams/test-team/templates", methodGet, "", userAnon, http.StatusUnauthorized, 0},
		{"/teams/test-team/templates", methodGet, "", userNoTeamMember, http.StatusForbidden, 0},
		{"/teams/test-team/templates", methodGet, "", userTeamMember, http.StatusOK, 1},
		{"/teams/test-team/templates", methodGet, "", userViewer, http.StatusOK, 2},
		{"/teams/test-team/templates", methodGet, "", userCommenter, http.StatusOK, 2},
		{"/teams/test-team/templates", methodGet, "", userEditor, http.StatusOK, 2},
		{"/teams/test-team/templates", methodGet, "", userAdmin, http.StatusOK, 2},
		{"/teams/0/templates", methodGet, "", userAnon, http.StatusUnauthorized, 0},
		{"/teams/0/templates", methodGet, "", userNoTeamMember, http.StatusOK, 7},
		{"/teams/0/templates", methodGet, "", userTeamMember, http.StatusOK, 7},
		{"/teams/0/templates", methodGet, "", userViewer, http.StatusOK, 7},
		{"/teams/0/templates", methodGet, "", userCommenter, http.StatusOK, 7},
		{"/teams/0/templates", methodGet, "", userEditor, http.StatusOK, 7},
		{"/teams/0/templates", methodGet, "", userAdmin, http.StatusOK, 7},
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
		{"/boards/{PUBLIC_BOARD_ID}/duplicate", methodPost, "", userTeamMember, http.StatusOK, 1}, // TODO: Confirm that this behavior is what we want
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
		{"/boards/{PUBLIC_BOARD_ID}/duplicate?toTeam=other-team", methodPost, "", userTeamMember, http.StatusOK, 1}, // TODO: Confirm that this behavior is what we want
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
	newBlocksPatchJSON := func(blockID, boardID string) string {
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
		{"/boards/{PRIVATE_BOARD_ID}/blocks", methodPatch, newBlocksPatchJSON("block-4", testData.privateBoard.ID), userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PRIVATE_BOARD_ID}/blocks", methodPatch, newBlocksPatchJSON("block-4", testData.privateBoard.ID), userNoTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}/blocks", methodPatch, newBlocksPatchJSON("block-4", testData.privateBoard.ID), userTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}/blocks", methodPatch, newBlocksPatchJSON("block-4", testData.privateBoard.ID), userViewer, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}/blocks", methodPatch, newBlocksPatchJSON("block-4", testData.privateBoard.ID), userCommenter, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_BOARD_ID}/blocks", methodPatch, newBlocksPatchJSON("block-4", testData.privateBoard.ID), userEditor, http.StatusOK, 0},
		{"/boards/{PRIVATE_BOARD_ID}/blocks", methodPatch, newBlocksPatchJSON("block-4", testData.privateBoard.ID), userAdmin, http.StatusOK, 0},

		{"/boards/{PUBLIC_BOARD_ID}/blocks", methodPatch, newBlocksPatchJSON("block-3", testData.publicBoard.ID), userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PUBLIC_BOARD_ID}/blocks", methodPatch, newBlocksPatchJSON("block-3", testData.publicBoard.ID), userNoTeamMember, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_BOARD_ID}/blocks", methodPatch, newBlocksPatchJSON("block-3", testData.publicBoard.ID), userTeamMember, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_BOARD_ID}/blocks", methodPatch, newBlocksPatchJSON("block-3", testData.publicBoard.ID), userViewer, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_BOARD_ID}/blocks", methodPatch, newBlocksPatchJSON("block-3", testData.publicBoard.ID), userCommenter, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_BOARD_ID}/blocks", methodPatch, newBlocksPatchJSON("block-3", testData.publicBoard.ID), userEditor, http.StatusOK, 0},
		{"/boards/{PUBLIC_BOARD_ID}/blocks", methodPatch, newBlocksPatchJSON("block-3", testData.publicBoard.ID), userAdmin, http.StatusOK, 0},

		{"/boards/{PRIVATE_TEMPLATE_ID}/blocks", methodPatch, newBlocksPatchJSON("block-2", testData.privateTemplate.ID), userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/blocks", methodPatch, newBlocksPatchJSON("block-2", testData.privateTemplate.ID), userNoTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/blocks", methodPatch, newBlocksPatchJSON("block-2", testData.privateTemplate.ID), userTeamMember, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/blocks", methodPatch, newBlocksPatchJSON("block-2", testData.privateTemplate.ID), userViewer, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/blocks", methodPatch, newBlocksPatchJSON("block-2", testData.privateTemplate.ID), userCommenter, http.StatusForbidden, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/blocks", methodPatch, newBlocksPatchJSON("block-2", testData.privateTemplate.ID), userEditor, http.StatusOK, 0},
		{"/boards/{PRIVATE_TEMPLATE_ID}/blocks", methodPatch, newBlocksPatchJSON("block-2", testData.privateTemplate.ID), userAdmin, http.StatusOK, 0},

		{"/boards/{PUBLIC_TEMPLATE_ID}/blocks", methodPatch, newBlocksPatchJSON("block-1", testData.publicTemplate.ID), userAnon, http.StatusUnauthorized, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/blocks", methodPatch, newBlocksPatchJSON("block-1", testData.publicTemplate.ID), userNoTeamMember, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/blocks", methodPatch, newBlocksPatchJSON("block-1", testData.publicTemplate.ID), userTeamMember, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/blocks", methodPatch, newBlocksPatchJSON("block-1", testData.publicTemplate.ID), userViewer, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/blocks", methodPatch, newBlocksPatchJSON("block-1", testData.publicTemplate.ID), userCommenter, http.StatusForbidden, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/blocks", methodPatch, newBlocksPatchJSON("block-1", testData.publicTemplate.ID), userEditor, http.StatusOK, 0},
		{"/boards/{PUBLIC_TEMPLATE_ID}/blocks", methodPatch, newBlocksPatchJSON("block-1", testData.publicTemplate.ID), userAdmin, http.StatusOK, 0},
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

	err := th.Server.App().InsertBlock(model.Block{ID: "block-5", Title: "Test", Type: "card", BoardID: testData.publicTemplate.ID}, "admin")
	require.NoError(t, err)
	err = th.Server.App().InsertBlock(model.Block{ID: "block-6", Title: "Test", Type: "card", BoardID: testData.privateTemplate.ID}, "admin")
	require.NoError(t, err)
	err = th.Server.App().InsertBlock(model.Block{ID: "block-7", Title: "Test", Type: "card", BoardID: testData.publicBoard.ID}, "admin")
	require.NoError(t, err)
	err = th.Server.App().InsertBlock(model.Block{ID: "block-8", Title: "Test", Type: "card", BoardID: testData.privateBoard.ID}, "admin")
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

	err := th.Server.App().InsertBlock(model.Block{ID: "block-5", Title: "Test", Type: "card", BoardID: testData.publicTemplate.ID}, "admin")
	require.NoError(t, err)
	err = th.Server.App().InsertBlock(model.Block{ID: "block-6", Title: "Test", Type: "card", BoardID: testData.privateTemplate.ID}, "admin")
	require.NoError(t, err)
	err = th.Server.App().InsertBlock(model.Block{ID: "block-7", Title: "Test", Type: "card", BoardID: testData.publicBoard.ID}, "admin")
	require.NoError(t, err)
	err = th.Server.App().InsertBlock(model.Block{ID: "block-8", Title: "Test", Type: "card", BoardID: testData.privateBoard.ID}, "admin")
	require.NoError(t, err)
	err = th.Server.App().DeleteBlock("block-1", "admin")
	require.NoError(t, err)
	err = th.Server.App().DeleteBlock("block-2", "admin")
	require.NoError(t, err)
	err = th.Server.App().DeleteBlock("block-3", "admin")
	require.NoError(t, err)
	err = th.Server.App().DeleteBlock("block-4", "admin")
	require.NoError(t, err)
	err = th.Server.App().DeleteBlock("block-5", "admin")
	require.NoError(t, err)
	err = th.Server.App().DeleteBlock("block-6", "admin")
	require.NoError(t, err)
	err = th.Server.App().DeleteBlock("block-7", "admin")
	require.NoError(t, err)
	err = th.Server.App().DeleteBlock("block-8", "admin")
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

func TestPermissionsDuplicateBoardBlock(t *testing.T) {
	th := SetupTestHelperPluginMode(t)
	defer th.TearDown()
	testData := setupData(t, th)
	clients := setupClients(th)

	err := th.Server.App().InsertBlock(model.Block{ID: "block-5", Title: "Test", Type: "card", BoardID: testData.publicTemplate.ID}, "admin")
	require.NoError(t, err)
	err = th.Server.App().InsertBlock(model.Block{ID: "block-6", Title: "Test", Type: "card", BoardID: testData.privateTemplate.ID}, "admin")
	require.NoError(t, err)
	err = th.Server.App().InsertBlock(model.Block{ID: "block-7", Title: "Test", Type: "card", BoardID: testData.publicBoard.ID}, "admin")
	require.NoError(t, err)
	err = th.Server.App().InsertBlock(model.Block{ID: "block-8", Title: "Test", Type: "card", BoardID: testData.privateBoard.ID}, "admin")
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
			UserID:       "team-member",
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
			UserID:       "team-member",
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

	_, err := th.Server.App().AddMemberToBoard(&model.BoardMember{BoardID: testData.publicBoard.ID, UserID: "team-member", SchemeViewer: true})
	require.NoError(t, err)
	_, err = th.Server.App().AddMemberToBoard(&model.BoardMember{BoardID: testData.privateBoard.ID, UserID: "team-member", SchemeViewer: true})
	require.NoError(t, err)
	_, err = th.Server.App().AddMemberToBoard(&model.BoardMember{BoardID: testData.publicTemplate.ID, UserID: "team-member", SchemeViewer: true})
	require.NoError(t, err)
	_, err = th.Server.App().AddMemberToBoard(&model.BoardMember{BoardID: testData.privateTemplate.ID, UserID: "team-member", SchemeViewer: true})
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
		{"/boards/invalid/members/viewer", methodDelete, "", userAdmin, http.StatusForbidden, 0},

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
		{"/boards/{PRIVATE_BOARD_ID}/join", methodPost, "", userViewer, http.StatusForbidden, 0}, // Do we want to forbid already existing members to join to the board or simply return the current membership?
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

	_, err = th.Server.App().AddMemberToBoard(&model.BoardMember{BoardID: testData.publicBoard.ID, UserID: "admin", SchemeAdmin: true})
	require.NoError(t, err)
	_, err = th.Server.App().AddMemberToBoard(&model.BoardMember{BoardID: testData.privateBoard.ID, UserID: "admin", SchemeAdmin: true})
	require.NoError(t, err)
	_, err = th.Server.App().AddMemberToBoard(&model.BoardMember{BoardID: testData.publicTemplate.ID, UserID: "admin", SchemeAdmin: true})
	require.NoError(t, err)
	_, err = th.Server.App().AddMemberToBoard(&model.BoardMember{BoardID: testData.privateTemplate.ID, UserID: "admin", SchemeAdmin: true})
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
