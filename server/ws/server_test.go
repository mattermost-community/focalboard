package ws

import (
	"sync"
	"testing"

	"github.com/mattermost/focalboard/server/auth"
	"github.com/mattermost/focalboard/server/model"

	"github.com/mattermost/mattermost/server/public/shared/mlog"

	"github.com/gorilla/websocket"
	"github.com/stretchr/testify/require"
)

func TestTeamSubscription(t *testing.T) {
	server := NewServer(&auth.Auth{}, "token", false, &mlog.Logger{}, nil)
	session := &websocketSession{
		conn:   &websocket.Conn{},
		mu:     sync.Mutex{},
		teams:  []string{},
		blocks: []string{},
	}
	teamID := "fake-team-id"

	t.Run("Should correctly add a session", func(t *testing.T) {
		server.addListener(session)
		require.Len(t, server.listeners, 1)
		require.Empty(t, server.listenersByTeam)
		require.Empty(t, session.teams)
	})

	t.Run("Should correctly subscribe to a team", func(t *testing.T) {
		require.False(t, session.isSubscribedToTeam(teamID))

		server.subscribeListenerToTeam(session, teamID)

		require.Len(t, server.listenersByTeam[teamID], 1)
		require.Contains(t, server.listenersByTeam[teamID], session)
		require.Len(t, session.teams, 1)
		require.Contains(t, session.teams, teamID)

		require.True(t, session.isSubscribedToTeam(teamID))
	})

	t.Run("Subscribing again to a subscribed team would have no effect", func(t *testing.T) {
		require.True(t, session.isSubscribedToTeam(teamID))

		server.subscribeListenerToTeam(session, teamID)

		require.Len(t, server.listenersByTeam[teamID], 1)
		require.Contains(t, server.listenersByTeam[teamID], session)
		require.Len(t, session.teams, 1)
		require.Contains(t, session.teams, teamID)

		require.True(t, session.isSubscribedToTeam(teamID))
	})

	t.Run("Should correctly unsubscribe to a team", func(t *testing.T) {
		require.True(t, session.isSubscribedToTeam(teamID))

		server.unsubscribeListenerFromTeam(session, teamID)

		require.Empty(t, server.listenersByTeam[teamID])
		require.Empty(t, session.teams)

		require.False(t, session.isSubscribedToTeam(teamID))
	})

	t.Run("Unsubscribing again to an unsubscribed team would have no effect", func(t *testing.T) {
		require.False(t, session.isSubscribedToTeam(teamID))

		server.unsubscribeListenerFromTeam(session, teamID)

		require.Empty(t, server.listenersByTeam[teamID])
		require.Empty(t, session.teams)

		require.False(t, session.isSubscribedToTeam(teamID))
	})

	t.Run("Should correctly be removed from the server", func(t *testing.T) {
		server.removeListener(session)

		require.Empty(t, server.listeners)
	})

	t.Run("If subscribed to teams and removed, should be removed from the teams subscription list", func(t *testing.T) {
		teamID2 := "other-fake-team-id"

		server.addListener(session)
		server.subscribeListenerToTeam(session, teamID)
		server.subscribeListenerToTeam(session, teamID2)

		require.Len(t, server.listeners, 1)
		require.Contains(t, server.listenersByTeam[teamID], session)
		require.Contains(t, server.listenersByTeam[teamID2], session)

		server.removeListener(session)

		require.Empty(t, server.listeners)
		require.Empty(t, server.listenersByTeam[teamID])
		require.Empty(t, server.listenersByTeam[teamID2])
	})

	t.Run("Subscribe users to team retrieve by user", func(t *testing.T) {
		userID1 := "fake-user-id"
		userSession1 := &websocketSession{
			conn:   &websocket.Conn{},
			mu:     sync.Mutex{},
			userID: userID1,
			teams:  []string{},
			blocks: []string{},
		}
		userID2 := "fake-user-id2"
		userSession2 := &websocketSession{
			conn:   &websocket.Conn{},
			mu:     sync.Mutex{},
			userID: userID2,
			teams:  []string{},
			blocks: []string{},
		}
		teamID := "fake-team-id"

		server.addListener(session)
		server.subscribeListenerToTeam(session, teamID)
		server.addListener(userSession1)
		server.subscribeListenerToTeam(userSession1, teamID)
		server.addListener(userSession2)
		server.subscribeListenerToTeam(userSession2, teamID)

		require.Len(t, server.listeners, 3)
		require.Len(t, server.listenersByTeam[teamID], 3)

		listener := server.getListenerForUser(teamID, userID1)
		require.NotNil(t, listener)
		require.Equal(t, listener.userID, userID1)

		server.removeListener(session)
		server.removeListener(userSession1)
		server.removeListener(userSession2)

		require.Empty(t, server.listeners)
		require.Empty(t, server.listenersByTeam[teamID])
		require.Empty(t, server.getListenerForUser(teamID, userID1))
	})
}

func TestBlocksSubscription(t *testing.T) {
	server := NewServer(&auth.Auth{}, "token", false, &mlog.Logger{}, nil)
	session := &websocketSession{
		conn:   &websocket.Conn{},
		mu:     sync.Mutex{},
		teams:  []string{},
		blocks: []string{},
	}
	blockID1 := "block1"
	blockID2 := "block2"
	blockID3 := "block3"
	blockIDs := []string{blockID1, blockID2, blockID3}

	t.Run("Should correctly add a session", func(t *testing.T) {
		server.addListener(session)
		require.Len(t, server.listeners, 1)
		require.Empty(t, server.listenersByTeam)
		require.Empty(t, session.teams)
	})

	t.Run("Should correctly subscribe to a set of blocks", func(t *testing.T) {
		require.False(t, session.isSubscribedToBlock(blockID1))
		require.False(t, session.isSubscribedToBlock(blockID2))
		require.False(t, session.isSubscribedToBlock(blockID3))

		server.subscribeListenerToBlocks(session, blockIDs)

		require.Len(t, server.listenersByBlock[blockID1], 1)
		require.Contains(t, server.listenersByBlock[blockID1], session)
		require.Len(t, server.listenersByBlock[blockID2], 1)
		require.Contains(t, server.listenersByBlock[blockID2], session)
		require.Len(t, server.listenersByBlock[blockID3], 1)
		require.Contains(t, server.listenersByBlock[blockID3], session)
		require.Len(t, session.blocks, 3)
		require.ElementsMatch(t, blockIDs, session.blocks)

		require.True(t, session.isSubscribedToBlock(blockID1))
		require.True(t, session.isSubscribedToBlock(blockID2))
		require.True(t, session.isSubscribedToBlock(blockID3))

		t.Run("Subscribing again to a subscribed block would have no effect", func(t *testing.T) {
			require.True(t, session.isSubscribedToBlock(blockID1))
			require.True(t, session.isSubscribedToBlock(blockID2))
			require.True(t, session.isSubscribedToBlock(blockID3))

			server.subscribeListenerToBlocks(session, blockIDs)

			require.Len(t, server.listenersByBlock[blockID1], 1)
			require.Contains(t, server.listenersByBlock[blockID1], session)
			require.Len(t, server.listenersByBlock[blockID2], 1)
			require.Contains(t, server.listenersByBlock[blockID2], session)
			require.Len(t, server.listenersByBlock[blockID3], 1)
			require.Contains(t, server.listenersByBlock[blockID3], session)
			require.Len(t, session.blocks, 3)
			require.ElementsMatch(t, blockIDs, session.blocks)

			require.True(t, session.isSubscribedToBlock(blockID1))
			require.True(t, session.isSubscribedToBlock(blockID2))
			require.True(t, session.isSubscribedToBlock(blockID3))
		})
	})

	t.Run("Should correctly unsubscribe to a set of blocks", func(t *testing.T) {
		require.True(t, session.isSubscribedToBlock(blockID1))
		require.True(t, session.isSubscribedToBlock(blockID2))
		require.True(t, session.isSubscribedToBlock(blockID3))

		server.unsubscribeListenerFromBlocks(session, blockIDs)

		require.Empty(t, server.listenersByBlock[blockID1])
		require.Empty(t, server.listenersByBlock[blockID2])
		require.Empty(t, server.listenersByBlock[blockID3])
		require.Empty(t, session.blocks)

		require.False(t, session.isSubscribedToBlock(blockID1))
		require.False(t, session.isSubscribedToBlock(blockID2))
		require.False(t, session.isSubscribedToBlock(blockID3))
	})

	t.Run("Unsubscribing again to an unsubscribed block would have no effect", func(t *testing.T) {
		require.False(t, session.isSubscribedToBlock(blockID1))

		server.unsubscribeListenerFromBlocks(session, []string{blockID1})

		require.Empty(t, server.listenersByBlock[blockID1])
		require.Empty(t, session.blocks)

		require.False(t, session.isSubscribedToBlock(blockID1))
	})

	t.Run("Should correctly be removed from the server", func(t *testing.T) {
		server.removeListener(session)

		require.Empty(t, server.listeners)
	})

	t.Run("If subscribed to blocks and removed, should be removed from the blocks subscription list", func(t *testing.T) {
		server.addListener(session)
		server.subscribeListenerToBlocks(session, blockIDs)

		require.Len(t, server.listeners, 1)
		require.Len(t, server.listenersByBlock[blockID1], 1)
		require.Contains(t, server.listenersByBlock[blockID1], session)
		require.Len(t, server.listenersByBlock[blockID2], 1)
		require.Contains(t, server.listenersByBlock[blockID2], session)
		require.Len(t, server.listenersByBlock[blockID3], 1)
		require.Contains(t, server.listenersByBlock[blockID3], session)
		require.Len(t, session.blocks, 3)
		require.ElementsMatch(t, blockIDs, session.blocks)

		server.removeListener(session)

		require.Empty(t, server.listeners)
		require.Empty(t, server.listenersByBlock[blockID1])
		require.Empty(t, server.listenersByBlock[blockID2])
		require.Empty(t, server.listenersByBlock[blockID3])
	})
}

func TestGetUserIDForTokenInSingleUserMode(t *testing.T) {
	singleUserToken := "single-user-token"
	server := NewServer(&auth.Auth{}, "token", false, &mlog.Logger{}, nil)
	server.singleUserToken = singleUserToken

	t.Run("Should return nothing if the token is empty", func(t *testing.T) {
		require.Empty(t, server.getUserIDForToken(""))
	})

	t.Run("Should return nothing if the token is invalid", func(t *testing.T) {
		require.Empty(t, server.getUserIDForToken("invalid-token"))
	})

	t.Run("Should return the single user ID if the token is correct", func(t *testing.T) {
		require.Equal(t, model.SingleUser, server.getUserIDForToken(singleUserToken))
	})
}
