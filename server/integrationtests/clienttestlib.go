package integrationtests

import (
	"net/http"

	"github.com/mattermost/mattermost-octo-tasks/server/client"
	"github.com/mattermost/mattermost-octo-tasks/server/server"
	"github.com/mattermost/mattermost-octo-tasks/server/services/config"
)

type TestHelper struct {
	Server *server.Server
	Client *client.Client
}

func getTestConfig() *config.Configuration {
	return &config.Configuration{
		ServerRoot:     "http://localhost:8888",
		Port:           8888,
		DBType:         "sqlite3",
		DBConfigString: ":memory:",
		WebPath:        "./pack",
		FilesPath:      "./files",
	}
}

func SetupTestHelper() *TestHelper {
	th := &TestHelper{}
	srv, err := server.New(getTestConfig())
	if err != nil {
		panic(err)
	}
	th.Server = srv
	th.Client = client.NewClient(srv.Config().ServerRoot)

	return th
}

func (th *TestHelper) InitBasic() *TestHelper {
	go func() {
		if err := th.Server.Start(); err != http.ErrServerClosed {
			panic(err)
		}
	}()

	return th
}

func (th *TestHelper) TearDown() {
	err := th.Server.Shutdown()
	if err != nil {
		panic(err)
	}
}
