package sqlstore

import (
	"bytes"
	"errors"
	"fmt"
	"strings"

	sq "github.com/Masterminds/squirrel"
	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/services/store"
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
	blocks, err := s.getDefaultTemplateBlocks()
	if err != nil {
		return fmt.Errorf("cannot initialize templates: %w", err)
	}

	isNeeded, reason := s.isInitializationNeeded(blocks)
	if !isNeeded {
		s.logger.Debug("Template import not needed, skipping")
		return nil
	}

	s.logger.Debug("Importing new default templates", mlog.String("reason", reason))

	if err := s.removeDefaultTemplates(blocks); err != nil {
		return fmt.Errorf("cannot remove old templates: %w", err)
	}

	blocksJSONL := initializations.MustAsset("templates.json")
	globalContainer := store.Container{
		WorkspaceID: "0",
	}

	return s.ImportArchive(globalContainer, bytes.NewReader(blocksJSONL), "system", fixTemplateBlock)
}

// removeDefaultTemplates deletes all the default templates and their children.
func (s *SQLStore) removeDefaultTemplates(blocks []model.Block) error {
	count := 0
	for _, block := range blocks {
		// default template deletion does not need to go to blocks_history
		deleteQuery := s.getQueryBuilder(s.db).
			Delete(s.tablePrefix + "blocks").
			Where(sq.Or{
				sq.Eq{"id": block.ID},
				sq.Eq{"parent_id": block.ID},
				sq.Eq{"root_id": block.ID},
			})

		if _, err := deleteQuery.Exec(); err != nil {
			return fmt.Errorf("cannot delete default template %s: %w", block.ID, err)
		}

		s.logger.Trace("removed default template block",
			mlog.String("block_id", block.ID),
			mlog.String("block_type", string(block.Type)),
		)
		count++
	}

	s.logger.Debug("Removed default templates", mlog.Int("count", count))

	return nil
}

// getDefaultTemplateBlocks fetches all template blocks .
func (s *SQLStore) getDefaultTemplateBlocks() ([]model.Block, error) {
	query := s.getQueryBuilder(s.db).
		Select(s.blockFields()...).
		From(s.tablePrefix + "blocks").
		Where(sq.Eq{"coalesce(workspace_id, '0')": "0"}).
		Where(sq.Eq{"created_by": "system"})

	switch s.dbType {
	case sqliteDBType:
		query = query.Where(s.tablePrefix + "blocks.fields LIKE '%\"isTemplate\":true%'")
	case mysqlDBType:
		query = query.Where(s.tablePrefix + "blocks.fields LIKE '%\"isTemplate\":true%'")
	case postgresDBType:
		query = query.Where(s.tablePrefix + "blocks.fields ->> 'isTemplate' = 'true'")
	default:
		return nil, fmt.Errorf("cannot get default template blocks for database type %s: %w", s.dbType, ErrUnsupportedDatabaseType)
	}

	rows, err := query.Query()
	if err != nil {
		s.logger.Error(`isInitializationNeeded ERROR`, mlog.Err(err))
		return nil, err
	}
	defer s.CloseRows(rows)

	return s.blocksFromRows(rows)
}

// isInitializationNeeded returns true if the blocks table contains no default templates,
// or contains at least one default template with an old version number.
func (s *SQLStore) isInitializationNeeded(blocks []model.Block) (bool, string) {
	if len(blocks) == 0 {
		return true, "no default templates found"
	}

	// look for any template blocks with the wrong version number (or no version #).
	for _, block := range blocks {
		v, ok := block.Fields["templateVer"]
		if !ok {
			return true, "block missing templateVer"
		}
		version, ok := v.(float64)
		if !ok {
			return true, "templateVer NaN"
		}
		if version < defaultTemplateVersion {
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
