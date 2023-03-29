package migrationstests

import (
	"github.com/stretchr/testify/assert"
	"testing"
)

func TestRunDeDuplicateCategoryBoardsMigration(t *testing.T) {
	th, tearDown := SetupTestHelper(t)
	defer tearDown()

	if th.IsSQLite() {
		t.Skip("SQLite is not supported for this")
	}

	th.f.MigrateToStepSkippingLastInterceptor(35).
		ExecFile("./fixtures/testDeDuplicateCategoryBoardsMigration.sql")

	th.f.RunInterceptor(35)

	// verifying count of rows
	var count int
	countQuery := "SELECT COUNT(*) FROM focalboard_category_boards"
	row := th.f.DB().QueryRow(countQuery)
	err := row.Scan(&count)
	assert.NoError(t, err)
	assert.Equal(t, 4, count)
}
