package sqlstore

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"strings"

	"github.com/mattermost/focalboard/server/utils"

	sq "github.com/Masterminds/squirrel"
	"github.com/mattermost/focalboard/server/model"

	"github.com/mattermost/mattermost-server/v6/shared/mlog"
)

type BoardNotFoundErr struct {
	boardID string
}

func (be BoardNotFoundErr) Error() string {
	return fmt.Sprintf("board not found (board id: %s", be.boardID)
}

func boardFields(prefix string) []string {
	fields := []string{
		"id",
		"team_id",
		"channel_id",
		"created_by",
		"modified_by",
		"type",
		"title",
		"description",
		"icon",
		"show_description",
		"is_template",
		"template_version",
		"COALESCE(properties, '{}')",
		"COALESCE(card_properties, '{}')",
		"COALESCE(column_calculations, '{}')",
		"create_at",
		"update_at",
		"delete_at",
	}

	if prefix == "" {
		return fields
	}

	prefixedFields := make([]string, len(fields))
	for i, field := range fields {
		if strings.HasPrefix(field, "COALESCE(") {
			prefixedFields[i] = strings.Replace(field, "COALESCE(", "COALESCE("+prefix, 1)
		} else {
			prefixedFields[i] = prefix + field
		}
	}
	return prefixedFields
}

var boardMemberFields = []string{
	"board_id",
	"user_id",
	"roles",
	"scheme_admin",
	"scheme_editor",
	"scheme_commenter",
	"scheme_viewer",
}

func (s *SQLStore) boardsFromRows(rows *sql.Rows) ([]*model.Board, error) {
	boards := []*model.Board{}

	for rows.Next() {
		var board model.Board
		var propertiesBytes []byte
		var cardPropertiesBytes []byte
		var columnCalculationsBytes []byte

		err := rows.Scan(
			&board.ID,
			&board.TeamID,
			&board.ChannelID,
			&board.CreatedBy,
			&board.ModifiedBy,
			&board.Type,
			&board.Title,
			&board.Description,
			&board.Icon,
			&board.ShowDescription,
			&board.IsTemplate,
			&board.TemplateVersion,
			&propertiesBytes,
			&cardPropertiesBytes,
			&columnCalculationsBytes,
			&board.CreateAt,
			&board.UpdateAt,
			&board.DeleteAt,
		)
		if err != nil {
			s.logger.Error("boardsFromRows scan error", mlog.Err(err))
			return nil, err
		}

		err = json.Unmarshal(propertiesBytes, &board.Properties)
		if err != nil {
			s.logger.Error("board properties unmarshal error", mlog.Err(err))
			return nil, err
		}
		err = json.Unmarshal(cardPropertiesBytes, &board.CardProperties)
		if err != nil {
			s.logger.Error("board card properties unmarshal error", mlog.Err(err))
			return nil, err
		}
		err = json.Unmarshal(columnCalculationsBytes, &board.ColumnCalculations)
		if err != nil {
			s.logger.Error("board column calculation unmarshal error", mlog.Err(err))
			return nil, err
		}

		boards = append(boards, &board)
	}

	return boards, nil
}

func (s *SQLStore) boardMembersFromRows(rows *sql.Rows) ([]*model.BoardMember, error) {
	boardMembers := []*model.BoardMember{}

	for rows.Next() {
		var boardMember model.BoardMember

		err := rows.Scan(
			&boardMember.BoardID,
			&boardMember.UserID,
			&boardMember.Roles,
			&boardMember.SchemeAdmin,
			&boardMember.SchemeEditor,
			&boardMember.SchemeCommenter,
			&boardMember.SchemeViewer,
		)
		if err != nil {
			return nil, err
		}

		boardMembers = append(boardMembers, &boardMember)
	}

	return boardMembers, nil
}

func (s *SQLStore) getBoardByCondition(db sq.BaseRunner, conditions ...interface{}) (*model.Board, error) {
	boards, err := s.getBoardsByCondition(db, conditions...)
	if err != nil {
		return nil, err
	}

	return boards[0], nil
}

func (s *SQLStore) getBoardsByCondition(db sq.BaseRunner, conditions ...interface{}) ([]*model.Board, error) {
	query := s.getQueryBuilder(db).
		Select(boardFields("")...).
		From(s.tablePrefix + "boards")
	for _, c := range conditions {
		query = query.Where(c)
	}

	rows, err := query.Query()
	if err != nil {
		s.logger.Error(`getBoardsByCondition ERROR`, mlog.Err(err))
		return nil, err
	}
	defer s.CloseRows(rows)

	boards, err := s.boardsFromRows(rows)
	if err != nil {
		return nil, err
	}

	if len(boards) == 0 {
		return nil, sql.ErrNoRows
	}

	return boards, nil
}

func (s *SQLStore) getBoard(db sq.BaseRunner, boardID string) (*model.Board, error) {
	return s.getBoardByCondition(db, sq.Eq{"id": boardID})
}

func (s *SQLStore) getBoardsForUserAndTeam(db sq.BaseRunner, userID, teamID string) ([]*model.Board, error) {
	query := s.getQueryBuilder(db).
		Select(boardFields("b.")...).
		From(s.tablePrefix + "boards as b").
		Join(s.tablePrefix + "board_members as bm on b.id=bm.board_id").
		Where(sq.Eq{"b.team_id": teamID}).
		Where(sq.Eq{"bm.user_id": userID}).
		Where(sq.Eq{"b.is_template": false})

	rows, err := query.Query()
	if err != nil {
		s.logger.Error(`getBoardsForUserAndTeam ERROR`, mlog.Err(err))
		return nil, err
	}
	defer s.CloseRows(rows)

	return s.boardsFromRows(rows)
}

func (s *SQLStore) insertBoard(db sq.BaseRunner, board *model.Board, userID string) (*model.Board, error) {
	propertiesBytes, err := json.Marshal(board.Properties)
	if err != nil {
		return nil, err
	}
	cardPropertiesBytes, err := json.Marshal(board.CardProperties)
	if err != nil {
		return nil, err
	}
	columnCalculationsBytes, err := json.Marshal(board.ColumnCalculations)
	if err != nil {
		return nil, err
	}

	existingBoard, err := s.getBoard(db, board.ID)
	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		return nil, err
	}

	insertQuery := s.getQueryBuilder(db).Insert("").
		Columns(boardFields("")...)

	insertQueryValues := map[string]interface{}{
		"id":                  board.ID,
		"team_id":             board.TeamID,
		"channel_id":          board.ChannelID,
		"created_by":          board.CreatedBy,
		"modified_by":         userID,
		"type":                board.Type,
		"title":               board.Title,
		"description":         board.Description,
		"icon":                board.Icon,
		"show_description":    board.ShowDescription,
		"is_template":         board.IsTemplate,
		"template_version":    board.TemplateVersion,
		"properties":          propertiesBytes,
		"card_properties":     cardPropertiesBytes,
		"column_calculations": columnCalculationsBytes,
		"create_at":           board.CreateAt,
		"update_at":           board.UpdateAt,
		"delete_at":           board.DeleteAt,
	}

	now := utils.GetMillis()

	if existingBoard != nil {
		query := s.getQueryBuilder(db).Update(s.tablePrefix+"boards").
			Where(sq.Eq{"id": board.ID}).
			Set("modified_by", userID).
			Set("type", board.Type).
			Set("title", board.Title).
			Set("description", board.Description).
			Set("icon", board.Icon).
			Set("show_description", board.ShowDescription).
			Set("is_template", board.IsTemplate).
			Set("template_version", board.TemplateVersion).
			Set("properties", propertiesBytes).
			Set("card_properties", cardPropertiesBytes).
			Set("column_calculations", columnCalculationsBytes).
			Set("update_at", now).
			Set("delete_at", board.DeleteAt)

		if _, err := query.Exec(); err != nil {
			s.logger.Error(`InsertBoard error occurred while updating existing board`, mlog.String("boardID", board.ID), mlog.Err(err))
			return nil, err
		}
	} else {
		insertQueryValues["created_by"] = userID
		insertQueryValues["create_at"] = now
		insertQueryValues["update_at"] = now

		query := insertQuery.SetMap(insertQueryValues).Into(s.tablePrefix + "boards")
		if _, err := query.Exec(); err != nil {
			return nil, err
		}
	}

	// writing board history
	query := insertQuery.SetMap(insertQueryValues).Into(s.tablePrefix + "boards_history")
	if _, err := query.Exec(); err != nil {
		return nil, err
	}

	return s.getBoard(db, board.ID)
}

func (s *SQLStore) patchBoard(db sq.BaseRunner, boardID string, boardPatch *model.BoardPatch, userID string) (*model.Board, error) {
	existingBoard, err := s.getBoard(db, boardID)
	if err != nil {
		return nil, err
	}
	if existingBoard == nil {
		return nil, BoardNotFoundErr{boardID}
	}

	board := boardPatch.Patch(existingBoard)
	return s.insertBoard(db, board, userID)
}

func (s *SQLStore) deleteBoard(db sq.BaseRunner, boardID, userID string) error {
	now := utils.GetMillis()

	board, err := s.getBoard(db, boardID)
	if err != nil {
		fmt.Printf("error on get board: %s\n", err)
		return err
	}

	insertQuery := s.getQueryBuilder(db).Insert(s.tablePrefix+"boards_history").
		Columns(
			"team_id",
			"id",
			"type",
			"modified_by",
			"update_at",
			"delete_at",
		).
		Values(
			board.TeamID,
			boardID,
			board.Type,
			userID,
			now,
			now,
		)

	if _, err := insertQuery.Exec(); err != nil {
		return err
	}

	deleteQuery := s.getQueryBuilder(db).
		Delete(s.tablePrefix + "boards").
		Where(sq.Eq{"id": boardID}).
		Where(sq.Eq{"COALESCE(team_id, '0')": board.TeamID})

	if _, err := deleteQuery.Exec(); err != nil {
		return err
	}

	return nil
}

func (s *SQLStore) insertBoardWithAdmin(db sq.BaseRunner, board *model.Board, userID string) (*model.Board, *model.BoardMember, error) {
	newBoard, err := s.insertBoard(db, board, userID)
	if err != nil {
		return nil, nil, err
	}

	bm := &model.BoardMember{
		BoardID:      newBoard.ID,
		UserID:       newBoard.CreatedBy,
		SchemeAdmin:  true,
		SchemeEditor: true,
	}

	nbm, err := s.saveMember(db, bm)
	if err != nil {
		return nil, nil, err
	}

	return newBoard, nbm, nil
}

func (s *SQLStore) saveMember(db sq.BaseRunner, bm *model.BoardMember) (*model.BoardMember, error) {
	queryValues := map[string]interface{}{
		"board_id":         bm.BoardID,
		"user_id":          bm.UserID,
		"roles":            "",
		"scheme_admin":     bm.SchemeAdmin,
		"scheme_editor":    bm.SchemeEditor,
		"scheme_commenter": bm.SchemeCommenter,
		"scheme_viewer":    bm.SchemeViewer,
	}

	query := s.getQueryBuilder(db).
		Insert(s.tablePrefix + "board_members").
		SetMap(queryValues)

	if s.dbType == model.MysqlDBType {
		query = query.Suffix(
			"ON DUPLICATE KEY UPDATE scheme_admin = ?, scheme_editor = ?, scheme_commenter = ?, scheme_viewer = ?",
			bm.SchemeAdmin, bm.SchemeEditor, bm.SchemeCommenter, bm.SchemeViewer)
	} else {
		query = query.Suffix(
			`ON CONFLICT (board_id, user_id)
             DO UPDATE SET scheme_admin = EXCLUDED.scheme_admin, scheme_editor = EXCLUDED.scheme_editor, 
			   scheme_commenter = EXCLUDED.scheme_commenter, scheme_viewer = EXCLUDED.scheme_viewer`,
		)
	}

	if _, err := query.Exec(); err != nil {
		return nil, err
	}

	return bm, nil
}

func (s *SQLStore) deleteMember(db sq.BaseRunner, boardID, userID string) error {
	deleteQuery := s.getQueryBuilder(db).
		Delete(s.tablePrefix + "board_members").
		Where(sq.Eq{"board_id": boardID}).
		Where(sq.Eq{"user_id": userID})

	if _, err := deleteQuery.Exec(); err != nil {
		return err
	}

	return nil
}

func (s *SQLStore) getMemberForBoard(db sq.BaseRunner, boardID, userID string) (*model.BoardMember, error) {
	query := s.getQueryBuilder(db).
		Select(boardMemberFields...).
		From(s.tablePrefix + "board_members").
		Where(sq.Eq{"board_id": boardID}).
		Where(sq.Eq{"user_id": userID})

	rows, err := query.Query()
	if err != nil {
		s.logger.Error(`getMemberForBoard ERROR`, mlog.Err(err))
		return nil, err
	}
	defer s.CloseRows(rows)

	members, err := s.boardMembersFromRows(rows)
	if err != nil {
		return nil, err
	}

	if len(members) == 0 {
		return nil, sql.ErrNoRows
	}

	return members[0], nil
}

func (s *SQLStore) getMembersForUser(db sq.BaseRunner, userID string) ([]*model.BoardMember, error) {
	query := s.getQueryBuilder(db).
		Select(boardMemberFields...).
		From(s.tablePrefix + "board_members").
		Where(sq.Eq{"user_id": userID})

	rows, err := query.Query()
	if err != nil {
		s.logger.Error(`getMembersForUser ERROR`, mlog.Err(err))
		return nil, err
	}
	defer s.CloseRows(rows)

	members, err := s.boardMembersFromRows(rows)
	if err != nil {
		return nil, err
	}

	return members, nil
}

func (s *SQLStore) getMembersForBoard(db sq.BaseRunner, boardID string) ([]*model.BoardMember, error) {
	query := s.getQueryBuilder(db).
		Select(boardMemberFields...).
		From(s.tablePrefix + "board_members").
		Where(sq.Eq{"board_id": boardID})

	rows, err := query.Query()
	if err != nil {
		s.logger.Error(`getMembersForBoard ERROR`, mlog.Err(err))
		return nil, err
	}
	defer s.CloseRows(rows)

	return s.boardMembersFromRows(rows)
}

// searchBoardsForUserAndTeam returns all boards that match with the
// term that are either private and which the user is a member of, or
// they're open, regardless of the user membership.
// Search is case-insensitive.
func (s *SQLStore) searchBoardsForUserAndTeam(db sq.BaseRunner, term, userID, teamID string) ([]*model.Board, error) {
	query := s.getQueryBuilder(db).
		Select(boardFields("b.")...).
		Distinct().
		From(s.tablePrefix + "boards as b").
		LeftJoin(s.tablePrefix + "board_members as bm on b.id=bm.board_id").
		Where(sq.Eq{"b.team_id": teamID}).
		Where(sq.Eq{"b.is_template": false}).
		Where(sq.Or{
			sq.Eq{"b.type": model.BoardTypeOpen},
			sq.And{
				sq.Eq{"b.type": model.BoardTypePrivate},
				sq.Eq{"bm.user_id": userID},
			},
		})

	if term != "" {
		// break search query into space separated words
		// and search for each word.
		// This should later be upgraded to industrial-strength
		// word tokenizer, that uses much more than space
		// to break words.

		conditions := sq.Or{}

		for _, word := range strings.Split(strings.TrimSpace(term), " ") {
			conditions = append(conditions, sq.Like{"lower(b.title)": "%" + strings.ToLower(word) + "%"})
		}

		query = query.Where(conditions)
	}

	rows, err := query.Query()
	if err != nil {
		s.logger.Error(`searchBoardsForUserAndTeam ERROR`, mlog.Err(err))
		return nil, err
	}
	defer s.CloseRows(rows)

	return s.boardsFromRows(rows)
}
