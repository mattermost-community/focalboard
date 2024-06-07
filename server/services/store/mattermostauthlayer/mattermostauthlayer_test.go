package mattermostauthlayer

import (
	"errors"
	"testing"

	"github.com/golang/mock/gomock"

	"github.com/mattermost/focalboard/server/model"
	mockservicesapi "github.com/mattermost/focalboard/server/model/mocks"
	"github.com/mattermost/mattermost/server/public/shared/mlog"

	"github.com/stretchr/testify/require"
)

var errTest = errors.New("failed to patch bot")

func TestGetBoardsBotID(t *testing.T) {
	ctrl := gomock.NewController(t)
	servicesAPI := mockservicesapi.NewMockServicesAPI(ctrl)
	mmAuthLayer, _ := New("test", nil, nil, mlog.CreateConsoleTestLogger(t), servicesAPI, "")

	servicesAPI.EXPECT().EnsureBot(model.FocalboardBot).Return("", errTest)
	_, err := mmAuthLayer.getBoardsBotID()
	require.NotEmpty(t, err)

	servicesAPI.EXPECT().EnsureBot(model.FocalboardBot).Return("TestBotID", nil).Times(1)
	botID, err := mmAuthLayer.getBoardsBotID()
	require.Empty(t, err)
	require.NotEmpty(t, botID)
	require.Equal(t, "TestBotID", botID)

	// Call again, should not call "EnsureBot"
	botID, err = mmAuthLayer.getBoardsBotID()
	require.Empty(t, err)
	require.NotEmpty(t, botID)
	require.Equal(t, "TestBotID", botID)
}
