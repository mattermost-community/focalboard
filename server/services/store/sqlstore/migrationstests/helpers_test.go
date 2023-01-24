package migrationstests

import (
	"os"
	"strings"
	"testing"

	"github.com/mattermost/focalboard/server/model"
	"github.com/mgdelacroix/foundation"
)

type TestHelper struct {
	t        *testing.T
	f        *foundation.Foundation
	isPlugin bool
}

func (th *TestHelper) IsPostgres() bool {
	return th.f.DB().DriverName() == "postgres"
}

func (th *TestHelper) IsMySQL() bool {
	return th.f.DB().DriverName() == "mysql"
}

func (th *TestHelper) IsSQLite() bool {
	return th.f.DB().DriverName() == "sqlite3"
}

func SetupPluginTestHelper(t *testing.T) (*TestHelper, func()) {
	dbType := strings.TrimSpace(os.Getenv("FOCALBOARD_STORE_TEST_DB_TYPE"))
	if dbType == "" || dbType == model.SqliteDBType {
		t.Skip("Skipping plugin mode test for SQLite")
	}

	return setupTestHelper(t, true)
}

func SetupTestHelper(t *testing.T) (*TestHelper, func()) {
	return setupTestHelper(t, false)
}

func setupTestHelper(t *testing.T, isPlugin bool) (*TestHelper, func()) {
	f := foundation.New(t, NewBoardsMigrator(isPlugin))

	th := &TestHelper{
		t:        t,
		f:        f,
		isPlugin: isPlugin,
	}

	tearDown := func() {
		th.f.TearDown()
	}

	return th, tearDown
}
