package app

import (
	"database/sql"
	"errors"
	"testing"

	"github.com/golang/mock/gomock"
	"github.com/mattermost/focalboard/server/model"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

var errInvalidWorkspace = errors.New("invalid workspace id")

var mockWorkspace = &model.Workspace{
	ID:    "mock-workspace-id",
	Title: "MockWorkspace",
}

var mockUserWorkspaces = []model.UserWorkspace{
	{
		ID:    "mock-user-workspace-id",
		Title: "MockUserWorkspace",
	},
}

var errUpsertSignupToken = errors.New("upsert error")

func TestGetRootWorkspace(t *testing.T) {
	var newRootWorkspace = &model.Workspace{
		ID:    "0",
		Title: "NewRootWorkspace",
	}

	testCases := []struct {
		title                         string
		workSpaceToReturnBeforeUpsert *model.Workspace
		workSpaceToReturnAfterUpsert  *model.Workspace
		isError                       bool
	}{
		{
			"Success, Return new root workspace, when root workspace returned by mockstore is nil",
			nil,
			newRootWorkspace,
			false,
		},
		{
			"Success, Return existing root workspace, when root workspace returned by mockstore is notnil",
			newRootWorkspace,
			nil,
			false,
		},
		{
			"Fail, Return nil, when root workspace returned by mockstore is nil, and upsert new root workspace fails",
			nil,
			nil,
			true,
		},
	}

	for _, eachTestacase := range testCases {
		t.Run(eachTestacase.title, func(t *testing.T) {
			th, tearDown := SetupTestHelper(t)
			defer tearDown()
			t.Log(eachTestacase.title)
			th.Store.EXPECT().GetWorkspace("0").Return(eachTestacase.workSpaceToReturnBeforeUpsert, nil)
			th.Store.EXPECT().UpsertWorkspaceSignupToken(gomock.Any()).DoAndReturn(
				func(arg0 model.Workspace) error {
					if eachTestacase.isError {
						return errUpsertSignupToken
					}
					th.Store.EXPECT().GetWorkspace("0").Return(eachTestacase.workSpaceToReturnAfterUpsert, nil)
					return nil
				})
			rootWorkSpace, err := th.App.GetRootWorkspace()

			if eachTestacase.isError {
				require.Error(t, err)
			} else {
				assert.NotNil(t, rootWorkSpace.ID)
				assert.NotNil(t, rootWorkSpace.SignupToken)
				assert.Equal(t, "", rootWorkSpace.ModifiedBy)
				assert.Equal(t, int64(0), rootWorkSpace.UpdateAt)
				assert.Equal(t, "NewRootWorkspace", rootWorkSpace.Title)
				require.NoError(t, err)
				require.NotNil(t, rootWorkSpace)
			}
		})
	}
}

func TestGetWorkspace(t *testing.T) {
	th, tearDown := SetupTestHelper(t)
	defer tearDown()

	testCases := []struct {
		title       string
		workspaceID string
		isError     bool
	}{
		{
			"Success, Return new root workspace, when workspace returned by mockstore is not nil",
			"mock-workspace-id",
			false,
		},
		{
			"Success, Return nil, when get workspace returns an sql error",
			"workspace-not-available-id",
			false,
		},
		{
			"Fail, Return nil, when get workspace by mockstore retruns an error",
			"invalid-workspace-id",
			true,
		},
	}

	th.Store.EXPECT().GetWorkspace("mock-workspace-id").Return(mockWorkspace, nil)
	th.Store.EXPECT().GetWorkspace("invalid-workspace-id").Return(nil, errInvalidWorkspace)
	th.Store.EXPECT().GetWorkspace("workspace-not-available-id").Return(nil, sql.ErrNoRows)
	for _, eachTestacase := range testCases {
		t.Run(eachTestacase.title, func(t *testing.T) {
			t.Log(eachTestacase.title)
			workSpace, err := th.App.GetWorkspace(eachTestacase.workspaceID)

			if eachTestacase.isError {
				require.Error(t, err)
			} else if eachTestacase.workspaceID != "workspace-not-available-id" {
				assert.NotNil(t, workSpace.ID)
				assert.NotNil(t, workSpace.SignupToken)
				assert.Equal(t, "mock-workspace-id", workSpace.ID)
				assert.Equal(t, "", workSpace.ModifiedBy)
				assert.Equal(t, int64(0), workSpace.UpdateAt)
				assert.Equal(t, "MockWorkspace", workSpace.Title)
				require.NoError(t, err)
				require.NotNil(t, workSpace)
			}
		})
	}
}

func TestWorkspaceOperations(t *testing.T) {
	th, tearDown := SetupTestHelper(t)
	defer tearDown()

	th.Store.EXPECT().UpsertWorkspaceSettings(*mockWorkspace).Return(nil)
	th.Store.EXPECT().UpsertWorkspaceSignupToken(*mockWorkspace).Return(nil)
	th.Store.EXPECT().GetWorkspaceCount().Return(int64(10), nil)
	th.Store.EXPECT().GetUserWorkspaces("mock-user-id").Return(mockUserWorkspaces, nil)

	errUpsertWorkspaceSettings := th.App.UpsertWorkspaceSettings(*mockWorkspace)
	assert.NoError(t, errUpsertWorkspaceSettings)

	errUpsertWorkspaceSignupToken := th.App.UpsertWorkspaceSignupToken(*mockWorkspace)
	assert.NoError(t, errUpsertWorkspaceSignupToken)

	count, errGetWorkspaceCount := th.App.GetWorkspaceCount()
	assert.NoError(t, errGetWorkspaceCount)
	assert.Equal(t, int64(10), count)

	userWorkSpace, errGetUserWorkSpace := th.App.GetUserWorkspaces("mock-user-id")
	assert.NoError(t, errGetUserWorkSpace)
	assert.NotNil(t, userWorkSpace)
}
