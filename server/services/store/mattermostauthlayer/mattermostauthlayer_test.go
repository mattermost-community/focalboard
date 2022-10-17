package mattermostauthlayer

import (
	"errors"
	"testing"

	"github.com/golang/mock/gomock"

	"github.com/mattermost/focalboard/server/model"
	mockservicesapi "github.com/mattermost/focalboard/server/model/mocks"
	"github.com/mattermost/mattermost-server/v6/shared/mlog"

	"github.com/stretchr/testify/require"
)

func TestGetBoardsBotID(t *testing.T) {
	ctrl := gomock.NewController(t)
	servicesAPI := mockservicesapi.NewMockServicesAPI(ctrl)

	mmAuthLayer, _ := New("test", nil, nil, mlog.CreateConsoleTestLogger(true, mlog.LvlError), servicesAPI, "")

	servicesAPI.EXPECT().EnsureBot(model.FocalboardBot).Return("", errors.New("failed to patch bot"))
	_, err := mmAuthLayer.getBoardsBotID()
	require.NotEmpty(t, err)

	servicesAPI.EXPECT().EnsureBot(model.FocalboardBot).Return("TestBotID", nil).Times(1)
	botId, err := mmAuthLayer.getBoardsBotID()
	require.Empty(t, err)
	require.NotEmpty(t, botId)
	require.Equal(t, "TestBotID", botId)

	// Call again, should not call "EnsureBot"
	botId, err = mmAuthLayer.getBoardsBotID()
	require.Empty(t, err)
	require.NotEmpty(t, botId)
	require.Equal(t, "TestBotID", botId)
}
