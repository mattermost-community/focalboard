package migrationstests

import (
	"fmt"
	"testing"

	"github.com/stretchr/testify/require"
)

func Test36AddUniqueConstraintToCategoryBoards(t *testing.T) {
	t.Run("constraint doesn't alreadt exists", func(t *testing.T) {
		th, tearDown := SetupTestHelper(t)
		defer tearDown()

		th.f.MigrateToStep(36)

		// verifying if constraint has been added

		//can't verify in sqlite, so skipping it
		if th.f.DB().DriverName() == "sqlite3" {
			return
		}

		var count int
		query := "SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS " +
			"WHERE constraint_name = 'unique_user_category_board' " +
			"AND constraint_type = 'UNIQUE' " +
			"AND table_name = 'focalboard_category_boards'"
		th.f.DB().Get(&count, query)
		require.Equal(t, 1, count)
	})

	t.Run("constraint already exists", func(t *testing.T) {
		th, tearDown := SetupTestHelper(t)
		defer tearDown()

		// SQLIte doesn't support adding constraint to existing table
		// and neither do we, so skipping for sqlite

		fmt.Println("Database drivername: " + th.f.DB().DriverName())

		if th.f.DB().DriverName() == "sqlite3" {
			return
		}

		th.f.MigrateToStep(35)

		if th.f.DB().DriverName() == "mysql" {
			th.f.DB().Exec("alter table focalboard_category_boards add constraint unique_user_category_board UNIQUE(user_id, board_id);")
			th.f.MigrateToStep(36)
		} else if th.f.DB().DriverName() == "postgres" {
			th.f.DB().Exec("ALTER TABLE focalboard_category_boards ADD CONSTRAINT unique_user_category_board UNIQUE(user_id, board_id);")
			th.f.MigrateToStep(36)
		}

		var count int
		query := "SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS " +
			"WHERE constraint_name = 'unique_user_category_board' " +
			"AND constraint_type = 'UNIQUE' " +
			"AND table_name = 'focalboard_category_boards'"
		th.f.DB().Get(&count, query)
		require.Equal(t, 1, count)
	})
}
