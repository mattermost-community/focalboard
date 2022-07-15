package sqlstore

import (
	"database/sql"
	"fmt"

	"github.com/mattermost/mattermost-server/v6/plugin"

	"github.com/mattermost/mattermost-server/v6/shared/mlog"
)

type Params struct {
	DBType           string
	ConnectionString string
	TablePrefix      string
	Logger           *mlog.Logger
	DB               *sql.DB
	IsPlugin         bool
	IsSingleUser     bool
	NewMutexFn       MutexFactory
	PluginAPI        *plugin.API
}

func (p Params) CheckValid() error {
	if p.IsPlugin && p.NewMutexFn == nil {
		return ErrStoreParam{name: "NewMutexFn", issue: "cannot be nil in plugin mode"}
	}
	return nil
}

type ErrStoreParam struct {
	name  string
	issue string
}

func (e ErrStoreParam) Error() string {
	return fmt.Sprintf("invalid store params: %s %s", e.name, e.issue)
}
