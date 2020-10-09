package main

import (
	"log"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
)

// AddListener adds a listener for a blockID's change
func (ws *WSServer) AddListener(client *websocket.Conn, blockID string) {
	ws.mu.Lock()
	if ws.listeners[blockID] == nil {
		ws.listeners[blockID] = []*websocket.Conn{}
	}
	ws.listeners[blockID] = append(ws.listeners[blockID], client)
	ws.mu.Unlock()
}

// RemoveListener removes a webSocket listener
func (ws *WSServer) RemoveListener(client *websocket.Conn) {
	ws.mu.Lock()
	for key, clients := range ws.listeners {
		var listeners = []*websocket.Conn{}
		for _, existingClient := range clients {
			if client != existingClient {
				listeners = append(listeners, existingClient)
			}
		}
		ws.listeners[key] = listeners
	}
	ws.mu.Unlock()
}

// GetListeners returns the listeners to a blockID's changes
func (ws *WSServer) GetListeners(blockID string) []*websocket.Conn {
	ws.mu.Lock()
	listeners := ws.listeners[blockID]
	ws.mu.Unlock()

	return listeners
}

type WSServer struct {
	upgrader  websocket.Upgrader
	listeners map[string][]*websocket.Conn
	mu        sync.RWMutex
}

func NewWSServer() *WSServer {
	return &WSServer{
		upgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool {
				return true
			},
		},
	}
}

// WebsocketMsg is send on block changes
type WebsocketMsg struct {
	Action  string `json:"action"`
	BlockID string `json:"blockId"`
}

func (ws *WSServer) handleWebSocketOnChange(w http.ResponseWriter, r *http.Request) {
	// Upgrade initial GET request to a websocket
	client, err := ws.upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Fatal(err)
	}

	// TODO: Auth

	query := r.URL.Query()
	blockID := query.Get("id")
	log.Printf("CONNECT WebSocket onChange, blockID: %s, client: %s", blockID, client.RemoteAddr())

	// Make sure we close the connection when the function returns
	defer func() {
		log.Printf("DISCONNECT WebSocket onChange, blockID: %s, client: %s", blockID, client.RemoteAddr())

		// Remove client from listeners
		ws.RemoveListener(client)

		client.Close()
	}()

	// Register our new client
	ws.AddListener(client, blockID)

	// TODO: Implement WebSocket message pump
	// Simple message handling loop
	for {
		_, _, err := client.ReadMessage()
		if err != nil {
			log.Printf("ERROR WebSocket onChange, blockID: %s, client: %s, err: %v", blockID, client.RemoteAddr(), err)
			ws.RemoveListener(client)
			break
		}
	}
}

func (ws *WSServer) broadcastBlockChangeToWebsocketClients(blockIDs []string) {
	for _, blockID := range blockIDs {
		listeners := ws.GetListeners(blockID)
		log.Printf("%d listener(s) for blockID: %s", len(listeners), blockID)

		if listeners != nil {
			var message = WebsocketMsg{
				Action:  "UPDATE_BLOCK",
				BlockID: blockID,
			}
			for _, listener := range listeners {
				log.Printf("Broadcast change, blockID: %s, remoteAddr: %s", blockID, listener.RemoteAddr())
				err := listener.WriteJSON(message)
				if err != nil {
					log.Printf("broadcast error: %v", err)
					listener.Close()
				}
			}
		}
	}
}
