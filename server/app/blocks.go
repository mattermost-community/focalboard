package app

import (
	"errors"
	"fmt"
	"path/filepath"

	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/services/notify"
	"github.com/mattermost/focalboard/server/utils"

	"github.com/mattermost/mattermost-server/v6/shared/mlog"
)

var ErrBlocksFromMultipleBoards = errors.New("the block set contain blocks from multiple boards")

func (a *App) GetBlocks(boardID, parentID string, blockType string) ([]model.Block, error) {
	if boardID == "" {
		return []model.Block{}, nil
	}

	if blockType != "" && parentID != "" {
		return a.store.GetBlocksWithParentAndType(boardID, parentID, blockType)
	}

	if blockType != "" {
		return a.store.GetBlocksWithType(boardID, blockType)
	}

	return a.store.GetBlocksWithParent(boardID, parentID)
}

func (a *App) DuplicateBlock(boardID string, blockID string, userID string, asTemplate bool) ([]model.Block, error) {
	board, err := a.GetBoard(boardID)
	if err != nil {
		return nil, err
	}
	if board == nil {
		return nil, fmt.Errorf("cannot fetch board %s for DuplicateBlock: %w", boardID, err)
	}

	blocks, err := a.store.DuplicateBlock(boardID, blockID, userID, asTemplate)
	if err != nil {
		return nil, err
	}

	a.blockChangeNotifier.Enqueue(func() error {
		for _, block := range blocks {
			a.wsAdapter.BroadcastBlockChange(board.TeamID, block)
		}
		return nil
	})
	return blocks, err
}

func (a *App) GetBlocksWithBoardID(boardID string) ([]model.Block, error) {
	return a.store.GetBlocksWithBoardID(boardID)
}

func (a *App) PatchBlock(blockID string, blockPatch *model.BlockPatch, modifiedByID string) error {
	oldBlock, err := a.store.GetBlock(blockID)
	if err != nil {
		return nil
	}

	board, err := a.store.GetBoard(oldBlock.BoardID)
	if err != nil {
		return err
	}

	err = a.store.PatchBlock(blockID, blockPatch, modifiedByID)
	if err != nil {
		return err
	}

	a.metrics.IncrementBlocksPatched(1)
	block, err := a.store.GetBlock(blockID)
	if err != nil {
		return nil
	}
	a.blockChangeNotifier.Enqueue(func() error {
		// broadcast on websocket
		a.wsAdapter.BroadcastBlockChange(board.TeamID, *block)

		// broadcast on webhooks
		a.webhook.NotifyUpdate(*block)

		// send notifications
		a.notifyBlockChanged(notify.Update, block, oldBlock, modifiedByID)
		return nil
	})
	return nil
}

func (a *App) PatchBlocks(teamID string, blockPatches *model.BlockPatchBatch, modifiedByID string) error {
	oldBlocks := make([]model.Block, 0, len(blockPatches.BlockIDs))
	for _, blockID := range blockPatches.BlockIDs {
		oldBlock, err := a.store.GetBlock(blockID)
		if err != nil {
			return nil
		}
		oldBlocks = append(oldBlocks, *oldBlock)
	}

	err := a.store.PatchBlocks(blockPatches, modifiedByID)
	if err != nil {
		return err
	}

	a.blockChangeNotifier.Enqueue(func() error {
		a.metrics.IncrementBlocksPatched(len(oldBlocks))
		for i, blockID := range blockPatches.BlockIDs {
			newBlock, err := a.store.GetBlock(blockID)
			if err != nil {
				return nil
			}
			a.wsAdapter.BroadcastBlockChange(teamID, *newBlock)
			a.webhook.NotifyUpdate(*newBlock)
			a.notifyBlockChanged(notify.Update, newBlock, &oldBlocks[i], modifiedByID)
		}
		return nil
	})
	return nil
}

func (a *App) InsertBlock(block model.Block, modifiedByID string) error {
	board, bErr := a.store.GetBoard(block.BoardID)
	if bErr != nil {
		return bErr
	}

	err := a.store.InsertBlock(&block, modifiedByID)
	if err == nil {
		a.blockChangeNotifier.Enqueue(func() error {
			a.wsAdapter.BroadcastBlockChange(board.TeamID, block)
			a.metrics.IncrementBlocksInserted(1)
			a.webhook.NotifyUpdate(block)
			a.notifyBlockChanged(notify.Add, &block, nil, modifiedByID)
			return nil
		})
	}
	return err
}

func (a *App) InsertBlocks(blocks []model.Block, modifiedByID string, allowNotifications bool) ([]model.Block, error) {
	if len(blocks) == 0 {
		return []model.Block{}, nil
	}

	// all blocks must belong to the same board
	boardID := blocks[0].BoardID
	for _, block := range blocks {
		if block.BoardID != boardID {
			return nil, ErrBlocksFromMultipleBoards
		}
	}

	board, err := a.store.GetBoard(boardID)
	if err != nil {
		return nil, err
	}

	needsNotify := make([]model.Block, 0, len(blocks))
	for i := range blocks {
		err := a.store.InsertBlock(&blocks[i], modifiedByID)
		if err != nil {
			return nil, err
		}
		needsNotify = append(needsNotify, blocks[i])

		a.wsAdapter.BroadcastBlockChange(board.TeamID, blocks[i])
		a.metrics.IncrementBlocksInserted(1)
	}

	a.blockChangeNotifier.Enqueue(func() error {
		for _, b := range needsNotify {
			block := b
			a.webhook.NotifyUpdate(block)
			if allowNotifications {
				a.notifyBlockChanged(notify.Add, &block, nil, modifiedByID)
			}
		}
		return nil
	})

	return blocks, nil
}

func (a *App) CopyCardFiles(sourceBoardID string, copiedBlocks []model.Block) error {
	// Images attached in cards have a path comprising the card's board ID.
	// When we create a template from this board, we need to copy the files
	// with the new board ID in path.
	// Not doing so causing images in templates (and boards created from this
	// template) to fail to load.

	// look up ID of source sourceBoard, which may be different than the blocks.
	sourceBoard, err := a.GetBoard(sourceBoardID)
	if err != nil || sourceBoard == nil {
		return fmt.Errorf("cannot fetch source board %s for CopyCardFiles: %w", sourceBoardID, err)
	}

	var destTeamID string
	var destBoardID string

	for i := range copiedBlocks {
		block := copiedBlocks[i]

		fileName, ok := block.Fields["fileId"]
		if !ok || fileName == "" {
			continue // doesn't have a file attachment
		}

		// create unique filename in case we are copying cards within the same board.
		ext := filepath.Ext(fileName.(string))
		destFilename := utils.NewID(utils.IDTypeNone) + ext

		if destBoardID == "" || block.BoardID != destBoardID {
			destBoardID = block.BoardID
			destBoard, err := a.GetBoard(destBoardID)
			if err != nil {
				return fmt.Errorf("cannot fetch destination board %s for CopyCardFiles: %w", sourceBoardID, err)
			}
			destTeamID = destBoard.TeamID
		}

		sourceFilePath := filepath.Join(sourceBoard.TeamID, sourceBoard.ID, fileName.(string))
		destinationFilePath := filepath.Join(destTeamID, block.BoardID, destFilename)

		a.logger.Debug(
			"Copying card file",
			mlog.String("sourceFilePath", sourceFilePath),
			mlog.String("destinationFilePath", destinationFilePath),
		)

		if err := a.filesBackend.CopyFile(sourceFilePath, destinationFilePath); err != nil {
			a.logger.Error(
				"CopyCardFiles failed to copy file",
				mlog.String("sourceFilePath", sourceFilePath),
				mlog.String("destinationFilePath", destinationFilePath),
				mlog.Err(err),
			)
		}
		block.Fields["fileId"] = destFilename
	}

	return nil
}

func (a *App) GetBlockByID(blockID string) (*model.Block, error) {
	return a.store.GetBlock(blockID)
}

func (a *App) DeleteBlock(blockID string, modifiedBy string) error {
	block, err := a.store.GetBlock(blockID)
	if err != nil {
		return err
	}

	board, err := a.store.GetBoard(block.BoardID)
	if err != nil {
		return err
	}

	if block == nil {
		// deleting non-existing block not considered an error
		return nil
	}

	err = a.store.DeleteBlock(blockID, modifiedBy)
	if err != nil {
		return err
	}

	if block.Type == model.TypeImage {
		fileName, fileIDExists := block.Fields["fileId"]
		if fileName, fileIDIsString := fileName.(string); fileIDExists && fileIDIsString {
			filePath := filepath.Join(block.BoardID, fileName)
			err = a.filesBackend.RemoveFile(filePath)

			if err != nil {
				a.logger.Error("Error deleting image file",
					mlog.String("FilePath", filePath),
					mlog.Err(err))
			}
		}
	}

	a.blockChangeNotifier.Enqueue(func() error {
		a.wsAdapter.BroadcastBlockDelete(board.TeamID, blockID, block.BoardID)
		a.metrics.IncrementBlocksDeleted(1)
		a.notifyBlockChanged(notify.Delete, block, block, modifiedBy)
		return nil
	})
	return nil
}

func (a *App) GetLastBlockHistoryEntry(blockID string) (*model.Block, error) {
	blocks, err := a.store.GetBlockHistory(blockID, model.QueryBlockHistoryOptions{Limit: 1, Descending: true})
	if err != nil {
		return nil, err
	}
	if len(blocks) == 0 {
		return nil, nil
	}
	return &blocks[0], nil
}

func (a *App) UndeleteBlock(blockID string, modifiedBy string) (*model.Block, error) {
	blocks, err := a.store.GetBlockHistory(blockID, model.QueryBlockHistoryOptions{Limit: 1, Descending: true})
	if err != nil {
		return nil, err
	}

	if len(blocks) == 0 {
		// undeleting non-existing block not considered an error
		return nil, nil
	}

	err = a.store.UndeleteBlock(blockID, modifiedBy)
	if err != nil {
		return nil, err
	}

	block, err := a.store.GetBlock(blockID)
	if err != nil {
		return nil, err
	}

	if block == nil {
		a.logger.Error("Error loading the block after undelete, not propagating through websockets or notifications")
		return nil, nil
	}

	board, err := a.store.GetBoard(block.BoardID)
	if err != nil {
		return nil, err
	}

	a.blockChangeNotifier.Enqueue(func() error {
		a.wsAdapter.BroadcastBlockChange(board.TeamID, *block)
		a.metrics.IncrementBlocksInserted(1)
		a.webhook.NotifyUpdate(*block)
		a.notifyBlockChanged(notify.Add, block, nil, modifiedBy)
		return nil
	})

	return block, nil
}

func (a *App) GetBlockCountsByType() (map[string]int64, error) {
	return a.store.GetBlockCountsByType()
}

func (a *App) GetBlocksForBoard(boardID string) ([]model.Block, error) {
	return a.store.GetBlocksForBoard(boardID)
}

func (a *App) notifyBlockChanged(action notify.Action, block *model.Block, oldBlock *model.Block, modifiedByID string) {
	// don't notify if notifications service disabled, or block change is generated via system user.
	if a.notifications == nil || modifiedByID == model.SystemUserID {
		return
	}

	// find card and board for the changed block.
	board, card, err := a.getBoardAndCard(block)
	if err != nil {
		a.logger.Error("Error notifying for block change; cannot determine board or card", mlog.Err(err))
		return
	}

	boardMember, _ := a.GetMemberForBoard(board.ID, modifiedByID)
	if boardMember == nil {
		// create temporary guest board member
		boardMember = &model.BoardMember{
			BoardID: board.ID,
			UserID:  modifiedByID,
		}
	}

	evt := notify.BlockChangeEvent{
		Action:       action,
		TeamID:       board.TeamID,
		Board:        board,
		Card:         card,
		BlockChanged: block,
		BlockOld:     oldBlock,
		ModifiedBy:   boardMember,
	}
	a.notifications.BlockChanged(evt)
}

const (
	maxSearchDepth = 50
)

// getBoardAndCard returns the first parent of type `card` its board for the specified block.
// `board` and/or `card` may return nil without error if the block does not belong to a board or card.
func (a *App) getBoardAndCard(block *model.Block) (board *model.Board, card *model.Block, err error) {
	board, err = a.store.GetBoard(block.BoardID)
	if err != nil {
		return board, card, err
	}

	var count int // don't let invalid blocks hierarchy cause infinite loop.
	iter := block
	for {
		count++
		if card == nil && iter.Type == model.TypeCard {
			card = iter
		}

		if iter.ParentID == "" || (board != nil && card != nil) || count > maxSearchDepth {
			break
		}

		iter, err = a.store.GetBlock(iter.ParentID)
		if err != nil || iter == nil {
			return board, card, err
		}
	}
	return board, card, nil
}
