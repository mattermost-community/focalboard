// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package storetests

import (
	"fmt"
	"testing"

	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/services/store"
	"github.com/mattermost/focalboard/server/utils"
	"github.com/stretchr/testify/assert"
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
		newUser, err := store.CreateUser(user)
		require.NoError(t, err)
		require.NotNil(t, newUser)

		users = append(users, user)
	}
	return users
}

func createTestBlocks(t *testing.T, store store.Store, userID string, num int) []*model.Block {
	var blocks []*model.Block
	for i := 0; i < num; i++ {
		block := &model.Block{
			ID:        utils.NewID(utils.IDTypeBlock),
			BoardID:   utils.NewID(utils.IDTypeBoard),
			Type:      model.TypeCard,
			CreatedBy: userID,
		}
		err := store.InsertBlock(block, userID)
		require.NoError(t, err)

		blocks = append(blocks, block)
	}
	return blocks
}

func createTestBlocksForCard(t *testing.T, store store.Store, cardID string, num int) []*model.Block {
	card, err := store.GetBlock(cardID)
	require.NoError(t, err)
	assert.EqualValues(t, model.TypeCard, card.Type)

	var blocks []*model.Block
	for i := 0; i < num; i++ {
		block := &model.Block{
			ID:        utils.NewID(utils.IDTypeBlock),
			BoardID:   card.BoardID,
			Type:      model.TypeText,
			CreatedBy: card.CreatedBy,
			ParentID:  card.ID,
			Title:     fmt.Sprintf("text %d", i),
		}
		err := store.InsertBlock(block, card.CreatedBy)
		require.NoError(t, err)

		blocks = append(blocks, block)
	}
	return blocks
}

func createTestCards(t *testing.T, store store.Store, userID string, boardID string, num int) []*model.Block {
	var blocks []*model.Block
	for i := 0; i < num; i++ {
		block := &model.Block{
			ID:        utils.NewID(utils.IDTypeCard),
			BoardID:   boardID,
			ParentID:  boardID,
			Type:      model.TypeCard,
			CreatedBy: userID,
			Title:     fmt.Sprintf("card %d", i),
		}
		err := store.InsertBlock(block, userID)
		require.NoError(t, err)

		blocks = append(blocks, block)
	}
	return blocks
}

func createTestBoards(t *testing.T, store store.Store, userID string, num int) []*model.Board {
	var boards []*model.Board
	for i := 0; i < num; i++ {
		board := &model.Board{
			ID:        utils.NewID(utils.IDTypeBoard),
			TeamID:    testTeamID,
			Type:      "O",
			CreatedBy: userID,
			Title:     fmt.Sprintf("board %d", i),
		}
		boardNew, err := store.InsertBoard(board, userID)
		require.NoError(t, err)

		boards = append(boards, boardNew)
	}
	return boards
}
