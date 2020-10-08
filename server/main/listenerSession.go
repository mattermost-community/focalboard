package main

import (
	"sync"

	"github.com/gorilla/websocket"
)

// BlockIDClientPair is a tuple of BlockID and WebSocket connection
type BlockIDClientPair struct {
	BlockID string
	Client  *websocket.Conn
}

// ListenerSession is a WebSocket session that is notified of changes to blocks
type ListenerSession struct {
	mu                 sync.RWMutex
	blockIDClientPairs []BlockIDClientPair
}

// AddListener adds a listener for a blockID's change
func (s *ListenerSession) AddListener(client *websocket.Conn, blockID string) {
	var p = BlockIDClientPair{Client: client, BlockID: blockID}
	s.mu.Lock()
	s.blockIDClientPairs = append(s.blockIDClientPairs, p)
	s.mu.Unlock()
}

// RemoveListener removes a webSocket listener
func (s *ListenerSession) RemoveListener(client *websocket.Conn) {
	s.mu.Lock()
	var newValue = []BlockIDClientPair{}
	for _, p := range s.blockIDClientPairs {
		if p.Client != client {
			newValue = append(newValue, p)
		}
	}
	s.mu.Unlock()

	s.blockIDClientPairs = newValue
}

// GetListeners returns the listeners to a blockID's changes
func (s *ListenerSession) GetListeners(blockID string) []*websocket.Conn {
	var results = []*websocket.Conn{}

	s.mu.Lock()
	for _, p := range s.blockIDClientPairs {
		if p.BlockID == blockID {
			results = append(results, p.Client)
		}
	}
	s.mu.Unlock()

	return results
}
