package migrationstests

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func Test18AddTeamsAndBoardsSQLMigration(t *testing.T) {
	t.Run("should migrate a block of type board to the boards table", func(t *testing.T) {
		th, tearDown := SetupPluginTestHelper(t)
		defer tearDown()

		th.f.MigrateToStep(17).
			ExecFile("./fixtures/test18AddTeamsAndBoardsSQLMigrationFixtures.sql")

		board := struct {
			ID    string
			Title string
			Type  string
		}{}

		// we check first that the board is inside the blocks table as
		// a block of board type
		err := th.f.DB().Get(&board, "SELECT id, title, type FROM focalboard_blocks WHERE id = 'board-id'")
		require.NoError(t, err)
		require.Equal(t, "My Board", board.Title)
		require.Equal(t, "board", board.Type)

		// then we run the migration
		th.f.MigrateToStep(18)

		// we assert that the board is now a block
		bErr := th.f.DB().Get(&board, "SELECT id, title, type FROM focalboard_boards WHERE id = 'board-id'")
		require.NoError(t, bErr)
		require.Equal(t, "My Board", board.Title)
		require.Equal(t, "O", board.Type)

		card := struct {
			Title     string
			Type      string
			Parent_ID string
			Board_ID  string
		}{}

		// we fetch the card to ensure that the
		cErr := th.f.DB().Get(&card, "SELECT title, type, parent_id, board_id FROM focalboard_blocks WHERE id = 'card-id'")
		require.NoError(t, cErr)
		require.Equal(t, "A card", card.Title)
		require.Equal(t, "card", card.Type)
		require.Equal(t, board.ID, card.Parent_ID)
		require.Equal(t, board.ID, card.Board_ID)
	})
}
