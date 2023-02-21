package util

import (
	"testing"

	"github.com/mattermost/focalboard/server/integrationtests"
	"github.com/mattermost/focalboard/server/server"
	"github.com/stretchr/testify/require"
)

type TestHelper struct {
	Server *server.Server
}

func SetupTestHelper(t *testing.T) (*TestHelper, func()) {
	th := &TestHelper{}
	th.Server = integrationtests.NewTestServerPluginMode()

	err := th.Server.Start()
	require.NoError(t, err, "Server start should not error")

	tearDown := func() {
		err := th.Server.Shutdown()
		require.NoError(t, err, "Server shutdown should not error")
	}
	return th, tearDown
}
