package sqlstore

import (
	"database/sql"
	"fmt"

	mmModel "github.com/mattermost/mattermost/server/public/model"

	"github.com/mattermost/mattermost/server/public/shared/mlog"
)

// servicesAPI is the interface required my the Params to interact with the mattermost-server.
// You can use plugin-api or product-api adapter implementations.
type servicesAPI interface {
	GetChannelByID(string) (*mmModel.Channel, error)
}

type Params struct {
	DBType           string
	ConnectionString string
	DBPingAttempts   int
	TablePrefix      string
	Logger           mlog.LoggerIFace
	DB               *sql.DB
	IsSingleUser     bool
	NewMutexFn       MutexFactory
	ServicesAPI      servicesAPI
	SkipMigrations   bool
	ConfigFn         func() *mmModel.Config
}

type ErrStoreParam struct {
	name  string
	issue string
}

func (e ErrStoreParam) Error() string {
	return fmt.Sprintf("invalid store params: %s %s", e.name, e.issue)
}
