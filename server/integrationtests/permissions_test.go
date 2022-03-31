package integrationtests

import (
	"encoding/json"
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
	customTemplate2, err := th.Server.App().CreateBoard(&model.Board{Title: "Custom template 2", TeamID: "test-team", IsTemplate: true, Type: model.BoardTypePrivate}, "admin", true)
	require.NoError(t, err)

	board1, err := th.Server.App().CreateBoard(&model.Board{Title: "Board 1", TeamID: "test-team", Type: model.BoardTypeOpen}, "admin", true)
	require.NoError(t, err)
	board2, err := th.Server.App().CreateBoard(&model.Board{Title: "Board 2", TeamID: "test-team", Type: model.BoardTypePrivate}, "admin", true)
	require.NoError(t, err)

	_, err = th.Server.App().AddMemberToBoard(&model.BoardMember{BoardID: customTemplate1.ID, UserID: "viewer", SchemeViewer: true})
	_, err = th.Server.App().AddMemberToBoard(&model.BoardMember{BoardID: customTemplate2.ID, UserID: "viewer", SchemeViewer: true})
	_, err = th.Server.App().AddMemberToBoard(&model.BoardMember{BoardID: customTemplate1.ID, UserID: "commenter", SchemeCommenter: true})
	_, err = th.Server.App().AddMemberToBoard(&model.BoardMember{BoardID: customTemplate2.ID, UserID: "commenter", SchemeCommenter: true})
	_, err = th.Server.App().AddMemberToBoard(&model.BoardMember{BoardID: customTemplate1.ID, UserID: "editor", SchemeEditor: true})
	_, err = th.Server.App().AddMemberToBoard(&model.BoardMember{BoardID: customTemplate2.ID, UserID: "editor", SchemeEditor: true})
	_, err = th.Server.App().AddMemberToBoard(&model.BoardMember{BoardID: customTemplate1.ID, UserID: "admin", SchemeAdmin: true})
	_, err = th.Server.App().AddMemberToBoard(&model.BoardMember{BoardID: customTemplate2.ID, UserID: "admin", SchemeAdmin: true})

	_, err = th.Server.App().AddMemberToBoard(&model.BoardMember{BoardID: board1.ID, UserID: "viewer", SchemeViewer: true})
	_, err = th.Server.App().AddMemberToBoard(&model.BoardMember{BoardID: board2.ID, UserID: "viewer", SchemeViewer: true})
	_, err = th.Server.App().AddMemberToBoard(&model.BoardMember{BoardID: board1.ID, UserID: "commenter", SchemeCommenter: true})
	_, err = th.Server.App().AddMemberToBoard(&model.BoardMember{BoardID: board2.ID, UserID: "commenter", SchemeCommenter: true})
	_, err = th.Server.App().AddMemberToBoard(&model.BoardMember{BoardID: board1.ID, UserID: "editor", SchemeEditor: true})
	_, err = th.Server.App().AddMemberToBoard(&model.BoardMember{BoardID: board2.ID, UserID: "editor", SchemeEditor: true})
	_, err = th.Server.App().AddMemberToBoard(&model.BoardMember{BoardID: board1.ID, UserID: "admin", SchemeAdmin: true})
	_, err = th.Server.App().AddMemberToBoard(&model.BoardMember{BoardID: board2.ID, UserID: "admin", SchemeAdmin: true})

	return TestData{
		publicBoard:     board1,
		privateBoard:    board2,
		publicTemplate:  customTemplate1,
		privateTemplate: customTemplate2,
	}
}

func runTestCases(t *testing.T, ttCases []TestCase) {
	th := SetupTestHelperPluginMode(t)
	defer th.TearDown()
	testData := setupData(t, th)

	clients := setupClients(th)

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

			if tc.method == methodGet {
				url := strings.ReplaceAll(tc.url, "{PRIVATE_BOARD_ID}", testData.privateBoard.ID)
				url = strings.ReplaceAll(url, "{PUBLIC_BOARD_ID}", testData.publicBoard.ID)
				url = strings.ReplaceAll(url, "{PUBLIC_TEMPLATE_ID}", testData.publicTemplate.ID)
				url = strings.ReplaceAll(url, "{PRIVATE_TEMPLATE_ID}", testData.privateTemplate.ID)
				response, err := reqClient.DoAPIGet(url, "")
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
						require.Equal(t, 1, tc.totalResults)
						require.Greater(t, len(string(body)), 2)
					}
				}
			}
		})
	}
}

func TestPermissionsGetTeamBoards(t *testing.T) {
	ttCases := []TestCase{
		{"/teams/test-team/boards", methodGet, "", userAnon, http.StatusUnauthorized, 0},
		{"/teams/test-team/boards", methodGet, "", userNoTeamMember, http.StatusForbidden, 0},
		{"/teams/test-team/boards", methodGet, "", userTeamMember, http.StatusOK, 1},
		{"/teams/test-team/boards", methodGet, "", userViewer, http.StatusOK, 2},
		{"/teams/test-team/boards", methodGet, "", userCommenter, http.StatusOK, 2},
		{"/teams/test-team/boards", methodGet, "", userEditor, http.StatusOK, 2},
		{"/teams/test-team/boards", methodGet, "", userAdmin, http.StatusOK, 2},
	}
	runTestCases(t, ttCases)
}

func TestPermissionsSearchTeamBoards(t *testing.T) {
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
	runTestCases(t, ttCases)
}

func TestPermissionsGetTeamTemplates(t *testing.T) {
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
	runTestCases(t, ttCases)
}

func TestPermissionsCreateBoard(t *testing.T) {
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
	runTestCases(t, ttCases)
}

func TestPermissionsGetBoard(t *testing.T) {
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
	}
	runTestCases(t, ttCases)
}
