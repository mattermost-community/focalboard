package ws

import (
	"sync"
	"testing"

	mmModel "github.com/mattermost/mattermost-server/v6/model"

	"github.com/stretchr/testify/require"
)

func TestPluginAdapterWorkspaceSubscription(t *testing.T) {
	th := SetupTestHelper(t)

	webConnID := mmModel.NewId()
	userID := mmModel.NewId()
	workspaceID := mmModel.NewId()

	var pac *PluginAdapterClient
	t.Run("Should correctly add a connection", func(t *testing.T) {
		require.Empty(t, th.pa.listeners)
		require.Empty(t, th.pa.listenersByWorkspace)
		th.pa.OnWebSocketConnect(webConnID, userID)
		require.Len(t, th.pa.listeners, 1)

		var ok bool
		pac, ok = th.pa.listeners[webConnID]
		require.True(t, ok)
		require.NotNil(t, pac)
		require.Equal(t, userID, pac.userID)
		require.Empty(t, th.pa.listenersByWorkspace)
	})

	t.Run("Should correctly subscribe to a workspace", func(t *testing.T) {
		require.False(t, pac.isSubscribedToWorkspace(workspaceID))

		th.SubscribeWebConnToWorkspace(pac.webConnID, pac.userID, workspaceID)

		require.Len(t, th.pa.listenersByWorkspace[workspaceID], 1)
		require.Contains(t, th.pa.listenersByWorkspace[workspaceID], pac)
		require.Len(t, pac.workspaces, 1)
		require.Contains(t, pac.workspaces, workspaceID)

		require.True(t, pac.isSubscribedToWorkspace(workspaceID))
	})

	t.Run("Subscribing again to a subscribed workspace would have no effect", func(t *testing.T) {
		require.True(t, pac.isSubscribedToWorkspace(workspaceID))

		th.SubscribeWebConnToWorkspace(pac.webConnID, pac.userID, workspaceID)

		require.Len(t, th.pa.listenersByWorkspace[workspaceID], 1)
		require.Contains(t, th.pa.listenersByWorkspace[workspaceID], pac)
		require.Len(t, pac.workspaces, 1)
		require.Contains(t, pac.workspaces, workspaceID)

		require.True(t, pac.isSubscribedToWorkspace(workspaceID))
	})

	t.Run("Should correctly unsubscribe to a workspace", func(t *testing.T) {
		require.True(t, pac.isSubscribedToWorkspace(workspaceID))

		th.UnsubscribeWebConnFromWorkspace(pac.webConnID, pac.userID, workspaceID)

		require.Empty(t, th.pa.listenersByWorkspace[workspaceID])
		require.Empty(t, pac.workspaces)

		require.False(t, pac.isSubscribedToWorkspace(workspaceID))
	})

	t.Run("Unsubscribing again to an unsubscribed workspace would have no effect", func(t *testing.T) {
		require.False(t, pac.isSubscribedToWorkspace(workspaceID))

		th.UnsubscribeWebConnFromWorkspace(pac.webConnID, pac.userID, workspaceID)

		require.Empty(t, th.pa.listenersByWorkspace[workspaceID])
		require.Empty(t, pac.workspaces)

		require.False(t, pac.isSubscribedToWorkspace(workspaceID))
	})

	t.Run("Should correctly be marked as inactive if disconnected", func(t *testing.T) {
		require.Len(t, th.pa.listeners, 1)
		require.True(t, th.pa.listeners[webConnID].isActive())

		th.pa.OnWebSocketDisconnect(webConnID, userID)

		require.Len(t, th.pa.listeners, 1)
		require.False(t, th.pa.listeners[webConnID].isActive())
	})

	t.Run("Should be marked back as active if reconnect", func(t *testing.T) {
		require.Len(t, th.pa.listeners, 1)
		require.False(t, th.pa.listeners[webConnID].isActive())

		th.pa.OnWebSocketConnect(webConnID, userID)

		require.Len(t, th.pa.listeners, 1)
		require.True(t, th.pa.listeners[webConnID].isActive())
	})
}

func TestPluginAdapterClientReconnect(t *testing.T) {
	th := SetupTestHelper(t)

	webConnID := mmModel.NewId()
	userID := mmModel.NewId()
	workspaceID := mmModel.NewId()

	var pac *PluginAdapterClient
	t.Run("A user should be able to reconnect within the accepted threshold and keep their subscriptions", func(t *testing.T) {
		// create the connection
		require.Len(t, th.pa.listeners, 0)
		require.Len(t, th.pa.listenersByUserID[userID], 0)
		th.pa.OnWebSocketConnect(webConnID, userID)
		require.Len(t, th.pa.listeners, 1)
		require.Len(t, th.pa.listenersByUserID[userID], 1)
		var ok bool
		pac, ok = th.pa.listeners[webConnID]
		require.True(t, ok)
		require.NotNil(t, pac)

		th.SubscribeWebConnToWorkspace(pac.webConnID, pac.userID, workspaceID)
		require.True(t, pac.isSubscribedToWorkspace(workspaceID))

		// disconnect
		th.pa.OnWebSocketDisconnect(webConnID, userID)
		require.False(t, pac.isActive())
		require.Len(t, th.pa.listeners, 1)
		require.Len(t, th.pa.listenersByUserID[userID], 1)

		// reconnect right away. The connection should still be subscribed
		th.pa.OnWebSocketConnect(webConnID, userID)
		require.Len(t, th.pa.listeners, 1)
		require.Len(t, th.pa.listenersByUserID[userID], 1)
		require.True(t, pac.isActive())
		require.True(t, pac.isSubscribedToWorkspace(workspaceID))
	})

	t.Run("Should remove old inactive connection when user connects with a different ID", func(t *testing.T) {
		// we set the stale threshold to zero so inactive connections always get deleted
		oldStaleThreshold := th.pa.staleThreshold
		th.pa.staleThreshold = 0
		defer func() { th.pa.staleThreshold = oldStaleThreshold }()
		th.pa.OnWebSocketDisconnect(webConnID, userID)
		require.Len(t, th.pa.listeners, 1)
		require.Len(t, th.pa.listenersByUserID[userID], 1)
		require.Equal(t, webConnID, th.pa.listenersByUserID[userID][0].webConnID)

		newWebConnID := mmModel.NewId()
		th.pa.OnWebSocketConnect(newWebConnID, userID)

		require.Len(t, th.pa.listeners, 1)
		require.Len(t, th.pa.listenersByUserID[userID], 1)
		require.Contains(t, th.pa.listeners, newWebConnID)
		require.NotContains(t, th.pa.listeners, webConnID)
		require.Equal(t, newWebConnID, th.pa.listenersByUserID[userID][0].webConnID)

		// if the same ID connects again, it should have no subscriptions
		th.pa.OnWebSocketConnect(webConnID, userID)
		require.Len(t, th.pa.listeners, 2)
		require.Len(t, th.pa.listenersByUserID[userID], 2)
		reconnectedPAC, ok := th.pa.listeners[webConnID]
		require.True(t, ok)
		require.False(t, reconnectedPAC.isSubscribedToWorkspace(workspaceID))
	})

	t.Run("Should not remove active connections when user connects with a different ID", func(t *testing.T) {
		// we set the stale threshold to zero so inactive connections always get deleted
		oldStaleThreshold := th.pa.staleThreshold
		th.pa.staleThreshold = 0
		defer func() { th.pa.staleThreshold = oldStaleThreshold }()

		// currently we have two listeners for userID, both active
		require.Len(t, th.pa.listeners, 2)

		// a new user connects
		th.pa.OnWebSocketConnect(mmModel.NewId(), userID)

		// and we should have three connections, all of them active
		require.Len(t, th.pa.listeners, 3)

		for _, listener := range th.pa.listeners {
			require.True(t, listener.isActive())
		}
	})
}

func TestGetUserIDsForWorkspace(t *testing.T) {
	th := SetupTestHelper(t)

	// we have two workspaces
	workspaceID1 := mmModel.NewId()
	workspaceID2 := mmModel.NewId()

	// user 1 has two connections
	userID1 := mmModel.NewId()
	webConnID1 := mmModel.NewId()
	webConnID2 := mmModel.NewId()

	// user 2 has one connection
	userID2 := mmModel.NewId()
	webConnID3 := mmModel.NewId()

	wg := new(sync.WaitGroup)
	wg.Add(3)

	go func(wg *sync.WaitGroup) {
		th.pa.OnWebSocketConnect(webConnID1, userID1)
		th.SubscribeWebConnToWorkspace(webConnID1, userID1, workspaceID1)
		wg.Done()
	}(wg)

	go func(wg *sync.WaitGroup) {
		th.pa.OnWebSocketConnect(webConnID2, userID1)
		th.SubscribeWebConnToWorkspace(webConnID2, userID1, workspaceID2)
		wg.Done()
	}(wg)

	go func(wg *sync.WaitGroup) {
		th.pa.OnWebSocketConnect(webConnID3, userID2)
		th.SubscribeWebConnToWorkspace(webConnID3, userID2, workspaceID2)
		wg.Done()
	}(wg)

	wg.Wait()

	t.Run("should find that only user1 is connected to workspace 1", func(t *testing.T) {
		userIDs := th.pa.getUserIDsForWorkspace(workspaceID1)
		require.ElementsMatch(t, []string{userID1}, userIDs)
	})

	t.Run("should find that both users are connected to workspace 2", func(t *testing.T) {
		userIDs := th.pa.getUserIDsForWorkspace(workspaceID2)
		require.ElementsMatch(t, []string{userID1, userID2}, userIDs)
	})

	t.Run("should ignore user1 if webConn 2 inactive when getting workspace 2 user ids", func(t *testing.T) {
		th.pa.OnWebSocketDisconnect(webConnID2, userID1)

		userIDs := th.pa.getUserIDsForWorkspace(workspaceID2)
		require.ElementsMatch(t, []string{userID2}, userIDs)
	})

	t.Run("should still find user 1 in workspace 1 after the webConn 2 disconnection", func(t *testing.T) {
		userIDs := th.pa.getUserIDsForWorkspace(workspaceID1)
		require.ElementsMatch(t, []string{userID1}, userIDs)
	})

	t.Run("should find again both users if the webConn 2 comes back", func(t *testing.T) {
		th.pa.OnWebSocketConnect(webConnID2, userID1)

		userIDs := th.pa.getUserIDsForWorkspace(workspaceID2)
		require.ElementsMatch(t, []string{userID1, userID2}, userIDs)
	})
}

func TestParallelSubscriptionsOnMultipleConnections(t *testing.T) {
	th := SetupTestHelper(t)

	workspaceID1 := mmModel.NewId()
	workspaceID2 := mmModel.NewId()
	workspaceID3 := mmModel.NewId()
	workspaceID4 := mmModel.NewId()

	userID := mmModel.NewId()
	webConnID1 := mmModel.NewId()
	webConnID2 := mmModel.NewId()

	th.pa.OnWebSocketConnect(webConnID1, userID)
	pac1, ok := th.pa.GetListenerByWebConnID(webConnID1)
	require.True(t, ok)

	th.pa.OnWebSocketConnect(webConnID2, userID)
	pac2, ok := th.pa.GetListenerByWebConnID(webConnID2)
	require.True(t, ok)

	wg := new(sync.WaitGroup)
	wg.Add(4)

	go func(wg *sync.WaitGroup) {
		th.SubscribeWebConnToWorkspace(webConnID1, userID, workspaceID1)
		require.True(t, pac1.isSubscribedToWorkspace(workspaceID1))

		th.SubscribeWebConnToWorkspace(webConnID2, userID, workspaceID1)
		require.True(t, pac2.isSubscribedToWorkspace(workspaceID1))

		th.UnsubscribeWebConnFromWorkspace(webConnID1, userID, workspaceID1)
		require.False(t, pac1.isSubscribedToWorkspace(workspaceID1))

		th.UnsubscribeWebConnFromWorkspace(webConnID2, userID, workspaceID1)
		require.False(t, pac2.isSubscribedToWorkspace(workspaceID1))

		wg.Done()
	}(wg)

	go func(wg *sync.WaitGroup) {
		th.SubscribeWebConnToWorkspace(webConnID1, userID, workspaceID2)
		require.True(t, pac1.isSubscribedToWorkspace(workspaceID2))

		th.SubscribeWebConnToWorkspace(webConnID2, userID, workspaceID2)
		require.True(t, pac2.isSubscribedToWorkspace(workspaceID2))

		th.UnsubscribeWebConnFromWorkspace(webConnID1, userID, workspaceID2)
		require.False(t, pac1.isSubscribedToWorkspace(workspaceID2))

		th.UnsubscribeWebConnFromWorkspace(webConnID2, userID, workspaceID2)
		require.False(t, pac2.isSubscribedToWorkspace(workspaceID2))

		wg.Done()
	}(wg)

	go func(wg *sync.WaitGroup) {
		th.SubscribeWebConnToWorkspace(webConnID1, userID, workspaceID3)
		require.True(t, pac1.isSubscribedToWorkspace(workspaceID3))

		th.SubscribeWebConnToWorkspace(webConnID2, userID, workspaceID3)
		require.True(t, pac2.isSubscribedToWorkspace(workspaceID3))

		th.UnsubscribeWebConnFromWorkspace(webConnID1, userID, workspaceID3)
		require.False(t, pac1.isSubscribedToWorkspace(workspaceID3))

		th.UnsubscribeWebConnFromWorkspace(webConnID2, userID, workspaceID3)
		require.False(t, pac2.isSubscribedToWorkspace(workspaceID3))

		wg.Done()
	}(wg)

	go func(wg *sync.WaitGroup) {
		th.SubscribeWebConnToWorkspace(webConnID1, userID, workspaceID4)
		require.True(t, pac1.isSubscribedToWorkspace(workspaceID4))

		th.SubscribeWebConnToWorkspace(webConnID2, userID, workspaceID4)
		require.True(t, pac2.isSubscribedToWorkspace(workspaceID4))

		th.UnsubscribeWebConnFromWorkspace(webConnID1, userID, workspaceID4)
		require.False(t, pac1.isSubscribedToWorkspace(workspaceID4))

		th.UnsubscribeWebConnFromWorkspace(webConnID2, userID, workspaceID4)
		require.False(t, pac2.isSubscribedToWorkspace(workspaceID4))

		wg.Done()
	}(wg)

	wg.Wait()
}
