// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package storetests

import (
	"fmt"
	"testing"

	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/services/store"
	"github.com/mattermost/focalboard/server/utils"
	"github.com/stretchr/testify/require"
)

func createTestUsers(t *testing.T, store store.Store, num int) []*model.User {
	var users []*model.User
	for i := 0; i < num; i++ {
		user := &model.User{
			ID:       utils.NewID(utils.IDTypeUser),
			Username: fmt.Sprintf("mooncake.%d", i),
			Email:    fmt.Sprintf("mooncake.%d@example.com", i),
		}
		err := store.CreateUser(user)
		require.NoError(t, err)

		users = append(users, user)
	}
	return users
}

func createTestBlocks(t *testing.T, store store.Store, container store.Container, userID string, num int) []*model.Block {
	var blocks []*model.Block
	for i := 0; i < num; i++ {
		block := &model.Block{
			ID:          utils.NewID(utils.IDTypeBlock),
			RootID:      utils.NewID(utils.IDTypeBlock),
			Type:        "card",
			CreatedBy:   userID,
			WorkspaceID: container.WorkspaceID,
		}
		err := store.InsertBlock(container, block, userID)
		require.NoError(t, err)

		blocks = append(blocks, block)
	}
	return blocks
}

func containerForWorkspace(workspaceID string) store.Container {
	return store.Container{
		WorkspaceID: workspaceID,
	}
}
