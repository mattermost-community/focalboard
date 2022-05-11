package integrationtests

import (
	"errors"
	"net/http"
	"os"
	"testing"
	"time"

	"github.com/mattermost/focalboard/server/api"
	"github.com/mattermost/focalboard/server/client"
	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/server"
	"github.com/mattermost/focalboard/server/services/config"
	"github.com/mattermost/focalboard/server/services/store"
	"github.com/mattermost/focalboard/server/services/store/sqlstore"
	"github.com/mattermost/focalboard/server/utils"
	"github.com/stretchr/testify/require"

	"github.com/mattermost/mattermost-server/v6/shared/mlog"
)

type LicenseType int

const (
	LicenseNone         LicenseType = iota // 0
	LicenseProfessional                    // 1
	LicenseEnterprise                      // 2
)

type TestHelper struct {
	T       *testing.T
	Server  *server.Server
	Client  *client.Client
	Client2 *client.Client
}

func getTestConfig() (*config.Configuration, error) {
	dbType, connectionString, err := sqlstore.PrepareNewTestDatabase()
	if err != nil {
		return nil, err
	}

	logging := `
	{
		"testing": {
			"type": "console",
			"options": {
				"out": "stdout"
			},
			"format": "plain",
			"format_options": {
				"delim": "  "
			},
			"levels": [
				{"id": 5, "name": "debug"},
				{"id": 4, "name": "info"},
				{"id": 3, "name": "warn"},
				{"id": 2, "name": "error", "stacktrace": true},
				{"id": 1, "name": "fatal", "stacktrace": true},
				{"id": 0, "name": "panic", "stacktrace": true}
			]
		}
	}`

	return &config.Configuration{
		ServerRoot:        "http://localhost:8888",
		Port:              8888,
		DBType:            dbType,
		DBConfigString:    connectionString,
		DBTablePrefix:     "test_",
		WebPath:           "./pack",
		FilesDriver:       "local",
		FilesPath:         "./files",
		LoggingCfgJSON:    logging,
		SessionExpireTime: int64(30 * time.Second),
		AuthMode:          "native",
	}, nil
}

func newTestServer(singleUserToken string) *server.Server {
	return newTestServerWithLicense(singleUserToken, LicenseNone)
}

func newTestServerWithLicense(singleUserToken string, licenseType LicenseType) *server.Server {
	cfg, err := getTestConfig()
	if err != nil {
		panic(err)
	}

	logger, _ := mlog.NewLogger()
	if err = logger.Configure("", cfg.LoggingCfgJSON, nil); err != nil {
		panic(err)
	}
	innerStore, err := server.NewStore(cfg, logger)
	if err != nil {
		panic(err)
	}

	var db store.Store

	switch licenseType {
	case LicenseProfessional:
		db = NewTestProfessionalStore(innerStore)
	case LicenseEnterprise:
		db = NewTestEnterpriseStore(innerStore)
	case LicenseNone:
		fallthrough
	default:
		db = innerStore
	}

	params := server.Params{
		Cfg:             cfg,
		SingleUserToken: singleUserToken,
		DBStore:         db,
		Logger:          logger,
	}

	srv, err := server.New(params)
	if err != nil {
		panic(err)
	}

	return srv
}

func SetupTestHelper() *TestHelper {
	sessionToken := "TESTTOKEN"
	th := &TestHelper{}
	th.Server = newTestServer(sessionToken)
	th.Client = client.NewClient(th.Server.Config().ServerRoot, sessionToken)
	return th
}

func SetupTestHelperWithLicense(t *testing.T, licenseType LicenseType) *TestHelper {
	th := &TestHelper{T: t}
	th.Server = newTestServerWithLicense("", licenseType)
	th.Client = client.NewClient(th.Server.Config().ServerRoot, "")
	th.Client2 = client.NewClient(th.Server.Config().ServerRoot, "")
	return th
}

func SetupTestHelperWithoutToken() *TestHelper {
	th := &TestHelper{}
	th.Server = newTestServer("")
	th.Client = client.NewClient(th.Server.Config().ServerRoot, "")
	th.Client2 = client.NewClient(th.Server.Config().ServerRoot, "")
	return th
}

func (th *TestHelper) InitBasic() *TestHelper {
	go func() {
		if err := th.Server.Start(); err != nil {
			panic(err)
		}
	}()

	for {
		URL := th.Server.Config().ServerRoot
		th.Server.Logger().Info("Polling server", mlog.String("url", URL))
		resp, err := http.Get(URL) //nolint:gosec
		if err != nil {
			th.Server.Logger().Error("Polling failed", mlog.Err(err))
			time.Sleep(100 * time.Millisecond)
			continue
		}
		resp.Body.Close()

		// Currently returns 404
		// if resp.StatusCode != http.StatusOK {
		// 	th.Server.Logger().Error("Not OK", mlog.Int("statusCode", resp.StatusCode))
		// 	continue
		// }

		// Reached this point: server is up and running!
		th.Server.Logger().Info("Server ping OK", mlog.Int("statusCode", resp.StatusCode))

		break
	}

	return th
}

var ErrRegisterFail = errors.New("register failed")

func (th *TestHelper) InitUsers(username1 string, username2 string) error {
	workspace, err := th.Server.App().GetRootWorkspace()
	if err != nil {
		return err
	}

	clients := []*client.Client{th.Client, th.Client2}
	usernames := []string{username1, username2}

	for i, client := range clients {
		// register a new user
		password := utils.NewID(utils.IDTypeNone)
		registerRequest := &api.RegisterRequest{
			Username: usernames[i],
			Email:    usernames[i] + "@example.com",
			Password: password,
			Token:    workspace.SignupToken,
		}
		success, resp := client.Register(registerRequest)
		if resp.Error != nil {
			return resp.Error
		}
		if !success {
			return ErrRegisterFail
		}

		// login
		loginRequest := &api.LoginRequest{
			Type:     "normal",
			Username: registerRequest.Username,
			Email:    registerRequest.Email,
			Password: registerRequest.Password,
		}
		data, resp := client.Login(loginRequest)
		if resp.Error != nil {
			return resp.Error
		}

		client.Token = data.Token
	}
	return nil
}

func (th *TestHelper) Me(client *client.Client) *model.User {
	user, resp := client.GetMe()
	th.CheckOK(resp)
	require.NotNil(th.T, user)
	return user
}

func (th *TestHelper) GetUser1() *model.User {
	return th.Me(th.Client)
}

func (th *TestHelper) GetUser2() *model.User {
	return th.Me(th.Client2)
}

func (th *TestHelper) TearDown() {
	defer func() { _ = th.Server.Logger().Shutdown() }()

	err := th.Server.Shutdown()
	if err != nil {
		panic(err)
	}

	os.RemoveAll(th.Server.Config().FilesPath)
}

func (th *TestHelper) Logout(client *client.Client) {
	client.Token = ""
}

func (th *TestHelper) CheckOK(r *client.Response) {
	require.Equal(th.T, http.StatusOK, r.StatusCode)
	require.NoError(th.T, r.Error)
}

func (th *TestHelper) CheckUnauthorized(r *client.Response) {
	require.Equal(th.T, http.StatusUnauthorized, r.StatusCode)
	require.Error(th.T, r.Error)
}

func (th *TestHelper) CheckNotImplemented(r *client.Response) {
	require.Equal(th.T, http.StatusNotImplemented, r.StatusCode)
	require.Error(th.T, r.Error)
}
