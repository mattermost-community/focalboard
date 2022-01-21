package sqlstore

import (
	"bytes"
	"strings"

	sq "github.com/Masterminds/squirrel"
	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/services/store"
	"github.com/mattermost/focalboard/server/services/store/sqlstore/initializations"

	"github.com/mattermost/mattermost-server/v6/shared/mlog"
)

// InitializeTemplates imports default templates if the blocks table is empty.
func (s *SQLStore) InitializeTemplates() error {
	isNeeded, err := s.isInitializationNeeded()
	if err != nil {
		return err
	}

	if isNeeded {
		return s.importInitialTemplates()
	}

	return nil
}

func (s *SQLStore) importInitialTemplates() error {
	s.logger.Debug("importInitialTemplates")
	blocksJSONL := initializations.MustAsset("templates.json")

	globalContainer := store.Container{
		WorkspaceID: "0",
	}

	return s.ImportArchive(globalContainer, bytes.NewReader(blocksJSONL), fixTemplateBlock)
}

// isInitializationNeeded returns true if the blocks table is empty.
func (s *SQLStore) isInitializationNeeded() (bool, error) {
	query := s.getQueryBuilder(s.db).
		Select("count(*)").
		From(s.tablePrefix + "blocks").
		Where(sq.Eq{"COALESCE(workspace_id, '0')": "0"})

	row := query.QueryRow()

	var count int
	err := row.Scan(&count)
	if err != nil {
		s.logger.Error("isInitializationNeeded", mlog.Err(err))
		return false, err
	}

	return (count == 0), nil
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
	}
	return true
}
