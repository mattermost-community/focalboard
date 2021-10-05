package integrationtests

import (
	"bytes"
	"crypto/rand"
	"testing"

	"github.com/mattermost/focalboard/server/api"
	"github.com/mattermost/focalboard/server/utils"
	"github.com/stretchr/testify/require"
)

const (
	fakeUsername = "fakeUsername"
	fakeEmail    = "mock@test.com"
)

func TestUserRegister(t *testing.T) {
	th := SetupTestHelperWithoutToken().InitBasic()
	defer th.TearDown()

	// register
	registerRequest := &api.RegisterRequest{
		Username: fakeUsername,
		Email:    fakeEmail,
		Password: utils.NewID(utils.IDTypeNone),
	}
	success, resp := th.Client.Register(registerRequest)
	require.NoError(t, resp.Error)
	require.True(t, success)

	// register again will failed
	success, resp = th.Client.Register(registerRequest)
	require.Error(t, resp.Error)
	require.False(t, success)
}

func TestUserLogin(t *testing.T) {
	th := SetupTestHelperWithoutToken().InitBasic()
	defer th.TearDown()

	t.Run("with nonexist user", func(t *testing.T) {
		loginRequest := &api.LoginRequest{
			Type:     "normal",
			Username: "nonexistuser",
			Email:    "",
			Password: utils.NewID(utils.IDTypeNone),
		}
		data, resp := th.Client.Login(loginRequest)
		require.Error(t, resp.Error)
		require.Nil(t, data)
	})

	t.Run("with registered user", func(t *testing.T) {
		password := utils.NewID(utils.IDTypeNone)
		// register
		registerRequest := &api.RegisterRequest{
			Username: fakeUsername,
			Email:    fakeEmail,
			Password: password,
		}
		success, resp := th.Client.Register(registerRequest)
		require.NoError(t, resp.Error)
		require.True(t, success)

		// login
		loginRequest := &api.LoginRequest{
			Type:     "normal",
			Username: fakeUsername,
			Email:    fakeEmail,
			Password: password,
		}
		data, resp := th.Client.Login(loginRequest)
		require.NoError(t, resp.Error)
		require.NotNil(t, data)
		require.NotNil(t, data.Token)
	})
}

func TestGetMe(t *testing.T) {
	th := SetupTestHelperWithoutToken().InitBasic()
	defer th.TearDown()

	t.Run("not login yet", func(t *testing.T) {
		me, resp := th.Client.GetMe()
		require.Error(t, resp.Error)
		require.Nil(t, me)
	})

	t.Run("logged in", func(t *testing.T) {
		// register
		password := utils.NewID(utils.IDTypeNone)
		registerRequest := &api.RegisterRequest{
			Username: fakeUsername,
			Email:    fakeEmail,
			Password: password,
		}
		success, resp := th.Client.Register(registerRequest)
		require.NoError(t, resp.Error)
		require.True(t, success)
		// login
		loginRequest := &api.LoginRequest{
			Type:     "normal",
			Username: fakeUsername,
			Email:    fakeEmail,
			Password: password,
		}
		data, resp := th.Client.Login(loginRequest)
		require.NoError(t, resp.Error)
		require.NotNil(t, data)
		require.NotNil(t, data.Token)

		// get user me
		me, resp := th.Client.GetMe()
		require.NoError(t, resp.Error)
		require.NotNil(t, me)
		require.Equal(t, registerRequest.Email, me.Email)
		require.Equal(t, registerRequest.Username, me.Username)
	})
}

func TestGetUser(t *testing.T) {
	th := SetupTestHelperWithoutToken().InitBasic()
	defer th.TearDown()

	// register
	password := utils.NewID(utils.IDTypeNone)
	registerRequest := &api.RegisterRequest{
		Username: fakeUsername,
		Email:    fakeEmail,
		Password: password,
	}
	success, resp := th.Client.Register(registerRequest)
	require.NoError(t, resp.Error)
	require.True(t, success)
	// login
	loginRequest := &api.LoginRequest{
		Type:     "normal",
		Username: fakeUsername,
		Email:    fakeEmail,
		Password: password,
	}
	data, resp := th.Client.Login(loginRequest)
	require.NoError(t, resp.Error)
	require.NotNil(t, data)
	require.NotNil(t, data.Token)

	me, resp := th.Client.GetMe()
	require.NoError(t, resp.Error)
	require.NotNil(t, me)

	t.Run("me's id", func(t *testing.T) {
		user, resp := th.Client.GetUser(me.ID)
		require.NoError(t, resp.Error)
		require.NotNil(t, user)
		require.Equal(t, me.ID, user.ID)
		require.Equal(t, me.Username, user.Username)
	})

	t.Run("nonexist user", func(t *testing.T) {
		user, resp := th.Client.GetUser("nonexistid")
		require.Error(t, resp.Error)
		require.Nil(t, user)
	})
}

func TestUserChangePassword(t *testing.T) {
	th := SetupTestHelperWithoutToken().InitBasic()
	defer th.TearDown()

	// register
	password := utils.NewID(utils.IDTypeNone)
	registerRequest := &api.RegisterRequest{
		Username: fakeUsername,
		Email:    fakeEmail,
		Password: password,
	}
	success, resp := th.Client.Register(registerRequest)
	require.NoError(t, resp.Error)
	require.True(t, success)
	// login
	loginRequest := &api.LoginRequest{
		Type:     "normal",
		Username: fakeUsername,
		Email:    fakeEmail,
		Password: password,
	}
	data, resp := th.Client.Login(loginRequest)
	require.NoError(t, resp.Error)
	require.NotNil(t, data)
	require.NotNil(t, data.Token)

	originalMe, resp := th.Client.GetMe()
	require.NoError(t, resp.Error)
	require.NotNil(t, originalMe)

	// change password
	success, resp = th.Client.UserChangePassword(originalMe.ID, &api.ChangePasswordRequest{
		OldPassword: password,
		NewPassword: utils.NewID(utils.IDTypeNone),
	})
	require.NoError(t, resp.Error)
	require.True(t, success)
}

func randomBytes(t *testing.T, n int) []byte {
	bb := make([]byte, n)
	_, err := rand.Read(bb)
	require.NoError(t, err)
	return bb
}

func TestWorkspaceUploadFile(t *testing.T) {
	t.Run("no permission", func(t *testing.T) { // native auth, but not login
		th := SetupTestHelperWithoutToken().InitBasic()
		defer th.TearDown()

		workspaceID := "0"
		rootID := utils.NewID(utils.IDTypeBlock)
		data := randomBytes(t, 1024)
		result, resp := th.Client.WorkspaceUploadFile(workspaceID, rootID, bytes.NewReader(data))
		require.Error(t, resp.Error)
		require.Nil(t, result)
	})

	t.Run("success", func(t *testing.T) { // single token auth
		th := SetupTestHelper().InitBasic()
		defer th.TearDown()

		workspaceID := "0"
		rootID := utils.NewID(utils.IDTypeBlock)
		data := randomBytes(t, 1024)
		result, resp := th.Client.WorkspaceUploadFile(workspaceID, rootID, bytes.NewReader(data))
		require.NoError(t, resp.Error)
		require.NotNil(t, result)
		require.NotEmpty(t, result.FileID)
		// TODO get the uploaded file
	})
}
