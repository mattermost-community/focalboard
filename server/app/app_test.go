package app

import (
	"testing"

	"github.com/mattermost/focalboard/server/services/config"
	"github.com/stretchr/testify/require"
)

func TestSetConfig(t *testing.T) {
	th, tearDown := SetupTestHelper(t)
	defer tearDown()

	t.Run("Test Update Config", func(t *testing.T) {
		require.False(t, th.App.config.EnablePublicSharedBoards)
		newConfiguration := config.Configuration{}
		newConfiguration.EnablePublicSharedBoards = true
		th.App.SetConfig(&newConfiguration)

		require.True(t, th.App.config.EnablePublicSharedBoards)
	})
}
