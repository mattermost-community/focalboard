// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
package storetests

import (
	"github.com/mattermost/focalboard/server/services/store"
	"github.com/stretchr/testify/require"
	"testing"
)

func StoreTestInitializeStore(t *testing.T, setup func(t *testing.T) (store.Store, func())) {
	container := store.Container{
		WorkspaceID: "0",
	}
	t.Run("Initialize Template", func(t *testing.T) {
		store, tearDown := setup(t)
		defer tearDown()
		testInitializeTemplate(t, store, container)
	})
}
func testInitializeTemplate(t *testing.T, store store.Store, container store.Container) {
	t.Run("InitializeTemplate", func(t *testing.T) {
		err := store.InitializeTemplates()
		require.NoError(t, err)

		_, errBlocks := store.GetAllBlocks(container)
		require.NoError(t, errBlocks)
		//err := store.GetBlock(c store.Container, block
	})
}
