package app

import (
	"testing"

	"github.com/mattermost/focalboard/server/services/config"
	"github.com/stretchr/testify/require"
)

func TestGetClientConfig(t *testing.T) {
	th, tearDown := SetupTestHelper(t)
	defer tearDown()

	t.Run("Test Get Client Config", func(t *testing.T) {
		newConfiguration := config.Configuration{}
		newConfiguration.Telemetry = true
		newConfiguration.TelemetryID = "abcde"
		newConfiguration.EnablePublicSharedBoards = true
		newConfiguration.TeammateNameDisplay = "username"
		th.App.SetConfig(&newConfiguration)

		clientConfig := th.App.GetClientConfig()
		require.True(t, clientConfig.EnablePublicSharedBoards)
		require.True(t, clientConfig.Telemetry)
		require.Equal(t, "abcde", clientConfig.TelemetryID)
		require.Equal(t, "username", clientConfig.TeammateNameDisplay)
	})
}
