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
	"github.com/mattermost/focalboard/server/services/store"
)

type WorkspaceAuthenticator interface {
	DoesUserHaveWorkspaceAccess(session *model.Session, workspaceID string) bool
}

// IsValidSessionToken authenticates session tokens
type IsValidSessionToken func(token string) bool

// Server is a WebSocket server.
type Server struct {
	upgrader               websocket.Upgrader
	listeners              map[string][]*websocket.Conn
	mu                     sync.RWMutex
	auth                   *auth.Auth
	singleUserToken        string
	WorkspaceAuthenticator WorkspaceAuthenticator
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
	Action      string   `json:"action"`
	WorkspaceID string   `json:"workspaceId"`
	Token       string   `json:"token"`
	ReadToken   string   `json:"readToken"`
	BlockIDs    []string `json:"blockIds"`
}

type websocketSession struct {
	client          *websocket.Conn
	isAuthenticated bool
	workspaceID     string
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
		log.Printf("ERROR upgrading to websocket: %v", err)
		return
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
			ws.authenticateListener(&wsSession, command.WorkspaceID, command.Token, command.ReadToken)

		case "ADD":
			log.Printf(`Command: Add workspaceID: %s, blockIDs: %v, client: %s`, wsSession.workspaceID, command.BlockIDs, client.RemoteAddr())
			ws.addListener(&wsSession, &command)

		case "REMOVE":
			log.Printf(`Command: Remove workspaceID: %s, blockID: %v, client: %s`, wsSession.workspaceID, command.BlockIDs, client.RemoteAddr())
			ws.removeListenerFromBlocks(&wsSession, &command)

		default:
			log.Printf(`ERROR webSocket command, invalid action: %v`, command.Action)
		}
	}
}

func (ws *Server) isValidSessionToken(token, workspaceID string) bool {
	if len(ws.singleUserToken) > 0 {
		return token == ws.singleUserToken
	}

	session, err := ws.auth.GetSession(token)
	if session == nil || err != nil {
		return false
	}

	// Check workspace permission
	if ws.WorkspaceAuthenticator != nil {
		if !ws.WorkspaceAuthenticator.DoesUserHaveWorkspaceAccess(session, workspaceID) {
			return false
		}
	}

	return true
}

func (ws *Server) authenticateListener(wsSession *websocketSession, workspaceID, token, readToken string) {
	if wsSession.isAuthenticated {
		// Do not allow multiple auth calls (for security)
		log.Printf("authenticateListener: Ignoring already authenticated session")
		return
	}

	// Authenticate session
	isValidSession := ws.isValidSessionToken(token, workspaceID)
	if !isValidSession {
		wsSession.client.Close()
		return
	}

	// Authenticated

	// Special case: Default workspace is blank
	if workspaceID == "0" {
		workspaceID = ""
	}
	wsSession.workspaceID = workspaceID
	wsSession.isAuthenticated = true
	log.Printf("authenticateListener: Authenticated, workspaceID: %s", workspaceID)
}

func (ws *Server) getContainer(wsSession *websocketSession) (store.Container, error) {
	// TODO
	container := store.Container{
		WorkspaceID: "",
	}

	return container, nil
}

func (ws *Server) checkAuthentication(wsSession *websocketSession, command *WebsocketCommand) bool {
	if wsSession.isAuthenticated {
		return true
	}

	container, err := ws.getContainer(wsSession)
	if err != nil {
		log.Printf("checkAuthentication: No container")
		sendError(wsSession.client, "No container")
		return false
	}

	if len(command.ReadToken) > 0 {
		// Read token must be valid for all block IDs
		for _, blockID := range command.BlockIDs {
			isValid, _ := ws.auth.IsValidReadToken(container, blockID, command.ReadToken)
			if !isValid {
				return false
			}
		}
		return true
	}

	return false
}

// TODO: Refactor workspace hashing
func makeItemID(workspaceID, blockID string) string {
	return workspaceID + "-" + blockID
}

// addListener adds a listener for a block's change.
func (ws *Server) addListener(wsSession *websocketSession, command *WebsocketCommand) {
	if !ws.checkAuthentication(wsSession, command) {
		log.Printf("addListener: NOT AUTHENTICATED")
		sendError(wsSession.client, "not authenticated")
		return
	}

	workspaceID := wsSession.workspaceID

	ws.mu.Lock()
	for _, blockID := range command.BlockIDs {
		itemID := makeItemID(workspaceID, blockID)
		if ws.listeners[itemID] == nil {
			ws.listeners[itemID] = []*websocket.Conn{}
		}

		ws.listeners[itemID] = append(ws.listeners[itemID], wsSession.client)
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

	workspaceID := wsSession.workspaceID

	ws.mu.Lock()
	for _, blockID := range command.BlockIDs {
		itemID := makeItemID(workspaceID, blockID)
		listeners := ws.listeners[itemID]
		if listeners == nil {
			return
		}

		// Remove the first instance of this client that's listening to this block
		// Note: A client can listen multiple times to the same block
		for index, listener := range listeners {
			if wsSession.client == listener {
				newListeners := append(listeners[:index], listeners[index+1:]...)
				ws.listeners[itemID] = newListeners

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
func (ws *Server) getListeners(workspaceID string, blockID string) []*websocket.Conn {
	ws.mu.Lock()
	itemID := makeItemID(workspaceID, blockID)
	listeners := ws.listeners[itemID]
	ws.mu.Unlock()

	return listeners
}

// BroadcastBlockDelete broadcasts delete messages to clients
func (ws *Server) BroadcastBlockDelete(workspaceID, blockID, parentID string) {
	now := time.Now().Unix()
	block := model.Block{}
	block.ID = blockID
	block.ParentID = parentID
	block.UpdateAt = now
	block.DeleteAt = now

	ws.BroadcastBlockChange(workspaceID, block)
}

// BroadcastBlockChange broadcasts update messages to clients
func (ws *Server) BroadcastBlockChange(workspaceID string, block model.Block) {
	blockIDsToNotify := []string{block.ID, block.ParentID}

	for _, blockID := range blockIDsToNotify {
		listeners := ws.getListeners(workspaceID, blockID)
		log.Printf("%d listener(s) for blockID: %s", len(listeners), blockID)

		if listeners != nil {
			message := UpdateMsg{
				Action: "UPDATE_BLOCK",
				Block:  block,
			}

			for _, listener := range listeners {
				log.Printf("Broadcast change, workspaceID: %s, blockID: %s, remoteAddr: %s", workspaceID, blockID, listener.RemoteAddr())

				err := listener.WriteJSON(message)
				if err != nil {
					log.Printf("broadcast error: %v", err)
					listener.Close()
				}
			}
		}
	}
}
