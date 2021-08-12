package auth

import (
	"database/sql"
	"testing"
	"time"

	"github.com/golang/mock/gomock"
	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/services/config"
	"github.com/mattermost/focalboard/server/services/store"
	"github.com/mattermost/focalboard/server/services/store/mockstore"
	"github.com/mattermost/focalboard/server/utils"
	"github.com/pkg/errors"
	"github.com/stretchr/testify/require"
)

type TestHelper struct {
	Auth    *Auth
	Session model.Session
	Store   *mockstore.MockStore
}

var mockSession = &model.Session{
	ID:       utils.CreateGUID(),
	Token:    "goodToken",
	UserID:   "12345",
	CreateAt: time.Now().Unix() - 2000,
	UpdateAt: time.Now().Unix() - 2000,
}

func setupTestHelper(t *testing.T) *TestHelper {
	ctrl := gomock.NewController(t)
	defer ctrl.Finish()
	cfg := config.Configuration{}
	mockStore := mockstore.NewMockStore(ctrl)
	newAuth := New(&cfg, mockStore)

	return &TestHelper{
		Auth:    newAuth,
		Session: *mockSession,
		Store:   mockStore,
	}
}

func TestGetSession(t *testing.T) {
	th := setupTestHelper(t)

	testcases := []struct {
		title       string
		token       string
		refreshTime int64
		isError     bool
	}{
		{"fail, no token", "", 0, true},
		{"fail, invalid username", "badToken", 0, true},
		{"success, good token", "goodToken", 1000, false},
	}

	th.Store.EXPECT().GetSession("badToken", gomock.Any()).Return(nil, errors.New("Invalid Token"))
	th.Store.EXPECT().GetSession("goodToken", gomock.Any()).Return(mockSession, nil)
	th.Store.EXPECT().RefreshSession(gomock.Any()).Return(nil)

	for _, test := range testcases {
		t.Run(test.title, func(t *testing.T) {
			if test.refreshTime > 0 {
				th.Auth.config.SessionRefreshTime = test.refreshTime
			}

			session, err := th.Auth.GetSession(test.token)
			if test.isError {
				require.Error(t, err)
			} else {
				require.NoError(t, err)
				require.NotNil(t, session)
			}
		})
	}
}

func TestIsValidReadToken(t *testing.T) {
	th := setupTestHelper(t)

	validBlockID := "testBlockID"
	mockContainer := store.Container{
		WorkspaceID: "testWorkspaceID",
	}
	validReadToken := "testReadToken"
	mockSharing := model.Sharing{
		ID:      "testRootID",
		Enabled: true,
		Token:   validReadToken,
	}

	testcases := []struct {
		title     string
		container store.Container
		blockID   string
		readToken string
		isError   bool
		isSuccess bool
	}{
		{"fail, error GetRootID", mockContainer, "badBlock", "", true, false},
		{"fail, rootID not found", mockContainer, "goodBlockID", "", false, false},
		{"fail, sharing throws error", mockContainer, "goodBlockID2", "", true, false},
		{"fail, bad readToken", mockContainer, validBlockID, "invalidReadToken", false, false},
		{"success", mockContainer, validBlockID, validReadToken, false, true},
	}

	th.Store.EXPECT().GetRootID(gomock.Eq(mockContainer), "badBlock").Return("", errors.New("invalid block"))
	th.Store.EXPECT().GetRootID(gomock.Eq(mockContainer), "goodBlockID").Return("rootNotFound", nil)
	th.Store.EXPECT().GetRootID(gomock.Eq(mockContainer), "goodBlockID2").Return("rootError", nil)
	th.Store.EXPECT().GetRootID(gomock.Eq(mockContainer), validBlockID).Return("testRootID", nil).Times(2)
	th.Store.EXPECT().GetSharing(gomock.Eq(mockContainer), "rootNotFound").Return(nil, sql.ErrNoRows)
	th.Store.EXPECT().GetSharing(gomock.Eq(mockContainer), "rootError").Return(nil, errors.New("another error"))
	th.Store.EXPECT().GetSharing(gomock.Eq(mockContainer), "testRootID").Return(&mockSharing, nil).Times(2)

	for _, test := range testcases {
		t.Run(test.title, func(t *testing.T) {
			success, err := th.Auth.IsValidReadToken(test.container, test.blockID, test.readToken)
			if test.isError {
				require.Error(t, err)
			} else {
				require.NoError(t, err)
			}
			if test.isSuccess {
				require.True(t, success)
			} else {
				require.False(t, success)
			}
		})
	}
}
