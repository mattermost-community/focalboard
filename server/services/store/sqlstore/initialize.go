package sqlstore

import (
	"encoding/json"

	sq "github.com/Masterminds/squirrel"
	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/services/mlog"
	"github.com/mattermost/focalboard/server/services/store"
	"github.com/mattermost/focalboard/server/services/store/sqlstore/initializations"
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
	blocksJSON := initializations.MustAsset("templates.json")

	var archive model.Archive
	err := json.Unmarshal(blocksJSON, &archive)
	if err != nil {
		return err
	}

	globalContainer := store.Container{
		WorkspaceID: "0",
	}

	s.logger.Debug("Inserting blocks", mlog.Int("block_count", len(archive.Blocks)))
	for _, block := range archive.Blocks {
		s.logger.Trace("insert block",
			mlog.String("blockID", block.ID),
			mlog.String("block_type", block.Type),
			mlog.String("block_title", block.Title),
		)
		err := s.InsertBlock(globalContainer, block)
		if err != nil {
			return err
		}
	}

	return nil
}

// isInitializationNeeded returns true if the blocks table is empty.
func (s *SQLStore) isInitializationNeeded() (bool, error) {
	query := s.getQueryBuilder().
		Select("count(*)").
		From(s.tablePrefix + "blocks").
		Where(sq.Eq{"COALESCE(workspace_id, '0')": "0"})

	row := query.QueryRow()

	var count int
	err := row.Scan(&count)
	if err != nil {
		s.logger.Fatal("isInitializationNeeded", mlog.Err(err))
		return false, err
	}

	return (count == 0), nil
}
