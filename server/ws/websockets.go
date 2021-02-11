package ws

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
	"github.com/mattermost/focalboard/server/auth"
	"github.com/mattermost/focalboard/server/model"
)

// IsValidSessionToken authenticates session tokens
type IsValidSessionToken func(token string) bool

// Server is a WebSocket server.
type Server struct {
	upgrader        websocket.Upgrader
	listeners       map[string][]*websocket.Conn
	mu              sync.RWMutex
	auth            *auth.Auth
	singleUserToken string
}

// UpdateMsg is sent on block updates
type UpdateMsg struct {
	Action string      `json:"action"`
	Block  model.Block `json:"block"`
}

// ErrorMsg is sent on errors
type ErrorMsg struct {
	Error string `json:"error"`
}

// WebsocketCommand is an incoming command from the client.
type WebsocketCommand struct {
	Action    string   `json:"action"`
	Token     string   `json:"token"`
	ReadToken string   `json:"readToken"`
	BlockIDs  []string `json:"blockIds"`
}

type websocketSession struct {
	client          *websocket.Conn
	isAuthenticated bool
}

// NewServer creates a new Server.
func NewServer(auth *auth.Auth, singleUserToken string) *Server {
	return &Server{
		listeners: make(map[string][]*websocket.Conn),
		upgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool {
				return true
			},
		},
		auth:            auth,
		singleUserToken: singleUserToken,
	}
}

// RegisterRoutes registers routes.
func (ws *Server) RegisterRoutes(r *mux.Router) {
	r.HandleFunc("/ws/onchange", ws.handleWebSocketOnChange)
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
		ws.removeListener(client)

		client.Close()
	}()

	wsSession := websocketSession{
		client:          client,
		isAuthenticated: false,
	}

	// Simple message handling loop
	for {
		_, p, err := client.ReadMessage()
		if err != nil {
			log.Printf("ERROR WebSocket onChange, client: %s, err: %v", client.RemoteAddr(), err)
			ws.removeListener(client)

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
		case "AUTH":
			log.Printf(`Command: AUTH, client: %s`, client.RemoteAddr())
			ws.authenticateListener(&wsSession, command.Token, command.ReadToken)

		case "ADD":
			log.Printf(`Command: Add blockID: %v, client: %s`, command.BlockIDs, client.RemoteAddr())
			ws.addListener(&wsSession, &command)

		case "REMOVE":
			log.Printf(`Command: Remove blockID: %v, client: %s`, command.BlockIDs, client.RemoteAddr())
			ws.removeListenerFromBlocks(&wsSession, &command)

		default:
			log.Printf(`ERROR webSocket command, invalid action: %v`, command.Action)
		}
	}
}

func (ws *Server) isValidSessionToken(token string) bool {
	if len(ws.singleUserToken) > 0 {
		return token == ws.singleUserToken
	}

	session, err := ws.auth.GetSession(token)
	if session != nil && err == nil {
		return true
	}

	return false
}

func (ws *Server) authenticateListener(wsSession *websocketSession, token string, readToken string) {
	// Authenticate session
	isValidSession := ws.isValidSessionToken(token)
	if !isValidSession {
		wsSession.client.Close()
		return
	}

	// Authenticated
	wsSession.isAuthenticated = true
	log.Printf("authenticateListener: Authenticated")
}

func (ws *Server) checkAuthentication(wsSession *websocketSession, command *WebsocketCommand) bool {
	if wsSession.isAuthenticated {
		return true
	}

	if len(command.ReadToken) > 0 {
		// Read token must be valid for all block IDs
		for _, blockID := range command.BlockIDs {
			isValid, _ := ws.auth.IsValidReadToken(blockID, command.ReadToken)
			if !isValid {
				return false
			}
		}
		return true
	}

	return false
}

// addListener adds a listener for a block's change.
func (ws *Server) addListener(wsSession *websocketSession, command *WebsocketCommand) {
	if !ws.checkAuthentication(wsSession, command) {
		log.Printf("addListener: NOT AUTHENTICATED")
		sendError(wsSession.client, "not authenticated")
		return
	}

	ws.mu.Lock()
	for _, blockID := range command.BlockIDs {
		if ws.listeners[blockID] == nil {
			ws.listeners[blockID] = []*websocket.Conn{}
		}

		ws.listeners[blockID] = append(ws.listeners[blockID], wsSession.client)
	}
	ws.mu.Unlock()
}

// removeListener removes a webSocket listener from all blocks.
func (ws *Server) removeListener(client *websocket.Conn) {
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

// removeListenerFromBlocks removes a webSocket listener from a set of block.
func (ws *Server) removeListenerFromBlocks(wsSession *websocketSession, command *WebsocketCommand) {
	if !ws.checkAuthentication(wsSession, command) {
		log.Printf("removeListenerFromBlocks: NOT AUTHENTICATED")
		sendError(wsSession.client, "not authenticated")
		return
	}

	ws.mu.Lock()

	for _, blockID := range command.BlockIDs {
		listeners := ws.listeners[blockID]
		if listeners == nil {
			return
		}

		// Remove the first instance of this client that's listening to this block
		// Note: A client can listen multiple times to the same block
		for index, listener := range listeners {
			if wsSession.client == listener {
				newListeners := append(listeners[:index], listeners[index+1:]...)
				ws.listeners[blockID] = newListeners

				break
			}
		}
	}

	ws.mu.Unlock()
}

func sendError(conn *websocket.Conn, message string) {
	errorMsg := ErrorMsg{
		Error: message,
	}

	err := conn.WriteJSON(errorMsg)
	if err != nil {
		log.Printf("sendError error: %v", err)
		conn.Close()
	}
}

// getListeners returns the listeners to a blockID's changes.
func (ws *Server) getListeners(blockID string) []*websocket.Conn {
	ws.mu.Lock()
	listeners := ws.listeners[blockID]
	ws.mu.Unlock()

	return listeners
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

// BroadcastBlockChange broadcasts update messages to clients
func (ws *Server) BroadcastBlockChange(block model.Block) {
	blockIDsToNotify := []string{block.ID, block.ParentID}

	for _, blockID := range blockIDsToNotify {
		listeners := ws.getListeners(blockID)
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
