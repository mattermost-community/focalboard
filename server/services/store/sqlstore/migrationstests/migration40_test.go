package migrationstests

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func Test40FixFileinfoSoftDeletes(t *testing.T) {
	t.Run("should fix only those fileinfos that correspond to blocks that have not been deleted", func(t *testing.T) {
		th, tearDown := SetupPluginTestHelper(t)
		defer tearDown()

		th.f.MigrateToStep(39).
			ExecFile("./fixtures/test40FixFileinfoSoftDeletes.sql").
			MigrateToStep(40)

		type FileInfo struct {
			Id       string
			DeleteAt int
		}

		getFileInfo := func(t *testing.T, id string) FileInfo {
			t.Helper()
			fileInfo := FileInfo{}

			query := "SELECT id, deleteat FROM FileInfo WHERE id = $1"
			if th.IsMySQL() {
				query = "SELECT Id as id, DeleteAt as deleteat FROM FileInfo WHERE Id = ?"
			}

			err := th.f.DB().Get(&fileInfo, query, id)
			require.NoError(t, err)

			return fileInfo
		}

		t.Run("case 1: a deleted fileinfo not linked to a block, should not be restored", func(t *testing.T) {
			fileInfo := getFileInfo(t, "fileinfo-1")
			require.Equal(t, 1000, fileInfo.DeleteAt)
		})

		t.Run("case 2: two deleted fileinfos linked to nonexisting blocks, should not be restored", func(t *testing.T) {
			fileInfo1 := getFileInfo(t, "fileinfo-2-1")
			fileInfo2 := getFileInfo(t, "fileinfo-2-1")

			require.Equal(t, 2000, fileInfo1.DeleteAt)
			require.Equal(t, 2000, fileInfo2.DeleteAt)
		})

		t.Run("case 3: four deleted fileinfos, three of which are linked to existing blocks, those three should be restored", func(t *testing.T) {
			nonLinkedFileInfo := getFileInfo(t, "fileinfo-3-4")
			require.Equal(t, 3000, nonLinkedFileInfo.DeleteAt)

			restoredFileInfo1 := getFileInfo(t, "fileinfo-3-1")
			restoredFileInfo2 := getFileInfo(t, "fileinfo-3-2")
			restoredFileInfo3 := getFileInfo(t, "fileinfo-3-3")

			require.Empty(t, restoredFileInfo1.DeleteAt)
			require.Empty(t, restoredFileInfo2.DeleteAt)
			require.Empty(t, restoredFileInfo3.DeleteAt)
		})
	})
}
