package migrationstests

import (
	"testing"

	"github.com/mgdelacroix/foundation"
)

type TestHelper struct {
	t *testing.T
	f *foundation.Foundation
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

func SetupTestHelper(t *testing.T) (*TestHelper, func()) {
	return setupTestHelper(t)
}

func setupTestHelper(t *testing.T) (*TestHelper, func()) {
	f := foundation.New(t, NewBoardsMigrator(false))

	th := &TestHelper{
		t: t,
		f: f,
	}

	tearDown := func() {
		th.f.TearDown()
	}

	return th, tearDown
}
