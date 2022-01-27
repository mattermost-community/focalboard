package sqlstore

import (
	// "encoding/json"

	"context"
	"encoding/json"

	sq "github.com/Masterminds/squirrel"

	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/services/store/sqlstore/initializations"
	"github.com/mattermost/focalboard/server/utils"
	"github.com/mattermost/mattermost-server/v6/shared/mlog"
)

// initializeTemplates imports default templates if the boards table is empty for a team.
func (s *SQLStore) initializeTemplates() error {
	tx, txErr := s.db.BeginTx(context.Background(), nil)
	if txErr != nil {
		return txErr
	}

	teamIds, err := s.getTeamsThatNeedInitialization(tx)
	if err != nil {
		if rollbackErr := tx.Rollback(); rollbackErr != nil {
			s.logger.Error("transaction rollback error", mlog.Err(rollbackErr), mlog.String("methodName", "DeleteBlock"))
		}
		return err
	}

	if len(teamIds) > 0 {
		err := s.importInitialTemplates(tx, teamIds)
		if err != nil {
			if rollbackErr := tx.Rollback(); rollbackErr != nil {
				s.logger.Error("transaction rollback error", mlog.Err(rollbackErr), mlog.String("methodName", "DeleteBlock"))
			}
			return err
		}
	}

	if err := tx.Commit(); err != nil {
		return err
	}

	return nil
}

func (s *SQLStore) importInitialTemplates(db sq.BaseRunner, teamIDs []string) error {
	s.logger.Debug("importInitialTemplates")
	blocksJSON := initializations.MustAsset("templates.json")

	var archive model.Archive
	err := json.Unmarshal(blocksJSON, &archive)
	if err != nil {
		return err
	}

	for _, teamID := range teamIDs {
		for _, board := range archive.Boards {
			boardBlocks := []model.Block{}
			newBoardID := utils.NewID(utils.IDTypeBoard)
			for _, block := range archive.Blocks {
				if block.ParentID == board.ID || block.RootID == board.ID {
					boardBlocks = append(boardBlocks, block)
				}
			}

			boardBlocks = model.GenerateBlockIDs(boardBlocks)
			updatedBoardBlocks := []model.Block{}

			for _, block := range boardBlocks {
				updatedBlock := block
				if updatedBlock.ParentID == board.ID {
					updatedBlock.ParentID = newBoardID
				}
				if updatedBlock.RootID == board.ID {
					updatedBlock.RootID = newBoardID
				}
				updatedBlock.BoardID = newBoardID
				updatedBoardBlocks = append(updatedBoardBlocks, updatedBlock)
			}
			board.TemplateID = board.ID
			board.ID = newBoardID
			board.Type = model.BoardTypeOpen
			board.TeamID = teamID
			board.IsTemplate = true

			for _, block := range updatedBoardBlocks {
				if err = s.insertBlock(db, &block, "system"); err != nil {
					return err
				}
			}
			if _, err = s.insertBoard(db, &board, "system"); err != nil {
				return err
			}
		}
	}

	return nil
}

// getTeamsThatNeedInitialization returns a list of teams without templates
func (s *SQLStore) getTeamsThatNeedInitialization(db sq.BaseRunner) ([]string, error) {
	query := s.getQueryBuilder(db).
		Select("T.Id").
		From("Teams AS T").
		LeftJoin(s.tablePrefix + "boards as B ON B.team_id = T.Id AND B.is_template = True").
		GroupBy("T.Id").
		Having(sq.Eq{"Sum(CASE B.is_template WHEN True THEN 1 ELSE 0 END)": 0})

	if !s.isPlugin {
		query = query.Prefix("WITH Teams(Id) AS (VALUES ('0'))")
	}

	rows, err := query.Query()
	if err != nil {
		return nil, err
	}

	teamIds := []string{}
	for rows.Next() {
		var teamId string
		err := rows.Scan(&teamId)
		if err != nil {
			return nil, err
		}
		teamIds = append(teamIds, teamId)
	}

	return teamIds, nil
}
