package sqlstore

import (
	"database/sql"
	"fmt"
	"strings"

	sq "github.com/Masterminds/squirrel"
	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/services/store"

	"github.com/mattermost/mattermost-server/v6/shared/mlog"
)

// ErrEmptyBoardID is an error type that can be returned by store APIs
// when a boardID is required, but empty.
var ErrEmptyBoardID = &ErrEmptyBoardIDError{}

type ErrEmptyBoardIDError struct{}

func (re *ErrEmptyBoardIDError) Error() string {
	return "boardID is empty"
}

func (s *SQLStore) getBoardID(db sq.BaseRunner, c store.Container) (string, error) {
	if c.BoardID != "" {
		return c.BoardID, nil
	}

	if c.WorkspaceID == "" {
		return "", ErrEmptyBoardID
	}

	query := s.getQueryBuilder(db).
		Select("id").
		From(s.tablePrefix + "boards").
		Where(sq.Eq{"workspace_id": c.WorkspaceID, "is_template": false})

	row := query.QueryRow()

	var boardID string
	err := row.Scan(&boardID)
	if err != nil {
		if err == sql.ErrNoRows {
			return "", ErrEmptyBoardID
		}
		return "", err
	}

	return boardID, nil
}

func (s *SQLStore) containerFromRows(rows *sql.Rows) (*model.BoardsAndBlocks, error) {
	// TODO: Consolidate this and `blocksFromRows` to use a shared type.

	boards := []model.Board{}
	blocks := []model.Block{}

	for rows.Next() {
		var blockType string
		var data string
		var boardData string

		err := rows.Scan(&blockType, &data, &boardData)
		if err != nil {
			s.logger.Error("containerFromRows row scan error", mlog.Err(err))
			return nil, err
		}

		if blockType == model.TypeBoard {
			var board model.Board
			err = json.Unmarshal([]byte(boardData), &board)
			if err != nil {
				s.logger.Error("board scan error", mlog.Err(err))
				return nil, err
			}
			boards = append(boards, board)
		} else {
			var block model.Block
			err = json.Unmarshal([]byte(data), &block)
			if err != nil {
				s.logger.Error("block scan error", mlog.Err(err))
				return nil, err
			}
			blocks = append(blocks, block)
		}
	}

	return &model.BoardsAndBlocks{Boards: boards, Blocks: blocks}, nil
}

// sq replaces SQL query placeholders with the appropriate syntax for the database driver
// Instead of using string formatting which is vulnerable to SQL injection,
// this function now properly handles placeholders based on the database type
func (s *SQLStore) sq(query string, args ...interface{}) (string, []interface{}) {
	if s.dbType == model.MysqlDBType {
		// MySQL uses ? as placeholders
		query = strings.ReplaceAll(query, "{prefix}", s.tablePrefix)
		// Replace PostgreSQL-style placeholders ($1, $2, etc.) with ?
		for i := len(args); i > 0; i-- {
			query = strings.ReplaceAll(query, fmt.Sprintf("$%d", i), "?")
		}
		return query, args
	}
	
	// PostgreSQL uses $1, $2, etc. as placeholders
	query = strings.ReplaceAll(query, "{prefix}", s.tablePrefix)
	return query, args
}
