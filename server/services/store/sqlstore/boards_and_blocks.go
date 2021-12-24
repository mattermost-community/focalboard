package sqlstore

import (
	sq "github.com/Masterminds/squirrel"
	"github.com/mattermost/focalboard/server/model"
)

func (s *SQLStore) createBoardsAndBlocksWithAdmin(db sq.BaseRunner, bab *model.BoardsAndBlocks, userID string) (*model.BoardsAndBlocks, []*model.BoardMember, error) {
	newBab, err := s.createBoardsAndBlocks(db, bab, userID)
	if err != nil {
		return nil, nil, err
	}

	members := []*model.BoardMember{}
	for _, board := range newBab.Boards {
		bm := &model.BoardMember{
			BoardID:      board.ID,
			UserID:       board.CreatedBy,
			SchemeAdmin:  true,
			SchemeEditor: true,
		}

		nbm, err := s.saveMember(db, bm)
		if err != nil {
			return nil, nil, err
		}

		members = append(members, nbm)
	}

	return newBab, members, nil
}

func (s *SQLStore) createBoardsAndBlocks(db sq.BaseRunner, bab *model.BoardsAndBlocks, userID string) (*model.BoardsAndBlocks, error) {
	boards := []*model.Board{}
	blocks := []model.Block{}

	for _, board := range bab.Boards {
		newBoard, err := s.insertBoard(db, board, userID)
		if err != nil {
			return nil, err
		}

		boards = append(boards, newBoard)
	}

	for _, block := range bab.Blocks {
		err := s.insertBlock(db, &block, userID)
		if err != nil {
			return nil, err
		}

		blocks = append(blocks, block)
	}

	newBab := &model.BoardsAndBlocks{
		Boards: boards,
		Blocks: blocks,
	}

	return newBab, nil
}
