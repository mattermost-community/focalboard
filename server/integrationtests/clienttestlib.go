package integrationtests

import (
	"log"
	"net/http"
	"os"
	"time"

	"github.com/mattermost/focalboard/server/client"
	"github.com/mattermost/focalboard/server/server"
	"github.com/mattermost/focalboard/server/services/config"
)

type TestHelper struct {
	Server *server.Server
	Client *client.Client
}

func getTestConfig() *config.Configuration {
	dbType := os.Getenv("FB_STORE_TEST_DB_TYPE")
	if dbType == "" {
		dbType = "sqlite3"
	}

	connectionString := os.Getenv("FB_STORE_TEST_CONN_STRING")
	if connectionString == "" {
		connectionString = ":memory:"
	}

	return &config.Configuration{
		ServerRoot:     "http://localhost:8888",
		Port:           8888,
		DBType:         dbType,
		DBConfigString: connectionString,
		DBTablePrefix:  "test_",
		WebPath:        "./pack",
		FilesDriver:    "local",
		FilesPath:      "./files",
	}
}

func SetupTestHelper() *TestHelper {
	sessionToken := "TESTTOKEN"
	th := &TestHelper{}
	srv, err := server.New(getTestConfig(), sessionToken)
	if err != nil {
		panic(err)
	}
	th.Server = srv
	th.Client = client.NewClient(srv.Config().ServerRoot, sessionToken)

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
		log.Printf("Polling server at %v", URL)
		resp, err := http.Get(URL)
		if err != nil {
			log.Println("Polling failed:", err)
			time.Sleep(100 * time.Millisecond)
			continue
		}
		resp.Body.Close()

		// Currently returns 404
		// if resp.StatusCode != http.StatusOK {
		// 	log.Println("Not OK:", resp.StatusCode)
		// 	continue
		// }

		// Reached this point: server is up and running!
		log.Println("Server ping OK, statusCode:", resp.StatusCode)

		break
	}

	return th
}

func (th *TestHelper) TearDown() {
	err := th.Server.Shutdown()
	if err != nil {
		panic(err)
	}
}
