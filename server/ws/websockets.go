package ws

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
	"github.com/mattermost/mattermost-octo-tasks/server/model"
)

// RegisterRoutes registers routes.
func (ws *Server) RegisterRoutes(r *mux.Router) {
	r.HandleFunc("/ws/onchange", ws.handleWebSocketOnChange)
}

// AddListener adds a listener for a block's change.
func (ws *Server) AddListener(client *websocket.Conn, blockIDs []string) {
	ws.mu.Lock()
	for _, blockID := range blockIDs {
		if ws.listeners[blockID] == nil {
			ws.listeners[blockID] = []*websocket.Conn{}
		}

		ws.listeners[blockID] = append(ws.listeners[blockID], client)
	}
	ws.mu.Unlock()
}

// RemoveListener removes a webSocket listener from all blocks.
func (ws *Server) RemoveListener(client *websocket.Conn) {
	ws.mu.Lock()
	for key, clients := range ws.listeners {
		listeners := []*websocket.Conn{}

		for _, existingClient := range clients {
			if client != existingClient {
				listeners = append(listeners, existingClient)
			}
		}

		ws.listeners[key] = listeners
	}
	ws.mu.Unlock()
}

// RemoveListenerFromBlocks removes a webSocket listener from a set of block.
func (ws *Server) RemoveListenerFromBlocks(client *websocket.Conn, blockIDs []string) {
	ws.mu.Lock()

	for _, blockID := range blockIDs {
		listeners := ws.listeners[blockID]
		if listeners == nil {
			return
		}

		// Remove the first instance of this client that's listening to this block
		// Note: A client can listen multiple times to the same block
		for index, listener := range listeners {
			if client == listener {
				newListeners := append(listeners[:index], listeners[index+1:]...)
				ws.listeners[blockID] = newListeners

				break
			}
		}
	}

	ws.mu.Unlock()
}

// GetListeners returns the listeners to a blockID's changes.
func (ws *Server) GetListeners(blockID string) []*websocket.Conn {
	ws.mu.Lock()
	listeners := ws.listeners[blockID]
	ws.mu.Unlock()

	return listeners
}

// Server is a WebSocket server.
type Server struct {
	upgrader  websocket.Upgrader
	listeners map[string][]*websocket.Conn
	mu        sync.RWMutex
}

// NewServer creates a new Server.
func NewServer() *Server {
	return &Server{
		listeners: make(map[string][]*websocket.Conn),
		upgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool {
				return true
			},
		},
	}
}

// UpdateMsg is sent on block updates
type UpdateMsg struct {
	Action string      `json:"action"`
	Block  model.Block `json:"block"`
}

// WebsocketCommand is an incoming command from the client.
type WebsocketCommand struct {
	Action   string   `json:"action"`
	BlockIDs []string `json:"blockIds"`
}

func (ws *Server) handleWebSocketOnChange(w http.ResponseWriter, r *http.Request) {
	// Upgrade initial GET request to a websocket
	client, err := ws.upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Fatal(err)
	}

	// TODO: Auth

	log.Printf("CONNECT WebSocket onChange, client: %s", client.RemoteAddr())

	// Make sure we close the connection when the function returns
	defer func() {
		log.Printf("DISCONNECT WebSocket onChange, client: %s", client.RemoteAddr())

		// Remove client from listeners
		ws.RemoveListener(client)

		client.Close()
	}()

	// Simple message handling loop
	for {
		_, p, err := client.ReadMessage()
		if err != nil {
			log.Printf("ERROR WebSocket onChange, client: %s, err: %v", client.RemoteAddr(), err)
			ws.RemoveListener(client)

			break
		}

		var command WebsocketCommand

		err = json.Unmarshal(p, &command)
		if err != nil {
			// handle this error
			log.Printf(`ERROR webSocket parsing command JSON: %v`, string(p))

			continue
		}

		switch command.Action {
		case "ADD":
			log.Printf(`Command: Add blockID: %v, client: %s`, command.BlockIDs, client.RemoteAddr())
			ws.AddListener(client, command.BlockIDs)

		case "REMOVE":
			log.Printf(`Command: Remove blockID: %v, client: %s`, command.BlockIDs, client.RemoteAddr())
			ws.RemoveListenerFromBlocks(client, command.BlockIDs)

		default:
			log.Printf(`ERROR webSocket command, invalid action: %v`, command.Action)
		}
	}
}

// BroadcastBlockDelete broadcasts delete messages to clients
func (ws *Server) BroadcastBlockDelete(blockID string, parentID string) {
	now := time.Now().Unix()
	block := model.Block{}
	block.ID = blockID
	block.ParentID = parentID
	block.UpdateAt = now
	block.DeleteAt = now

	ws.BroadcastBlockChange(block)
}

/*
func (ws *Server) BroadcastBlockDelete1(blockIDs []string) {
	for _, blockID := range blockIDs {
		listeners := ws.GetListeners(blockID)
		log.Printf("%d listener(s) for blockID: %s", len(listeners), blockID)

		if listeners != nil {
			message := DeleteMsg{
				Action:  "DELETE_BLOCK",
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
*/

// BroadcastBlockChange broadcasts update messages to clients
func (ws *Server) BroadcastBlockChange(block model.Block) {
	blockIDsToNotify := []string{block.ID, block.ParentID}

	for _, blockID := range blockIDsToNotify {
		listeners := ws.GetListeners(blockID)
		log.Printf("%d listener(s) for blockID: %s", len(listeners), blockID)

		if listeners != nil {
			message := UpdateMsg{
				Action: "UPDATE_BLOCK",
				Block:  block,
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
