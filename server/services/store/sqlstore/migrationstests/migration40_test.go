package migrationstests

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func Test40FixFileinfoSoftDeletes(t *testing.T) {
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

	t.Run("the file infos that don't belong to boards will not be restored", func(t *testing.T) {
		require.Equal(t, 1000, getFileInfo(t, "fileinfo-1").DeleteAt)
		require.Equal(t, 1000, getFileInfo(t, "fileinfo-2").DeleteAt)
		require.Empty(t, getFileInfo(t, "fileinfo-3").DeleteAt)
	})

	t.Run("the file infos that belong to boards should correctly be restored", func(t *testing.T) {
		require.Empty(t, getFileInfo(t, "fileinfo-3").DeleteAt)
		require.Empty(t, getFileInfo(t, "fileinfo-4").DeleteAt)
		require.Empty(t, getFileInfo(t, "fileinfo-5").DeleteAt)
	})
}
