package sqlstore

import (
	"context"
	"fmt"
	"strconv"

	sq "github.com/Masterminds/squirrel"

	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/utils"

	"github.com/mattermost/mattermost-server/v6/shared/mlog"
)

const (
	TemplatesToTeamsMigrationKey = "TemplatesToTeamsMigrationComplete"
	UniqueIDsMigrationKey        = "UniqueIDsMigrationComplete"
	CategoryUUIDIDMigrationKey   = "CategoryUuidIdMigrationComplete"
	TeamLessBoardsMigrationKey   = "TeamLessBoardsMigrationComplete"
)

func (s *SQLStore) getBlocksWithSameID(db sq.BaseRunner) ([]model.Block, error) {
	subquery, _, _ := s.getQueryBuilder(db).
		Select("id").
		From(s.tablePrefix + "blocks").
		Having("count(id) > 1").
		GroupBy("id").
		ToSql()

	blocksFields := []string{
		"id",
		"parent_id",
		"root_id",
		"created_by",
		"modified_by",
		s.escapeField("schema"),
		"type",
		"title",
		"COALESCE(fields, '{}')",
		s.timestampToCharField("insert_at", "insertAt"),
		"create_at",
		"update_at",
		"delete_at",
		"COALESCE(workspace_id, '0')",
	}

	rows, err := s.getQueryBuilder(db).
		Select(blocksFields...).
		From(s.tablePrefix + "blocks").
		Where(fmt.Sprintf("id IN (%s)", subquery)).
		Query()
	if err != nil {
		s.logger.Error(`getBlocksWithSameID ERROR`, mlog.Err(err))
		return nil, err
	}
	defer s.CloseRows(rows)

	return s.blocksFromRows(rows)
}

func (s *SQLStore) runUniqueIDsMigration() error {
	setting, err := s.GetSystemSetting(UniqueIDsMigrationKey)
	if err != nil {
		return fmt.Errorf("cannot get migration state: %w", err)
	}

	// If the migration is already completed, do not run it again.
	if hasAlreadyRun, _ := strconv.ParseBool(setting); hasAlreadyRun {
		return nil
	}

	s.logger.Debug("Running Unique IDs migration")

	tx, txErr := s.db.BeginTx(context.Background(), nil)
	if txErr != nil {
		return txErr
	}

	blocks, err := s.getBlocksWithSameID(tx)
	if err != nil {
		if rollbackErr := tx.Rollback(); rollbackErr != nil {
			s.logger.Error("Unique IDs transaction rollback error", mlog.Err(rollbackErr), mlog.String("methodName", "getBlocksWithSameID"))
		}
		return fmt.Errorf("cannot get blocks with same ID: %w", err)
	}

	blocksByID := map[string][]model.Block{}
	for _, block := range blocks {
		blocksByID[block.ID] = append(blocksByID[block.ID], block)
	}

	for _, blocks := range blocksByID {
		for i, block := range blocks {
			if i == 0 {
				// do nothing for the first ID, only updating the others
				continue
			}

			newID := utils.NewID(model.BlockType2IDType(block.Type))
			if err := s.replaceBlockID(tx, block.ID, newID, block.WorkspaceID); err != nil {
				if rollbackErr := tx.Rollback(); rollbackErr != nil {
					s.logger.Error("Unique IDs transaction rollback error", mlog.Err(rollbackErr), mlog.String("methodName", "replaceBlockID"))
				}
				return fmt.Errorf("cannot replace blockID %s: %w", block.ID, err)
			}
		}
	}

	if err := s.setSystemSetting(tx, UniqueIDsMigrationKey, strconv.FormatBool(true)); err != nil {
		if rollbackErr := tx.Rollback(); rollbackErr != nil {
			s.logger.Error("Unique IDs transaction rollback error", mlog.Err(rollbackErr), mlog.String("methodName", "setSystemSetting"))
		}
		return fmt.Errorf("cannot mark migration as completed: %w", err)
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("cannot commit unique IDs transaction: %w", err)
	}

	s.logger.Debug("Unique IDs migration finished successfully")
	return nil
}

func (s *SQLStore) runCategoryUUIDIDMigration() error {
	setting, err := s.GetSystemSetting(CategoryUUIDIDMigrationKey)
	if err != nil {
		return fmt.Errorf("cannot get migration state: %w", err)
	}

	// If the migration is already completed, do not run it again.
	if hasAlreadyRun, _ := strconv.ParseBool(setting); hasAlreadyRun {
		return nil
	}

	s.logger.Debug("Running category UUID ID migration")

	tx, txErr := s.db.BeginTx(context.Background(), nil)
	if txErr != nil {
		return txErr
	}

	if err := s.updateCategoryIDs(tx); err != nil {
		return err
	}

	if err := s.updateCategoryBlocksIDs(tx); err != nil {
		return err
	}

	if err := s.setSystemSetting(tx, CategoryUUIDIDMigrationKey, strconv.FormatBool(true)); err != nil {
		if rollbackErr := tx.Rollback(); rollbackErr != nil {
			s.logger.Error("category IDs transaction rollback error", mlog.Err(rollbackErr), mlog.String("methodName", "setSystemSetting"))
		}
		return fmt.Errorf("cannot mark migration as completed: %w", err)
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("cannot commit category IDs transaction: %w", err)
	}

	s.logger.Debug("category IDs migration finished successfully")
	return nil
}

func (s *SQLStore) updateCategoryIDs(db sq.BaseRunner) error {
	// fetch all category IDs
	oldCategoryIDs, err := s.getIDs(db, "categories")
	if err != nil {
		return err
	}

	// map old category ID to new ID
	categoryIDs := map[string]string{}
	for _, oldID := range oldCategoryIDs {
		newID := utils.NewID(utils.IDTypeNone)
		categoryIDs[oldID] = newID
	}

	// update for each category ID.
	// Update the new ID in category table,
	// and update corresponding rows in category boards table.
	for oldID, newID := range categoryIDs {
		if err := s.updateCategoryID(db, oldID, newID); err != nil {
			return err
		}
	}

	return nil
}

func (s *SQLStore) getIDs(db sq.BaseRunner, table string) ([]string, error) {
	rows, err := s.getQueryBuilder(db).
		Select("id").
		From(s.tablePrefix + table).
		Query()

	if err != nil {
		s.logger.Error("getIDs error", mlog.String("table", table), mlog.Err(err))
		return nil, err
	}

	defer s.CloseRows(rows)
	var categoryIDs []string
	for rows.Next() {
		var id string
		err := rows.Scan(&id)
		if err != nil {
			s.logger.Error("getIDs scan row error", mlog.String("table", table), mlog.Err(err))
			return nil, err
		}

		categoryIDs = append(categoryIDs, id)
	}

	return categoryIDs, nil
}

func (s *SQLStore) updateCategoryID(db sq.BaseRunner, oldID, newID string) error {
	// update in category table
	rows, err := s.getQueryBuilder(db).
		Update(s.tablePrefix+"categories").
		Set("id", newID).
		Where(sq.Eq{"id": oldID}).
		Query()

	if err != nil {
		s.logger.Error("updateCategoryID update category error", mlog.Err(err))
		return err
	}

	if err = rows.Close(); err != nil {
		s.logger.Error("updateCategoryID error closing rows after updating categories table IDs", mlog.Err(err))
		return err
	}

	// update category boards table

	rows, err = s.getQueryBuilder(db).
		Update(s.tablePrefix+"category_boards").
		Set("category_id", newID).
		Where(sq.Eq{"category_id": oldID}).
		Query()

	if err != nil {
		s.logger.Error("updateCategoryID update category boards error", mlog.Err(err))
		return err
	}

	if err := rows.Close(); err != nil {
		s.logger.Error("updateCategoryID error closing rows after updating category boards table IDs", mlog.Err(err))
		return err
	}

	return nil
}

func (s *SQLStore) updateCategoryBlocksIDs(db sq.BaseRunner) error {
	// fetch all category IDs
	oldCategoryIDs, err := s.getIDs(db, "category_boards")
	if err != nil {
		return err
	}

	// map old category ID to new ID
	categoryIDs := map[string]string{}
	for _, oldID := range oldCategoryIDs {
		newID := utils.NewID(utils.IDTypeNone)
		categoryIDs[oldID] = newID
	}

	// update for each category ID.
	// Update the new ID in category table,
	// and update corresponding rows in category boards table.
	for oldID, newID := range categoryIDs {
		if err := s.updateCategoryBlocksID(db, oldID, newID); err != nil {
			return err
		}
	}
	return nil
}

func (s *SQLStore) updateCategoryBlocksID(db sq.BaseRunner, oldID, newID string) error {
	// update in category table
	rows, err := s.getQueryBuilder(db).
		Update(s.tablePrefix+"category_boards").
		Set("id", newID).
		Where(sq.Eq{"id": oldID}).
		Query()

	if err != nil {
		s.logger.Error("updateCategoryBlocksID update category error", mlog.Err(err))
		return err
	}
	rows.Close()

	return nil
}

// We no longer support boards existing in DMs and private
// group messages. This function migrates all boards
// belonging to a DM to the best possible team.
func (s *SQLStore) migrateTeamLessBoards() error {
	if !s.isPlugin {
		return nil
	}

	setting, err := s.GetSystemSetting(TeamLessBoardsMigrationKey)
	if err != nil {
		return fmt.Errorf("cannot get teamless boards migration state: %w", err)
	}

	// If the migration is already completed, do not run it again.
	if hasAlreadyRun, _ := strconv.ParseBool(setting); hasAlreadyRun {
		return nil
	}

	boards, err := s.getDMBoards(s.db)
	if err != nil {
		return err
	}

	s.logger.Info("Migrating teamless boards to a team", mlog.Int("count", len(boards)))

	// cache for best suitable team for a DM. Since a DM can
	// contain multiple boards, caching this avoids
	// duplicate queries for the same DM.
	channelToTeamCache := map[string]string{}

	tx, err := s.db.BeginTx(context.Background(), nil)
	if err != nil {
		s.logger.Error("error starting transaction in migrateTeamLessBoards", mlog.Err(err))
		return err
	}

	for i := range boards {
		// check the cache first
		teamID, ok := channelToTeamCache[boards[i].ChannelID]

		// query DB if entry not found in cache
		if !ok {
			teamID, err = s.getBestTeamForBoard(s.db, boards[i])
			if err != nil {
				// don't let one board's error spoil
				// the mood for others
				continue
			}
		}

		channelToTeamCache[boards[i].ChannelID] = teamID
		boards[i].TeamID = teamID

		query := s.getQueryBuilder(tx).
			Update(s.tablePrefix+"boards").
			Set("team_id", teamID).
			Set("type", model.BoardTypePrivate).
			Where(sq.Eq{"id": boards[i].ID})

		if _, err := query.Exec(); err != nil {
			s.logger.Error("failed to set team id for board", mlog.String("board_id", boards[i].ID), mlog.String("team_id", teamID), mlog.Err(err))
			return err
		}
	}

	if err := s.setSystemSetting(tx, TeamLessBoardsMigrationKey, strconv.FormatBool(true)); err != nil {
		if rollbackErr := tx.Rollback(); rollbackErr != nil {
			s.logger.Error("transaction rollback error", mlog.Err(rollbackErr), mlog.String("methodName", "migrateTeamLessBoards"))
		}
		return fmt.Errorf("cannot mark migration as completed: %w", err)
	}

	if err := tx.Commit(); err != nil {
		s.logger.Error("failed to commit migrateTeamLessBoards transaction", mlog.Err(err))
		return err
	}

	return nil
}

func (s *SQLStore) getDMBoards(tx sq.BaseRunner) ([]*model.Board, error) {
	conditions := sq.And{
		sq.Eq{"team_id": ""},
		sq.Or{
			sq.Eq{"type": "D"},
			sq.Eq{"type": "G"},
		},
	}

	boards, err := s.getLegacyBoardsByCondition(tx, conditions)
	if err != nil && model.IsErrNotFound(err) {
		return []*model.Board{}, nil
	}

	return boards, err
}

// The destination is selected as the first team where all members
// of the DM are a part of. If no such team exists,
// we use the first team to which DM creator belongs to.
func (s *SQLStore) getBestTeamForBoard(tx sq.BaseRunner, board *model.Board) (string, error) {
	userTeams, err := s.getBoardUserTeams(tx, board)
	if err != nil {
		return "", err
	}

	teams := [][]interface{}{}
	for _, userTeam := range userTeams {
		userTeamInterfaces := make([]interface{}, len(userTeam))
		for i := range userTeam {
			userTeamInterfaces[i] = userTeam[i]
		}
		teams = append(teams, userTeamInterfaces)
	}

	commonTeams := utils.Intersection(teams...)
	var teamID string
	if len(commonTeams) > 0 {
		teamID = commonTeams[0].(string)
	} else {
		// no common teams found. Let's try finding the best suitable team
		if board.Type == "D" {
			// get DM's creator and pick one of their team
			channel, appErr := (*s.pluginAPI).GetChannel(board.ChannelID)
			if appErr != nil {
				s.logger.Error("failed to fetch DM channel for board", mlog.String("board_id", board.ID), mlog.String("channel_id", board.ChannelID), mlog.Err(appErr))
				return "", appErr
			}

			if _, ok := userTeams[channel.CreatorId]; !ok {
				err := fmt.Errorf("%w board_id: %s, channel_id: %s, creator_id: %s", errChannelCreatorNotInTeam, board.ID, board.ChannelID, channel.CreatorId)
				s.logger.Error(err.Error())
				return "", err
			}

			teamID = userTeams[channel.CreatorId][0]
		} else if board.Type == "G" {
			// pick the team that has the most users as members
			teamFrequency := map[string]int{}
			highestFrequencyTeam := ""
			highestFrequencyTeamFrequency := -1

			for _, teams := range userTeams {
				for _, teamID := range teams {
					teamFrequency[teamID]++

					if teamFrequency[teamID] > highestFrequencyTeamFrequency {
						highestFrequencyTeamFrequency = teamFrequency[teamID]
						highestFrequencyTeam = teamID
					}
				}
			}

			teamID = highestFrequencyTeam
		}
	}

	return teamID, nil
}

func (s *SQLStore) getBoardUserTeams(tx sq.BaseRunner, board *model.Board) (map[string][]string, error) {
	query := s.getQueryBuilder(tx).
		Select("TeamMembers.UserId", "TeamMembers.TeamId").
		From("ChannelMembers").
		Join("TeamMembers ON ChannelMembers.UserId = TeamMembers.UserId").
		Where(sq.Eq{"ChannelId": board.ChannelID})

	rows, err := query.Query()
	if err != nil {
		s.logger.Error("failed to fetch user teams for board", mlog.String("boardID", board.ID), mlog.String("channelID", board.ChannelID), mlog.Err(err))
		return nil, err
	}

	defer rows.Close()

	userTeams := map[string][]string{}

	for rows.Next() {
		var userID, teamID string
		err := rows.Scan(&userID, &teamID)
		if err != nil {
			s.logger.Error("getBoardUserTeams failed to scan SQL query result", mlog.String("boardID", board.ID), mlog.String("channelID", board.ChannelID), mlog.Err(err))
			return nil, err
		}

		userTeams[userID] = append(userTeams[userID], teamID)
	}

	return userTeams, nil
}
