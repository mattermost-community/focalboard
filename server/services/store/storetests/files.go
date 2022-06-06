package storetests

import (
	"github.com/mattermost/focalboard/server/services/store"
	"github.com/mattermost/focalboard/server/utils"
	mmModel "github.com/mattermost/mattermost-server/v6/model"
	"github.com/stretchr/testify/assert"
	"testing"
)

func StoreTestFileStore(t *testing.T, setup func(t *testing.T) (store.Store, func())) {
	sqlStore, tearDown := setup(t)
	defer tearDown()

	t.Run("test saveFileInfo", func(t *testing.T) {
		t.Run("should save fileinfo", func(t *testing.T) {
			fileInfo := &mmModel.FileInfo{
				Id:        "file_info_1",
				CreateAt:  utils.GetMillis(),
				Name:      "Dunder Mifflin Sales Report 2022",
				Extension: ".salez",
				Size:      112233,
				DeleteAt:  0,
				Archived:  false,
			}

			err := sqlStore.SaveFileInfo(fileInfo)
			assert.NoError(t, err)
		})
	})
}
