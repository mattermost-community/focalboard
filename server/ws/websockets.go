package ws

import (
	"encoding/json"
	"errors"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
	"github.com/mattermost/focalboard/server/auth"
	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/services/mlog"
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
	logger                 *mlog.Logger
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
func NewServer(auth *auth.Auth, singleUserToken string, logger *mlog.Logger) *Server {
	return &Server{
		listeners: make(map[string][]*websocket.Conn),
		upgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool {
				return true
			},
		},
		auth:            auth,
		singleUserToken: singleUserToken,
		logger:          logger,
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
		ws.logger.Error("ERROR upgrading to websocket", mlog.Err(err))
		return
	}

	// TODO: Auth

	ws.logger.Debug("CONNECT WebSocket onChange", mlog.Stringer("client", client.RemoteAddr()))

	// Make sure we close the connection when the function returns
	defer func() {
		ws.logger.Debug("DISCONNECT WebSocket onChange", mlog.Stringer("client", client.RemoteAddr()))

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
			ws.logger.Error("ERROR WebSocket onChange",
				mlog.Stringer("client", client.RemoteAddr()),
				mlog.Err(err),
			)
			ws.removeListener(client)

			break
		}

		var command WebsocketCommand

		err = json.Unmarshal(p, &command)
		if err != nil {
			// handle this error
			ws.logger.Error(`ERROR webSocket parsing command`, mlog.String("json", string(p)))

			continue
		}

		switch command.Action {
		case "AUTH":
			ws.logger.Debug(`Command: AUTH`, mlog.Stringer("client", client.RemoteAddr()))
			ws.authenticateListener(&wsSession, command.WorkspaceID, command.Token)

		case "ADD":
			ws.logger.Debug(`Command: ADD`,
				mlog.String("workspaceID", wsSession.workspaceID),
				mlog.Array("blockIDs", command.BlockIDs),
				mlog.Stringer("client", client.RemoteAddr()),
			)
			ws.addListener(&wsSession, &command)

		case "REMOVE":
			ws.logger.Debug(`Command: REMOVE`,
				mlog.String("workspaceID", wsSession.workspaceID),
				mlog.Array("blockIDs", command.BlockIDs),
				mlog.Stringer("client", client.RemoteAddr()),
			)

			ws.removeListenerFromBlocks(&wsSession, &command)

		default:
			ws.logger.Error(`ERROR webSocket command, invalid action`, mlog.String("action", command.Action))
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

func (ws *Server) authenticateListener(wsSession *websocketSession, workspaceID, token string) {
	if wsSession.isAuthenticated {
		// Do not allow multiple auth calls (for security)
		ws.logger.Debug("authenticateListener: Ignoring already authenticated session", mlog.String("workspaceID", workspaceID))
		return
	}

	// Authenticate session
	isValidSession := ws.isValidSessionToken(token, workspaceID)
	if !isValidSession {
		wsSession.client.Close()
		return
	}

	// Authenticated

	wsSession.workspaceID = workspaceID
	wsSession.isAuthenticated = true
	ws.logger.Debug("authenticateListener: Authenticated", mlog.String("workspaceID", workspaceID))
}

func (ws *Server) getAuthenticatedWorkspaceID(wsSession *websocketSession, command *WebsocketCommand) (string, error) {
	if wsSession.isAuthenticated {
		return wsSession.workspaceID, nil
	}

	// If not authenticated, try to authenticate the read token against the supplied workspaceID
	workspaceID := command.WorkspaceID
	if len(workspaceID) == 0 {
		ws.logger.Error("getAuthenticatedWorkspaceID: No workspace")
		return "", errors.New("No workspace")
	}

	container := store.Container{
		WorkspaceID: workspaceID,
	}

	if len(command.ReadToken) > 0 {
		// Read token must be valid for all block IDs
		for _, blockID := range command.BlockIDs {
			isValid, _ := ws.auth.IsValidReadToken(container, blockID, command.ReadToken)
			if !isValid {
				return "", errors.New("Invalid read token for workspace")
			}
		}
		return workspaceID, nil
	}

	return "", errors.New("No read token")
}

// TODO: Refactor workspace hashing
func makeItemID(workspaceID, blockID string) string {
	return workspaceID + "-" + blockID
}

// addListener adds a listener for a block's change.
func (ws *Server) addListener(wsSession *websocketSession, command *WebsocketCommand) {
	workspaceID, err := ws.getAuthenticatedWorkspaceID(wsSession, command)
	if err != nil {
		ws.logger.Error("addListener: NOT AUTHENTICATED", mlog.Err(err))
		ws.sendError(wsSession.client, "not authenticated")
		return
	}

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
	workspaceID, err := ws.getAuthenticatedWorkspaceID(wsSession, command)
	if err != nil {
		ws.logger.Error("addListener: NOT AUTHENTICATED", mlog.Err(err))
		ws.sendError(wsSession.client, "not authenticated")
		return
	}

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

func (ws *Server) sendError(conn *websocket.Conn, message string) {
	errorMsg := ErrorMsg{
		Error: message,
	}

	err := conn.WriteJSON(errorMsg)
	if err != nil {
		ws.logger.Error("sendError error", mlog.Err(err))
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
		ws.logger.Debug("listener(s) for blockID",
			mlog.Int("listener_count", len(listeners)),
			mlog.String("blockID", blockID),
		)

		if listeners != nil {
			message := UpdateMsg{
				Action: "UPDATE_BLOCK",
				Block:  block,
			}

			for _, listener := range listeners {
				ws.logger.Debug("Broadcast change",
					mlog.String("workspaceID", workspaceID),
					mlog.String("blockID", blockID),
					mlog.Stringer("remoteAddr", listener.RemoteAddr()),
				)

				err := listener.WriteJSON(message)
				if err != nil {
					ws.logger.Error("broadcast error", mlog.Err(err))
					listener.Close()
				}
			}
		}
	}
}
