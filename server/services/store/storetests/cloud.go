// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package storetests

import (
	"testing"
	"time"

	"github.com/stretchr/testify/require"

	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/utils"
	"github.com/mattermost/focalboard/server/services/store"
)

func StoreTestCloudStore(t *testing.T, setup func(t *testing.T) (store.Store, func())) {
	container := store.Container{
		WorkspaceID: "0",
	}

	t.Run("GetUsedCardsCount", func(t *testing.T) {
		store, tearDown := setup(t)
		defer tearDown()
		testGetUsedCardsCount(t, store, container)
	})
	t.Run("TestGetCardLimitTimestamp", func(t *testing.T) {
		store, tearDown := setup(t)
		defer tearDown()
		testGetCardLimitTimestamp(t, store, container)
	})
}

func testGetUsedCardsCount(t *testing.T, store store.Store, container store.Container) {
	userID := "user-id"

	t.Run("should return zero when no cards have been created", func(t *testing.T) {
		count, err := store.GetUsedCardsCount()
		require.NoError(t, err)
		require.Zero(t, count)
	})

	t.Run("should correctly return the cards of all boards", func(t *testing.T) {
		// two boards
		for _, boardID := range []string{"board1", "board2"} {
			board := model.Block{
				ID: boardID,
				RootID: boardID,
				Type: model.TypeBoard,
			}
			require.NoError(t, store.InsertBlock(container, &board, userID))
		}

		// board 1 has three cards
		for _, cardID := range []string{"card1", "card2", "card3"} {
			card := model.Block{
				ID: cardID,
				ParentID: "board1",
				RootID: "board1",
				Type: model.TypeCard,
			}
			require.NoError(t, store.InsertBlock(container, &card, userID))
		}

		// board 2 has two cards
		for _, cardID := range []string{"card4", "card5"} {
			card := model.Block{
				ID: cardID,
				ParentID: "board2",
				RootID: "board2",
				Type: model.TypeCard,
			}
			require.NoError(t, store.InsertBlock(container, &card, userID))
		}

		count, err := store.GetUsedCardsCount()
		require.NoError(t, err)
		require.Equal(t, 5, count)
	})

	t.Run("should not take into account content blocks", func(t *testing.T) {
		// we add a couple of content blocks
		text := model.Block{
			ID: "text-id",
			ParentID: "card1",
			RootID: "board1",
			Type: model.TypeText,
		}
		require.NoError(t, store.InsertBlock(container, &text, userID))

		view := model.Block{
			ID: "view-id",
			ParentID: "board1",
			RootID: "board1",
			Type: model.TypeView,
		}
		require.NoError(t, store.InsertBlock(container, &view, userID))

		// and count should not change
		count, err := store.GetUsedCardsCount()
		require.NoError(t, err)
		require.Equal(t, 5, count)
	})

	t.Run("should not take into account cards belonging to templates", func(t *testing.T) {
		// we add a template with cards
		templateID := "template-id"
		boardTemplate := model.Block{
			ID: templateID,
			RootID: templateID,
			Type: model.TypeBoard,
			Fields: map[string]interface{}{
				"isTemplate": true,
			},
		}
		require.NoError(t, store.InsertBlock(container, &boardTemplate, userID))

		for _, cardID := range []string{"card6", "card7", "card8"} {
			card := model.Block{
				ID: cardID,
				ParentID: templateID,
				RootID: templateID,
				Type: model.TypeCard,
			}
			require.NoError(t, store.InsertBlock(container, &card, userID))
		}

		// and count should still be the same
		count, err := store.GetUsedCardsCount()
		require.NoError(t, err)
		require.Equal(t, 5, count)
	})

	t.Run("should not take into account deleted cards", func(t *testing.T) {
		// we create a ninth card on the first board
		card9 := model.Block{
			ID: "card9",
			ParentID: "board1",
			RootID: "board1",
			Type: model.TypeCard,
			DeleteAt: utils.GetMillis(),
		}
		require.NoError(t, store.InsertBlock(container, &card9, userID))

		// and count should still be the same
		count, err := store.GetUsedCardsCount()
		require.NoError(t, err)
		require.Equal(t, 5, count)
	})
}

func testGetCardLimitTimestamp(t *testing.T, store store.Store, container store.Container) {
	userID := "user-id"

	// two boards
	for _, boardID := range []string{"board1", "board2"} {
		board := model.Block{
			ID: boardID,
			RootID: boardID,
			Type: model.TypeBoard,
		}
		require.NoError(t, store.InsertBlock(container, &board, userID))
	}

	// board 1 has five cards
	for _, cardID := range []string{"card1", "card2", "card3", "card4", "card5"} {
		card := model.Block{
			ID: cardID,
			ParentID: "board1",
			RootID: "board1",
			Type: model.TypeCard,
		}
		require.NoError(t, store.InsertBlock(container, &card, userID))
		time.Sleep(10 * time.Millisecond)
	}

	// board 2 has five cards
	for _, cardID := range []string{"card6", "card7", "card8", "card9", "card10"} {
		card := model.Block{
			ID: cardID,
			ParentID: "board2",
			RootID: "board2",
			Type: model.TypeCard,
		}
		require.NoError(t, store.InsertBlock(container, &card, userID))
		time.Sleep(10 * time.Millisecond)
	}

	t.Run("should return the update_at time for the card at the limit", func(t *testing.T) {
		t.Run("limit 10", func(t *testing.T) {
			// we fetch the first block
			card1, err := store.GetBlock(container, "card1")
			require.NoError(t, err)

			// and assert that if the limit is 10, the update_at timestamp
			// of the last card is retrieved
			cardLimitTimestamp, err := store.GetCardLimitTimestamp(10)
			require.NoError(t, err)
			require.Equal(t, card1.UpdateAt, cardLimitTimestamp)
		})

		t.Run("limit 5", func(t *testing.T) {
			// if the limit is 5, the timestamp should be the one from
			// the sixth card (the first five are older and out of the
			// active window)
			card6, err := store.GetBlock(container, "card6")
			require.NoError(t, err)

			cardLimitTimestamp, err := store.GetCardLimitTimestamp(5)
			require.NoError(t, err)
			require.Equal(t, card6.UpdateAt, cardLimitTimestamp)
		})

		t.Run("we update card10 and assert that with limit 1, it is now the timestamp retrieved", func(t *testing.T) {
			time.Sleep(10 * time.Millisecond)
			card10, err := store.GetBlock(container, "card10")
			require.NoError(t, err)

			card10.Title = "New title"
			require.NoError(t, store.InsertBlock(container, card10, userID))

			newCard10, err := store.GetBlock(container, "card10")
			require.NoError(t, err)

			cardLimitTimestamp, err := store.GetCardLimitTimestamp(1)
			require.NoError(t, err)
			require.Equal(t, newCard10.UpdateAt, cardLimitTimestamp)
		})

		t.Run("limit should stop applying if we remove the last card", func(t *testing.T) {
			cardLimitTimestamp, err := store.GetCardLimitTimestamp(10)
			require.NoError(t, err)
			require.NotZero(t, cardLimitTimestamp)

			require.NoError(t, store.DeleteBlock(container, "card1", userID))
			cardLimitTimestamp, err = store.GetCardLimitTimestamp(10)
			require.NoError(t, err)
			require.Zero(t, cardLimitTimestamp)
		})
	})

	t.Run("should return zero if there are less cards than the limit", func(t *testing.T) {
		cardLimitTimestamp, err := store.GetCardLimitTimestamp(15)
		require.NoError(t, err)
		require.Zero(t, cardLimitTimestamp)
	})
}
