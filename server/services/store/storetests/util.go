// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package storetests

import (
	"fmt"
	"testing"

	"github.com/google/uuid"
	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/services/store"
	"github.com/stretchr/testify/require"
)

func createTestUsers(t *testing.T, store store.Store, num int) []*model.User {
	var users []*model.User
	for i := 0; i < num; i++ {
		user := &model.User{
			ID:       uuid.New().String(),
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
			ID:        uuid.New().String(),
			RootID:    uuid.New().String(),
			Type:      "card",
			CreatedBy: userID,
		}
		err := store.InsertBlock(container, block, userID)
		require.NoError(t, err)

		blocks = append(blocks, block)
	}
	return blocks
}
