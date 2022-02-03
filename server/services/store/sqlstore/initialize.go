package sqlstore

import (
	"bytes"
	"errors"
	"fmt"
	"strings"

	sq "github.com/Masterminds/squirrel"
	// "github.com/mattermost/focalboard/server/model"
	// "github.com/mattermost/focalboard/server/services/store"
	// "github.com/mattermost/focalboard/server/services/store/sqlstore/initializations"

	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/services/store/sqlstore/initializations"
	"github.com/mattermost/mattermost-server/v6/shared/mlog"
)

const (
	defaultTemplateVersion = 2
)

var (
	ErrUnsupportedDatabaseType = errors.New("database type is unsupported")
)

// InitializeTemplates imports default templates if the blocks table is empty.
func (s *SQLStore) InitializeTemplates() error {
	boards, err := s.getDefaultTemplateBoards()
	if err != nil {
		return fmt.Errorf("cannot initialize templates: %w", err)
	}

	isNeeded, reason := s.isInitializationNeeded(boards)
	if !isNeeded {
		s.logger.Debug("Template import not needed, skipping")
		return nil
	}

	s.logger.Debug("Importing new default templates", mlog.String("reason", reason))

	if err := s.removeDefaultTemplates(boards); err != nil {
		return fmt.Errorf("cannot remove old templates: %w", err)
	}

	blocksJSONL := initializations.MustAsset("templates.json")

	return s.ImportArchive("0", bytes.NewReader(blocksJSONL), "system", fixTemplateBlock)
}

// removeDefaultTemplates deletes all the default templates and their children.
func (s *SQLStore) removeDefaultTemplates(boards []*model.Board) error {
	count := 0
	for _, board := range boards {
		// default template deletion does not need to go to blocks_history
		deleteQuery := s.getQueryBuilder(s.db).
			Delete(s.tablePrefix + "blocks").
			Where(sq.Eq{"board_id": board.ID})

		if _, err := deleteQuery.Exec(); err != nil {
			return fmt.Errorf("cannot delete default template %s: %w", board.ID, err)
		}

		deleteQuery = s.getQueryBuilder(s.db).
			Delete(s.tablePrefix + "boards").
			Where(sq.Eq{"id": board.ID})

		if _, err := deleteQuery.Exec(); err != nil {
			return fmt.Errorf("cannot delete default template %s: %w", board.ID, err)
		}

		s.logger.Trace("removed default template block",
			mlog.String("board_id", board.ID),
		)
		count++
	}

	s.logger.Debug("Removed default templates", mlog.Int("count", count))

	return nil
}

// getDefaultTemplateBoards fetches all template blocks .
func (s *SQLStore) getDefaultTemplateBoards() ([]*model.Board, error) {
	query := s.getQueryBuilder(s.db).
		Select(boardFields("")...).
		From(s.tablePrefix + "boards").
		Where(sq.Eq{"coalesce(team_id, '0')": "0"}).
		Where(sq.Eq{"created_by": "system"}).
		Where(sq.Eq{"is_template": true})

	rows, err := query.Query()
	if err != nil {
		s.logger.Error(`isInitializationNeeded ERROR`, mlog.Err(err))
		return nil, err
	}
	defer s.CloseRows(rows)

	return s.boardsFromRows(rows)
}

// isInitializationNeeded returns true if the blocks table contains no default templates,
// or contains at least one default template with an old version number.
func (s *SQLStore) isInitializationNeeded(boards []*model.Board) (bool, string) {
	if len(boards) == 0 {
		return true, "no default templates found"
	}

	// look for any template blocks with the wrong version number (or no version #).
	for _, board := range boards {
		if board.TemplateVersion < defaultTemplateVersion {
			return true, "templateVer too old"
		}
	}
	return false, ""
}

// fixTemplateBlock fixes a block to be inserted as part of a template.
func fixTemplateBlock(block *model.Block, cache map[string]interface{}) bool {
	// cache contains ids of skipped blocks. Ensure their children are skipped as well.
	if _, ok := cache[block.ParentID]; ok {
		cache[block.ID] = struct{}{}
		return false
	}

	// filter out template blocks; we only want the non-template
	// blocks which we will turn into default template blocks.
	if b, ok := block.Fields["isTemplate"]; ok {
		if val, ok := b.(bool); ok && val {
			cache[block.ID] = struct{}{}
			return false
		}
	}

	// remove '(NEW)' from title & force template flag
	if block.Type == "board" {
		block.Title = strings.ReplaceAll(block.Title, "(NEW)", "")
		block.Fields["isTemplate"] = true
		block.Fields["templateVer"] = defaultTemplateVersion
	}
	return true
}
