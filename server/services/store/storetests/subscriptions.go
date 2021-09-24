// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package storetests

import (
	"fmt"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/services/store"
)

func StoreTestSubscriptionsStore(t *testing.T, setup func(t *testing.T) (store.Store, func())) {
	container := store.Container{
		WorkspaceID: "0",
	}

	t.Run("CreateSubscription", func(t *testing.T) {
		store, tearDown := setup(t)
		defer tearDown()
		testCreateSubscription(t, store, container)
	})

	t.Run("DeleteSubscription", func(t *testing.T) {
		store, tearDown := setup(t)
		defer tearDown()
		testDeleteSubscription(t, store, container)
	})
}

func testCreateSubscription(t *testing.T, store store.Store, container store.Container) {
	t.Run("create subscriptions", func(t *testing.T) {
		users := createTestUsers(t, store, 10)
		blocks := createTestBlocks(t, store, container, users[0].ID, 50)

		for i, user := range users {
			for j := 0; j < i; j++ {
				sub := &model.Subscription{
					BlockType:      blocks[j].Type,
					BlockID:        blocks[j].ID,
					SubscriberType: "user",
					SubscriberID:   user.ID,
				}
				subNew, err := store.CreateSubscription(sub)
				require.NoError(t, err, "create subscription should not error")

				assert.NotEmpty(t, subNew.ID)
				assert.NotZero(t, subNew.NotifiedAt)
				assert.NotZero(t, subNew.CreateAt)
				assert.Zero(t, subNew.DeleteAt)
			}
		}

		// ensure each user has the right number of subscriptions
		for i, user := range users {
			subs, err := store.GetSubscriptions(user.ID)
			require.NoError(t, err, "get subscriptions should not error")
			assert.Len(t, subs, i)
		}
	})

	t.Run("duplicate subscription", func(t *testing.T) {
		admin := createTestUsers(t, store, 1)[0]
		user := createTestUsers(t, store, 1)[0]
		block := createTestBlocks(t, store, container, admin.ID, 1)[0]

		sub := &model.Subscription{
			BlockType:      block.Type,
			BlockID:        block.ID,
			SubscriberType: "user",
			SubscriberID:   user.ID,
		}
		subNew, err := store.CreateSubscription(sub)
		require.NoError(t, err, "create subscription should not error")

		sub = &model.Subscription{
			BlockType:      block.Type,
			BlockID:        block.ID,
			SubscriberType: "user",
			SubscriberID:   user.ID,
		}

		subDup, err := store.CreateSubscription(sub)
		require.NoError(t, err, "create duplicate subscription should not error")

		assert.Equal(t, subNew, subDup, "subscriptions should match")
	})

	t.Run("invalid subscription", func(t *testing.T) {
		admin := createTestUsers(t, store, 1)[0]
		user := createTestUsers(t, store, 1)[0]
		block := createTestBlocks(t, store, container, admin.ID, 1)[0]

		sub := &model.Subscription{}

		_, err := store.CreateSubscription(sub)
		assert.ErrorAs(t, err, &model.ErrInvalidSubscription{}, "invalid subscription should error")

		sub.BlockType = block.Type
		_, err = store.CreateSubscription(sub)
		assert.ErrorAs(t, err, &model.ErrInvalidSubscription{}, "invalid subscription should error")

		sub.BlockID = block.ID
		_, err = store.CreateSubscription(sub)
		assert.ErrorAs(t, err, &model.ErrInvalidSubscription{}, "invalid subscription should error")

		sub.SubscriberType = "user"
		_, err = store.CreateSubscription(sub)
		assert.ErrorAs(t, err, &model.ErrInvalidSubscription{}, "invalid subscription should error")

		sub.SubscriberID = user.ID
		subNew, err := store.CreateSubscription(sub)
		assert.NoError(t, err, "valid subscription should not error")

		assert.NoError(t, subNew.IsValid(), "created subscription should be valid")
	})
}

func testDeleteSubscription(t *testing.T, store store.Store, container store.Container) {
	t.Run("delete subscription", func(t *testing.T) {
		user := createTestUsers(t, store, 1)[0]
		block := createTestBlocks(t, store, container, user.ID, 1)[0]

		sub := &model.Subscription{
			BlockType:      block.Type,
			BlockID:        block.ID,
			SubscriberType: "user",
			SubscriberID:   user.ID,
		}
		subNew, err := store.CreateSubscription(sub)
		require.NoError(t, err, "create subscription should not error")

		// check the subscription exists
		subs, err := store.GetSubscriptions(user.ID)
		require.NoError(t, err, "get subscriptions should not error")
		assert.Len(t, subs, 1)
		assert.Equal(t, subNew.ID, subs[0].ID)

		err = store.DeleteSubscription(block.ID, user.ID)
		require.NoError(t, err, "delete subscription should not error")

		// check the subscription was deleted
		subs, err = store.GetSubscriptions(user.ID)
		require.NoError(t, err, "get subscriptions should not error")
		assert.Empty(t, subs)
	})

	t.Run("delete non-existent subscription", func(t *testing.T) {
		err := store.DeleteSubscription("bogus", "bogus")
		require.NoError(t, err, "delete non-existent subscription should not error")
	})
}

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
