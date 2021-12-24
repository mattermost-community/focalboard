package model

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"

	"github.com/mattermost/focalboard/server/utils"
)

var NoBoardsInBoardsAndBlocksErr = errors.New("at least one board is required")
var NoBlocksInBoardsAndBlocksErr = errors.New("at least one block is required")

type BlockDoesntBelongToAnyBoardErr struct {
	blockID string
}

func (e BlockDoesntBelongToAnyBoardErr) Error() string {
	return fmt.Sprintf("block %s doesn't belong to any board", e.blockID)
}

// BoardsAndBlocks is used to operate over boards and blocks at the
// same time
// swagger:model
type BoardsAndBlocks struct {
	// The boards
	// required: false
	Boards []*Board

	// The blocks
	// required: false
	Blocks []Block
}

func (bab *BoardsAndBlocks) IsValid() error {
	if len(bab.Boards) == 0 {
		return NoBoardsInBoardsAndBlocksErr
	}

	if len(bab.Blocks) == 0 {
		return NoBlocksInBoardsAndBlocksErr
	}

	boardsMap := map[string]bool{}
	for _, board := range bab.Boards {
		boardsMap[board.ID] = true
	}

	for _, block := range bab.Blocks {
		if _, ok := boardsMap[block.BoardID]; !ok {
			return BlockDoesntBelongToAnyBoardErr{block.ID}
		}
	}
	return nil
}

func GenerateBoardsAndBlocksIDs(bab *BoardsAndBlocks) (*BoardsAndBlocks, error) {
	if err := bab.IsValid(); err != nil {
		return nil, err
	}

	blocksByBoard := map[string][]Block{}
	for _, block := range bab.Blocks {
		blocksByBoard[block.BoardID] = append(blocksByBoard[block.BoardID], block)
	}

	boards := []*Board{}
	blocks := []Block{}
	for _, board := range bab.Boards {
		newID := utils.NewID(utils.IDTypeBoard)
		for _, block := range blocksByBoard[board.ID] {
			block.BoardID = newID
			blocks = append(blocks, block)
		}

		board.ID = newID
		boards = append(boards, board)
	}

	newBab := &BoardsAndBlocks{
		Boards: boards,
		Blocks: GenerateBlockIDs(blocks),
	}

	return newBab, nil
}

func BoardsAndBlocksFromJSON(data io.Reader) *BoardsAndBlocks {
	var bab *BoardsAndBlocks
	_ = json.NewDecoder(data).Decode(&bab)
	return bab
}
