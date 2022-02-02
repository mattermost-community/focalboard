package sqlstore

import (
	"errors"
	"fmt"

	sq "github.com/Masterminds/squirrel"
	"github.com/mattermost/focalboard/server/model"

	"github.com/mattermost/mattermost-server/v6/shared/mlog"
)

var (
	ErrUnsupportedDatabaseType = errors.New("database type is unsupported")
)

// removeDefaultTemplates deletes all the default templates and their children.
func (s *SQLStore) removeDefaultTemplates(db sq.BaseRunner, blocks []model.Block) error {
	count := 0
	for _, block := range blocks {
		// default template deletion does not need to go to blocks_history
		deleteQuery := s.getQueryBuilder(db).
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
func (s *SQLStore) getDefaultTemplateBlocks(db sq.BaseRunner) ([]model.Block, error) {
	query := s.getQueryBuilder(db).
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
