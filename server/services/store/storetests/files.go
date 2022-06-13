package storetests

import (
	"testing"

	"github.com/mattermost/focalboard/server/services/store"
	"github.com/mattermost/focalboard/server/utils"
	mmModel "github.com/mattermost/mattermost-server/v6/model"
	"github.com/stretchr/testify/assert"
)

func StoreTestFileStore(t *testing.T, setup func(t *testing.T) (store.Store, func())) {
	sqlStore, tearDown := setup(t)
	defer tearDown()

	t.Run("should save and retrieve fileinfo", func(t *testing.T) {
		fileInfo := &mmModel.FileInfo{
			Id:        "file_info_1",
			CreateAt:  utils.GetMillis(),
			Name:      "Dunder Mifflin Sales Report 2022",
			Extension: ".sales",
			Size:      112233,
			DeleteAt:  0,
		}

		err := sqlStore.SaveFileInfo(fileInfo)
		assert.NoError(t, err)

		retrievedFileInfo, err := sqlStore.GetFileInfo("file_info_1")
		assert.NoError(t, err)
		assert.Equal(t, "file_info_1", retrievedFileInfo.Id)
		assert.Equal(t, "Dunder Mifflin Sales Report 2022", retrievedFileInfo.Name)
		assert.Equal(t, ".sales", retrievedFileInfo.Extension)
		assert.Equal(t, int64(112233), retrievedFileInfo.Size)
		assert.Equal(t, int64(0), retrievedFileInfo.DeleteAt)
		assert.False(t, retrievedFileInfo.Archived)
	})
}
