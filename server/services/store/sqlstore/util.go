package sqlstore

import (
	"database/sql"

	"github.com/mattermost/focalboard/server/services/mlog"
)

func (s *SQLStore) CloseRows(rows *sql.Rows) {
	if err := rows.Close(); err != nil {
		s.logger.Error("error closing MattermostAuthLayer row set", mlog.Err(err))
	}
}
