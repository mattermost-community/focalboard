// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package storetests

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/services/store"
	"github.com/mattermost/focalboard/server/utils"
)

func StoreTestNotificationHintsStore(t *testing.T, setup func(t *testing.T) (store.Store, func())) {
	t.Run("UpsertNotificationHint", func(t *testing.T) {
		store, tearDown := setup(t)
		defer tearDown()
		testUpsertNotificationHint(t, store)
	})

	t.Run("DeleteNotificationHint", func(t *testing.T) {
		store, tearDown := setup(t)
		defer tearDown()
		testDeleteNotificationHint(t, store)
	})

	t.Run("GetNotificationHint", func(t *testing.T) {
		store, tearDown := setup(t)
		defer tearDown()
		testGetNotificationHint(t, store)
	})

	t.Run("GetNextNotificationHint", func(t *testing.T) {
		store, tearDown := setup(t)
		defer tearDown()
		testGetNextNotificationHint(t, store)
	})
}

func testUpsertNotificationHint(t *testing.T, store store.Store) {
	t.Run("create notification hint", func(t *testing.T) {
		hint := &model.NotificationHint{
			BlockType: "card",
			BlockID:   utils.NewID(utils.IDTypeBlock),
		}

		hintNew, err := store.UpsertNotificationHint(hint, time.Second*15)
		require.NoError(t, err, "upsert notification hint should not error")
		assert.Equal(t, hint.BlockID, hintNew.BlockID)
		assert.NoError(t, hintNew.IsValid())
	})

	t.Run("duplicate notification hint", func(t *testing.T) {
		hint := &model.NotificationHint{
			BlockType: "card",
			BlockID:   utils.NewID(utils.IDTypeBlock),
		}
		hintNew, err := store.UpsertNotificationHint(hint, time.Second*15)
		require.NoError(t, err, "upsert notification hint should not error")

		// sleep a short time so the notify_at timestamps won't collide
		time.Sleep(time.Millisecond * 20)

		hint = &model.NotificationHint{
			BlockType: "card",
			BlockID:   hintNew.BlockID,
		}
		hintDup, err := store.UpsertNotificationHint(hint, time.Second*15)

		require.NoError(t, err, "upsert notification hint should not error")
		// the create_at fields should match, but notify_at should be updated
		assert.Equal(t, hintNew.CreateAt, hintDup.CreateAt)
		assert.Greater(t, hintDup.NotifyAt, hintNew.NotifyAt)
	})

	t.Run("invalid notification hint", func(t *testing.T) {
		hint := &model.NotificationHint{}

		_, err := store.UpsertNotificationHint(hint, time.Second*15)
		assert.ErrorAs(t, err, &model.ErrInvalidNotificationHint{}, "invalid notification hint should error")

		hint.BlockType = "board"
		_, err = store.UpsertNotificationHint(hint, time.Second*15)
		assert.ErrorAs(t, err, &model.ErrInvalidNotificationHint{}, "invalid notification hint should error")

		hint.BlockID = utils.NewID(utils.IDTypeBlock)
		hintNew, err := store.UpsertNotificationHint(hint, time.Second*15)
		assert.NoError(t, err, "valid notification hint should not error")
		assert.NoError(t, hintNew.IsValid(), "created notification hint should be valid")
	})
}

func testDeleteNotificationHint(t *testing.T, store store.Store) {
	t.Run("delete notification hint", func(t *testing.T) {
		hint := &model.NotificationHint{
			BlockType: "card",
			BlockID:   utils.NewID(utils.IDTypeBlock),
		}
		hintNew, err := store.UpsertNotificationHint(hint, time.Second*15)
		require.NoError(t, err, "create notification hint should not error")

		// check the notification hint exists
		hint, err = store.GetNotificationHint(hintNew.BlockID)
		require.NoError(t, err, "get notification hint should not error")
		assert.Equal(t, hintNew.BlockID, hint.BlockID)
		assert.Equal(t, hintNew.CreateAt, hint.CreateAt)

		err = store.DeleteNotificationHint(hintNew.BlockID)
		require.NoError(t, err, "delete notification hint should not error")

		// check the notification hint was deleted
		hint, err = store.GetNotificationHint(hintNew.BlockID)
		require.NoError(t, err, "get notification hint should not error")
		assert.Nil(t, hint)
	})

	t.Run("delete non-existent notification hint", func(t *testing.T) {
		err := store.DeleteNotificationHint("bogus")
		require.NoError(t, err, "delete non-existent notification hint should not error")
	})
}

func testGetNotificationHint(t *testing.T, store store.Store) {
	t.Run("get notification hint", func(t *testing.T) {
		hint := &model.NotificationHint{
			BlockType: "card",
			BlockID:   utils.NewID(utils.IDTypeBlock),
		}
		hintNew, err := store.UpsertNotificationHint(hint, time.Second*15)
		require.NoError(t, err, "create notification hint should not error")

		// make sure notification hint can be fetched
		hint, err = store.GetNotificationHint(hintNew.BlockID)
		require.NoError(t, err, "get notification hint should not error")
		assert.Equal(t, hintNew, hint)
	})

	t.Run("get non-existent notification hint", func(t *testing.T) {
		hint, err := store.GetNotificationHint("bogus")
		require.NoError(t, err, "get notification hint should not error")
		require.Nil(t, hint, "get notification hint should return nil")
	})
}

func testGetNextNotificationHint(t *testing.T, store store.Store) {
	t.Run("get next notification hint", func(t *testing.T) {
		const loops = 5
		ids := [5]string{}

		// create some hints with unique notifyAt
		for i := 0; i < loops; i++ {
			hint := &model.NotificationHint{
				BlockType: "card",
				BlockID:   utils.NewID(utils.IDTypeBlock),
			}
			hintNew, err := store.UpsertNotificationHint(hint, time.Second*15)
			require.NoError(t, err, "create notification hint should not error")

			ids[i] = hintNew.BlockID
			time.Sleep(time.Millisecond * 20) // ensure next timestamp is unique
		}

		// check the hints come back in the right order
		notifyAt := utils.GetMillisForTime(time.Now().Add(time.Millisecond * 50))
		for i := 0; i < loops; i++ {
			hint, err := store.GetNextNotificationHint()
			require.NoError(t, err, "get next notification hint should not error")
			require.NotNil(t, hint, "get next notification hint should not return nil")
			assert.Equal(t, ids[i], hint.BlockID)
			assert.Less(t, notifyAt, hint.NotifyAt)
			notifyAt = hint.NotifyAt
		}
	})

	t.Run("get next notification hint from empty table", func(t *testing.T) {
		// empty the table
		for {
			hint, err := store.GetNextNotificationHint()
			require.NoError(t, err, "get next notification hint should not error")

			if hint == nil {
				break
			}
			err = store.DeleteNotificationHint(hint.BlockID)
			require.NoError(t, err, "delete notification hint should not error")
		}

		hint, err := store.GetNextNotificationHint()
		require.NoError(t, err, "get next notification hint should not error")
		require.Nil(t, hint, "get next notification hint should return nil")
	})
}
