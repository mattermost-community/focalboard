package integrationtests

import (
	"net/http"
	"testing"

	"github.com/stretchr/testify/assert"

	"github.com/stretchr/testify/require"
)

func TestGetWorkspace(t *testing.T) {
	t.Run("Root workspace for any id", func(t *testing.T) {
		th := SetupTestHelper().InitBasic()
		defer th.TearDown()
		anyWorkspaceID := "0"
		workspace, resp := th.Client.GetWorkspace(anyWorkspaceID)
		require.NoError(t, resp.Error)
		assert.NotNil(t, workspace)
		assert.Equal(t, "0", workspace.ID)
	})

	t.Run("Get not existing workspace", func(t *testing.T) {
		th := SetupTestHelperWithoutToken().InitBasic()
		defer th.TearDown()
		notExistingWorkspace := "-1"
		workspace, resp := th.Client.GetWorkspace(notExistingWorkspace)
		require.Nil(t, workspace)
		require.Error(t, resp.Error)
		assert.Equal(t, http.StatusUnauthorized, resp.StatusCode)
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
