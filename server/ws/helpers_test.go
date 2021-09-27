package ws

import (
	"testing"

	authMocks "github.com/mattermost/focalboard/server/auth/mocks"
	wsMocks "github.com/mattermost/focalboard/server/ws/mocks"

	mmModel "github.com/mattermost/mattermost-server/v6/model"

	"github.com/golang/mock/gomock"
)

type TestHelper struct {
	api  *wsMocks.MockAPI
	auth *authMocks.MockAuthInterface
	ctrl *gomock.Controller
	pa   *PluginAdapter
}

func SetupTestHelper(t *testing.T) *TestHelper {
	ctrl := gomock.NewController(t)
	mockAPI := wsMocks.NewMockAPI(ctrl)
	mockAuth := authMocks.NewMockAuthInterface(ctrl)

	mockAPI.EXPECT().LogDebug(gomock.Any(), gomock.Any()).AnyTimes()
	mockAPI.EXPECT().LogInfo(gomock.Any(), gomock.Any()).AnyTimes()
	mockAPI.EXPECT().LogError(gomock.Any(), gomock.Any()).AnyTimes()
	mockAPI.EXPECT().LogWarn(gomock.Any(), gomock.Any()).AnyTimes()

	return &TestHelper{
		api:  mockAPI,
		auth: mockAuth,
		ctrl: ctrl,
		pa:   NewPluginAdapter(mockAPI, mockAuth),
	}
}

func (th *TestHelper) ReceiveWebSocketMessage(webConnID, userID, action string, data map[string]interface{}) {
	req := &mmModel.WebSocketRequest{Action: websocketMessagePrefix + action, Data: data}

	th.pa.WebSocketMessageHasBeenPosted(webConnID, userID, req)
}

func (th *TestHelper) SubscribeWebConnToWorkspace(webConnID, userID, workspaceID string) {
	th.auth.EXPECT().
		DoesUserHaveWorkspaceAccess(userID, workspaceID).
		Return(true)

	msgData := map[string]interface{}{"workspaceId": workspaceID}
	th.ReceiveWebSocketMessage(webConnID, userID, websocketActionSubscribeWorkspace, msgData)
}

func (th *TestHelper) UnsubscribeWebConnFromWorkspace(webConnID, userID, workspaceID string) {
	msgData := map[string]interface{}{"workspaceId": workspaceID}
	th.ReceiveWebSocketMessage(webConnID, userID, websocketActionUnsubscribeWorkspace, msgData)
}
