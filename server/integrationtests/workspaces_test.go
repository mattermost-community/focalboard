package integrationtests

import (
	"net/http"
	"testing"

	"github.com/stretchr/testify/assert"

	"github.com/mattermost/focalboard/server/utils"

	"github.com/stretchr/testify/require"
)

func TestGetWorkspace(t *testing.T) {
	th := SetupTestHelper().InitBasic()
	defer th.TearDown()

	t.Run("Root workspace for any id", func(t *testing.T) {
		anyWorkspaceID := utils.NewID(utils.IDTypeWorkspace)

		workspace, resp := th.Client.GetWorkspace(anyWorkspaceID)
		require.NoError(t, resp.Error)
		assert.NotNil(t, workspace)
		assert.Equal(t, "0", workspace.ID)
	})
}

func TestGetWorkspaceWithMattermostAuthMode(t *testing.T) {
	th := SetupTestHelperWithMattermostAuthMode().InitBasic()
	defer th.TearDown()

	t.Run("Does not have access", func(t *testing.T) {
		notExistingWorkspaceID := utils.NewID(utils.IDTypeWorkspace)

		workspace, resp := th.Client.GetWorkspace(notExistingWorkspaceID)
		require.Nil(t, workspace)
		require.Error(t, resp.Error)
		assert.Equal(t, http.StatusUnauthorized, resp.StatusCode)
	})

	t.Run("Not existing workspace", func(t *testing.T) {
		t.Skip("Figure out how to authorize")
		notExistingWorkspaceID := utils.NewID(utils.IDTypeWorkspace)

		workspace, resp := th.Client.GetWorkspace(notExistingWorkspaceID)
		require.NoError(t, resp.Error)
		assert.Nil(t, workspace)
	})

	t.Run("Existing workspace", func(t *testing.T) {
		t.Skip("Figure out how to authorize")
		existingWorkspace := "0"

		workspace, resp := th.Client.GetWorkspace(existingWorkspace)
		require.NoError(t, resp.Error)
		assert.NotNil(t, workspace)
		assert.Equal(t, "0", workspace.ID)
	})
}

func TestRegenerateWorkspaceSignupToken(t *testing.T) {
	th := SetupTestHelper().InitBasic()
	defer th.TearDown()

	workspaceID := "0"

	workspace, resp := th.Client.GetWorkspace(workspaceID)
	require.NoError(t, resp.Error)
	require.NotNil(t, workspace)

	signupToken := workspace.SignupToken

	resp = th.Client.RegenerateSignupToken(workspaceID)
	require.NoError(t, resp.Error)

	workspace, resp = th.Client.GetWorkspace(workspaceID)
	require.NoError(t, resp.Error)
	require.NotNil(t, workspace)

	newSignupToken := workspace.SignupToken

	assert.NotEqual(t, signupToken, newSignupToken)
}
