package integrationtests

import (
	"testing"

	"github.com/mattermost/focalboard/server/model"
	"github.com/stretchr/testify/require"
)

func TestSidebar(t *testing.T) {
	th := SetupTestHelperWithToken(t).Start()
	defer th.TearDown()

	// we'll create a new board.
	// The board should end up in a default "Boards" category
	board := th.CreateBoard("team-id", "O")

	categoryBoards := th.GetUserCategoryBoards("team-id")
	require.Equal(t, 1, len(categoryBoards))
	require.Equal(t, "Boards", categoryBoards[0].Name)
	require.Equal(t, 1, len(categoryBoards[0].BoardIDs))
	require.Equal(t, board.ID, categoryBoards[0].BoardIDs[0])

	// create a new category, a new board
	// and move that board into the new category
	board2 := th.CreateBoard("team-id", "O")
	category := th.CreateCategory(model.Category{
		Name:   "Category 2",
		TeamID: "team-id",
		UserID: "single-user",
	})
	th.UpdateCategoryBoard("team-id", category.ID, board2.ID)

	categoryBoards = th.GetUserCategoryBoards("team-id")
	// now there should be two categories - boards and the one
	// we created just now
	require.Equal(t, 2, len(categoryBoards))

	// the newly created category should be the first one array
	// as new categories end up on top in LHS
	require.Equal(t, "Category 2", categoryBoards[0].Name)
	require.Equal(t, 1, len(categoryBoards[0].BoardIDs))
	require.Equal(t, board2.ID, categoryBoards[0].BoardIDs[0])

	// now we'll delete the custom category we created, "Category 2"
	// and all it's boards should get moved to the Boards category
	th.DeleteCategory("team-id", category.ID)
	categoryBoards = th.GetUserCategoryBoards("team-id")
	require.Equal(t, 1, len(categoryBoards))
	require.Equal(t, "Boards", categoryBoards[0].Name)
	require.Equal(t, 2, len(categoryBoards[0].BoardIDs))
	require.Contains(t, categoryBoards[0].BoardIDs, board.ID)
	require.Contains(t, categoryBoards[0].BoardIDs, board2.ID)
}
