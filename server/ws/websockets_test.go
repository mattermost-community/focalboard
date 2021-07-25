package ws

import (
	"sync"
	"testing"

	"github.com/mattermost/focalboard/server/auth"
	"github.com/mattermost/focalboard/server/services/mlog"

	"github.com/gorilla/websocket"
	"github.com/stretchr/testify/require"
)

func TestWorkspaceSubscription(t *testing.T) {
	server := NewServer(&auth.Auth{}, "token", false, &mlog.Logger{})
	client := &wsClient{&websocket.Conn{}, &sync.Mutex{}, []string{}, []string{}}
	session := &websocketSession{client: client}
	workspaceID := "fake-workspace-id"

	t.Run("Should correctly add a session", func(t *testing.T) {
		server.addListener(session.client)
		require.Len(t, server.listeners, 1)
		require.Empty(t, server.listenersByWorkspace)
		require.Empty(t, client.workspaces)
	})

	t.Run("Should correctly subscribe to a workspace", func(t *testing.T) {
		require.False(t, client.isSubscribedToWorkspace(workspaceID))

		server.subscribeListenerToWorkspace(client, workspaceID)

		require.Len(t, server.listenersByWorkspace[workspaceID], 1)
		require.Contains(t, server.listenersByWorkspace[workspaceID], client)
		require.Len(t, client.workspaces, 1)
		require.Contains(t, client.workspaces, workspaceID)

		require.True(t, client.isSubscribedToWorkspace(workspaceID))
	})

	t.Run("Subscribing again to a subscribed workspace would have no effect", func(t *testing.T) {
		require.True(t, client.isSubscribedToWorkspace(workspaceID))

		server.subscribeListenerToWorkspace(client, workspaceID)

		require.Len(t, server.listenersByWorkspace[workspaceID], 1)
		require.Contains(t, server.listenersByWorkspace[workspaceID], client)
		require.Len(t, client.workspaces, 1)
		require.Contains(t, client.workspaces, workspaceID)

		require.True(t, client.isSubscribedToWorkspace(workspaceID))
	})

	t.Run("Should correctly unsubscribe to a workspace", func(t *testing.T) {
		require.True(t, client.isSubscribedToWorkspace(workspaceID))

		server.unsubscribeListenerFromWorkspace(client, workspaceID)

		require.Empty(t, server.listenersByWorkspace[workspaceID])
		require.Empty(t, client.workspaces)

		require.False(t, client.isSubscribedToWorkspace(workspaceID))
	})

	t.Run("Unsubscribing again to an unsubscribed workspace would have no effect", func(t *testing.T) {
		require.False(t, client.isSubscribedToWorkspace(workspaceID))

		server.unsubscribeListenerFromWorkspace(client, workspaceID)

		require.Empty(t, server.listenersByWorkspace[workspaceID])
		require.Empty(t, client.workspaces)

		require.False(t, client.isSubscribedToWorkspace(workspaceID))
	})

	t.Run("Should correctly be removed from the server", func(t *testing.T) {
		server.removeListener(client)

		require.Empty(t, server.listeners)
	})

	t.Run("If subscribed to workspaces and removed, should be removed from the workspaces subscription list", func(t *testing.T) {
		workspaceID2 := "other-fake-workspace-id"

		server.addListener(session.client)
		server.subscribeListenerToWorkspace(client, workspaceID)
		server.subscribeListenerToWorkspace(client, workspaceID2)

		require.Len(t, server.listeners, 1)
		require.Contains(t, server.listenersByWorkspace[workspaceID], client)
		require.Contains(t, server.listenersByWorkspace[workspaceID2], client)

		server.removeListener(client)

		require.Empty(t, server.listeners)
		require.Empty(t, server.listenersByWorkspace[workspaceID])
		require.Empty(t, server.listenersByWorkspace[workspaceID2])
	})
}

func TestBlocksSubscription(t *testing.T) {
	server := NewServer(&auth.Auth{}, "token", false, &mlog.Logger{})
	client := &wsClient{&websocket.Conn{}, &sync.Mutex{}, []string{}, []string{}}
	session := &websocketSession{client: client}
	blockID1 := "block1"
	blockID2 := "block2"
	blockID3 := "block3"
	blockIDs := []string{blockID1, blockID2, blockID3}

	t.Run("Should correctly add a session", func(t *testing.T) {
		server.addListener(session.client)
		require.Len(t, server.listeners, 1)
		require.Empty(t, server.listenersByWorkspace)
		require.Empty(t, client.workspaces)
	})

	t.Run("Should correctly subscribe to a set of blocks", func(t *testing.T) {
		require.False(t, client.isSubscribedToBlock(blockID1))
		require.False(t, client.isSubscribedToBlock(blockID2))
		require.False(t, client.isSubscribedToBlock(blockID3))

		server.subscribeListenerToBlocks(client, blockIDs)

		require.Len(t, server.listenersByBlock[blockID1], 1)
		require.Contains(t, server.listenersByBlock[blockID1], client)
		require.Len(t, server.listenersByBlock[blockID2], 1)
		require.Contains(t, server.listenersByBlock[blockID2], client)
		require.Len(t, server.listenersByBlock[blockID3], 1)
		require.Contains(t, server.listenersByBlock[blockID3], client)
		require.Len(t, client.blocks, 3)
		require.ElementsMatch(t, blockIDs, client.blocks)

		require.True(t, client.isSubscribedToBlock(blockID1))
		require.True(t, client.isSubscribedToBlock(blockID2))
		require.True(t, client.isSubscribedToBlock(blockID3))

		t.Run("Subscribing again to a subscribed block would have no effect", func(t *testing.T) {
			require.True(t, client.isSubscribedToBlock(blockID1))
			require.True(t, client.isSubscribedToBlock(blockID2))
			require.True(t, client.isSubscribedToBlock(blockID3))

			server.subscribeListenerToBlocks(client, blockIDs)

			require.Len(t, server.listenersByBlock[blockID1], 1)
			require.Contains(t, server.listenersByBlock[blockID1], client)
			require.Len(t, server.listenersByBlock[blockID2], 1)
			require.Contains(t, server.listenersByBlock[blockID2], client)
			require.Len(t, server.listenersByBlock[blockID3], 1)
			require.Contains(t, server.listenersByBlock[blockID3], client)
			require.Len(t, client.blocks, 3)
			require.ElementsMatch(t, blockIDs, client.blocks)

			require.True(t, client.isSubscribedToBlock(blockID1))
			require.True(t, client.isSubscribedToBlock(blockID2))
			require.True(t, client.isSubscribedToBlock(blockID3))
		})
	})

	t.Run("Should correctly unsubscribe to a set of blocks", func(t *testing.T) {
		require.True(t, client.isSubscribedToBlock(blockID1))
		require.True(t, client.isSubscribedToBlock(blockID2))
		require.True(t, client.isSubscribedToBlock(blockID3))

		server.unsubscribeListenerFromBlocks(client, blockIDs)

		require.Empty(t, server.listenersByBlock[blockID1])
		require.Empty(t, server.listenersByBlock[blockID2])
		require.Empty(t, server.listenersByBlock[blockID3])
		require.Empty(t, client.blocks)

		require.False(t, client.isSubscribedToBlock(blockID1))
		require.False(t, client.isSubscribedToBlock(blockID2))
		require.False(t, client.isSubscribedToBlock(blockID3))
	})

	t.Run("Unsubscribing again to an unsubscribed block would have no effect", func(t *testing.T) {
		require.False(t, client.isSubscribedToBlock(blockID1))

		server.unsubscribeListenerFromBlocks(client, []string{blockID1})

		require.Empty(t, server.listenersByBlock[blockID1])
		require.Empty(t, client.blocks)

		require.False(t, client.isSubscribedToBlock(blockID1))
	})

	t.Run("Should correctly be removed from the server", func(t *testing.T) {
		server.removeListener(client)

		require.Empty(t, server.listeners)
	})

	t.Run("If subscribed to blocks and removed, should be removed from the blocks subscription list", func(t *testing.T) {
		server.addListener(session.client)
		server.subscribeListenerToBlocks(client, blockIDs)

		require.Len(t, server.listeners, 1)
		require.Len(t, server.listenersByBlock[blockID1], 1)
		require.Contains(t, server.listenersByBlock[blockID1], client)
		require.Len(t, server.listenersByBlock[blockID2], 1)
		require.Contains(t, server.listenersByBlock[blockID2], client)
		require.Len(t, server.listenersByBlock[blockID3], 1)
		require.Contains(t, server.listenersByBlock[blockID3], client)
		require.Len(t, client.blocks, 3)
		require.ElementsMatch(t, blockIDs, client.blocks)

		server.removeListener(client)

		require.Empty(t, server.listeners)
		require.Empty(t, server.listenersByBlock[blockID1])
		require.Empty(t, server.listenersByBlock[blockID2])
		require.Empty(t, server.listenersByBlock[blockID3])
	})
}

func TestGetUserIDForTokenInSingleUserMode(t *testing.T) {
	singleUserToken := "single-user-token"
	server := NewServer(&auth.Auth{}, "token", false, &mlog.Logger{})
	server.singleUserToken = singleUserToken

	t.Run("Should return nothing if the token is empty", func(t *testing.T) {
		require.Empty(t, server.getUserIDForToken(""))
	})

	t.Run("Should return nothing if the token is invalid", func(t *testing.T) {
		require.Empty(t, server.getUserIDForToken("invalid-token"))
	})

	t.Run("Should return the single user ID if the token is correct", func(t *testing.T) {
		require.Equal(t, singleUserID, server.getUserIDForToken(singleUserToken))
	})
}
