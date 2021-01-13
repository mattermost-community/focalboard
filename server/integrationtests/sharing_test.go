package integrationtests

import (
	"testing"

	"github.com/mattermost/mattermost-octo-tasks/server/model"
	"github.com/mattermost/mattermost-octo-tasks/server/utils"
	"github.com/stretchr/testify/require"
)

func TestSharing(t *testing.T) {
	th := SetupTestHelper().InitBasic()
	defer th.TearDown()

	rootID := utils.CreateGUID()
	token := utils.CreateGUID()

	t.Run("Check no initial sharing", func(t *testing.T) {
		sharing, resp := th.Client.GetSharing(rootID)
		require.NoError(t, resp.Error)
		require.Empty(t, sharing.ID)
		require.False(t, sharing.Enabled)
	})

	t.Run("POST sharing", func(t *testing.T) {
		sharing := model.Sharing{
			ID:       rootID,
			Token:    token,
			Enabled:  true,
			UpdateAt: 1,
		}

		success, resp := th.Client.PostSharing(sharing)
		require.True(t, success)
		require.NoError(t, resp.Error)
	})

	t.Run("GET sharing", func(t *testing.T) {
		sharing, resp := th.Client.GetSharing(rootID)
		require.NoError(t, resp.Error)
		require.NotNil(t, sharing)
		require.Equal(t, sharing.ID, rootID)
		require.True(t, sharing.Enabled)
		require.Equal(t, sharing.Token, token)
	})
}
