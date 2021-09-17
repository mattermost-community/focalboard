package ws

import (
	"fmt"
	"strings"
	"sync"
	"time"

	"github.com/mattermost/focalboard/server/auth"
	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/utils"
	mmModel "github.com/mattermost/mattermost-server/v6/model"
	"github.com/mattermost/mattermost-server/v6/plugin"
)

const websocketMessagePrefix = "custom_focalboard_"

var errMissingWorkspaceInCommand = fmt.Errorf("command doesn't contain workspaceId")

type PluginAdapterClient struct {
	webConnID  string
	userID     string
	workspaces []string
	blocks     []string
}

func (pac *PluginAdapterClient) isSubscribedToWorkspace(workspaceID string) bool {
	for _, id := range pac.workspaces {
		if id == workspaceID {
			return true
		}
	}

	return false
}

func (pac *PluginAdapterClient) isSubscribedToBlock(blockID string) bool {
	for _, id := range pac.blocks {
		if id == blockID {
			return true
		}
	}

	return false
}

type PluginAdapterInterface interface {
	addListener(pac *PluginAdapterClient)
	removeListener(pac *PluginAdapterClient)
	removeListenerFromWorkspace(pac *PluginAdapterClient, workspaceID string)
	removeListenerFromBlock(pac *PluginAdapterClient, blockID string)
	subscribeListenerToWorkspace(pac *PluginAdapterClient, workspaceID string)
	unsubscribeListenerFromWorkspace(pac *PluginAdapterClient, workspaceID string)
	unsubscribeListenerFromBlocks(pac *PluginAdapterClient, blockIDs []string)
	OnWebSocketConnect(webConnID, userID string)
	OnWebSocketDisconnect(webConnID, userID string)
	WebSocketMessageHasBeenPosted(webConnID, userID string, req *mmModel.WebSocketRequest)
	getUserIDsForWorkspace(workspaceID string) []string
	BroadcastConfigChange(clientConfig model.ClientConfig)
	BroadcastBlockChange(workspaceID string, block model.Block)
	BroadcastBlockDelete(workspaceID, blockID, parentID string)
	HandleClusterEvent(ev mmModel.PluginClusterEvent)
}

type PluginAdapter struct {
	api  plugin.API
	auth *auth.Auth

	listeners            map[string]*PluginAdapterClient
	listenersByWorkspace map[string][]*PluginAdapterClient
	listenersByBlock     map[string][]*PluginAdapterClient
	mu                   sync.RWMutex
}

func NewPluginAdapter(api plugin.API, auth *auth.Auth) *PluginAdapter {
	return &PluginAdapter{
		api:                  api,
		auth:                 auth,
		listeners:            make(map[string]*PluginAdapterClient),
		listenersByWorkspace: make(map[string][]*PluginAdapterClient),
		listenersByBlock:     make(map[string][]*PluginAdapterClient),
		mu:                   sync.RWMutex{},
	}
}

func (pa *PluginAdapter) addListener(pac *PluginAdapterClient) {
	pa.mu.Lock()
	defer pa.mu.Unlock()
	pa.listeners[pac.webConnID] = pac
}

func (pa *PluginAdapter) removeListener(pac *PluginAdapterClient) {
	pa.mu.Lock()
	defer pa.mu.Unlock()

	// workspace subscriptions
	for _, workspace := range pac.workspaces {
		pa.removeListenerFromWorkspace(pac, workspace)
	}

	// block subscriptions
	for _, block := range pac.blocks {
		pa.removeListenerFromBlock(pac, block)
	}

	delete(pa.listeners, pac.webConnID)
}

func (pa *PluginAdapter) removeListenerFromWorkspace(pac *PluginAdapterClient, workspaceID string) {
	newWorkspaceListeners := []*PluginAdapterClient{}
	for _, listener := range pa.listenersByWorkspace[workspaceID] {
		if listener.webConnID != pac.webConnID {
			newWorkspaceListeners = append(newWorkspaceListeners, listener)
		}
	}
	pa.listenersByWorkspace[workspaceID] = newWorkspaceListeners

	newClientWorkspaces := []string{}
	for _, id := range pac.workspaces {
		if id != workspaceID {
			newClientWorkspaces = append(newClientWorkspaces, id)
		}
	}
	pac.workspaces = newClientWorkspaces
}

func (pa *PluginAdapter) removeListenerFromBlock(pac *PluginAdapterClient, blockID string) {
	newBlockListeners := []*PluginAdapterClient{}
	for _, listener := range pa.listenersByBlock[blockID] {
		if listener.webConnID != pac.webConnID {
			newBlockListeners = append(newBlockListeners, listener)
		}
	}
	pa.listenersByBlock[blockID] = newBlockListeners

	newClientBlocks := []string{}
	for _, id := range pac.blocks {
		if id != blockID {
			newClientBlocks = append(newClientBlocks, id)
		}
	}
	pac.blocks = newClientBlocks
}

func (pa *PluginAdapter) subscribeListenerToWorkspace(pac *PluginAdapterClient, workspaceID string) {
	if pac.isSubscribedToWorkspace(workspaceID) {
		return
	}

	pa.mu.Lock()
	defer pa.mu.Unlock()

	pa.listenersByWorkspace[workspaceID] = append(pa.listenersByWorkspace[workspaceID], pac)
	pac.workspaces = append(pac.workspaces, workspaceID)
}

func (pa *PluginAdapter) unsubscribeListenerFromWorkspace(pac *PluginAdapterClient, workspaceID string) {
	if !pac.isSubscribedToWorkspace(workspaceID) {
		return
	}

	pa.mu.Lock()
	defer pa.mu.Unlock()

	pa.removeListenerFromWorkspace(pac, workspaceID)
}

func (pa *PluginAdapter) unsubscribeListenerFromBlocks(pac *PluginAdapterClient, blockIDs []string) {
	pa.mu.Lock()
	defer pa.mu.Unlock()

	for _, blockID := range blockIDs {
		if pac.isSubscribedToBlock(blockID) {
			pa.removeListenerFromBlock(pac, blockID)
		}
	}
}

func (pa *PluginAdapter) OnWebSocketConnect(webConnID, userID string) {
	pac := &PluginAdapterClient{
		webConnID:  webConnID,
		userID:     userID,
		workspaces: []string{},
		blocks:     []string{},
	}

	pa.addListener(pac)
}

func (pa *PluginAdapter) OnWebSocketDisconnect(webConnID, userID string) {
	pac, ok := pa.listeners[webConnID]
	if !ok {
		pa.api.LogError("received a disconnect for an unregistered webconn",
			"webConnID", webConnID,
			"userID", userID,
		)
		return
	}

	pa.removeListener(pac)
}

func commandFromRequest(req *mmModel.WebSocketRequest) (*WebsocketCommand, error) {
	c := &WebsocketCommand{Action: strings.TrimPrefix(req.Action, websocketMessagePrefix)}

	if workspaceID, ok := req.Data["workspaceId"]; ok {
		c.WorkspaceID = workspaceID.(string)
	} else {
		return nil, errMissingWorkspaceInCommand
	}

	if readToken, ok := req.Data["readToken"]; ok {
		c.ReadToken = readToken.(string)
	}

	if blockIDs, ok := req.Data["blockIds"]; ok {
		c.BlockIDs = blockIDs.([]string)
	}

	return c, nil
}

func (pa *PluginAdapter) WebSocketMessageHasBeenPosted(webConnID, userID string, req *mmModel.WebSocketRequest) {
	pac, ok := pa.listeners[webConnID]
	if !ok {
		pa.api.LogError("received a message for an unregistered webconn",
			"webConnID", webConnID,
			"userID", userID,
			"action", req.Action,
		)
		return
	}

	// only process messages using the plugin actions
	if !strings.HasPrefix(req.Action, websocketMessagePrefix) {
		return
	}

	command, err := commandFromRequest(req)
	if err != nil {
		pa.api.LogError("error getting command from request",
			"err", err,
			"action", req.Action,
			"webConnID", webConnID,
			"userID", userID,
		)
		return
	}

	switch command.Action {
	// The block-related commands are not implemented in the adapter
	// as there is no such thing as unauthenticated websocket
	// connections in plugin mode. Only a debug line is logged
	case websocketActionSubscribeBlocks, websocketActionUnsubscribeBlocks:
		pa.api.LogDebug(`Command not implemented in plugin mode`,
			"command", command.Action,
			"webConnID", webConnID,
			"userID", userID,
			"workspaceID", command.WorkspaceID,
		)

	case websocketActionSubscribeWorkspace:
		pa.api.LogDebug(`Command: SUBSCRIBE_WORKSPACE`,
			"webConnID", webConnID,
			"userID", userID,
			"workspaceID", command.WorkspaceID,
		)

		if !pa.auth.DoesUserHaveWorkspaceAccess(userID, command.WorkspaceID) {
			return
		}

		pa.subscribeListenerToWorkspace(pac, command.WorkspaceID)
	case websocketActionUnsubscribeWorkspace:
		pa.api.LogDebug(`Command: UNSUBSCRIBE_WORKSPACE`,
			"webConnID", webConnID,
			"userID", userID,
			"workspaceID", command.WorkspaceID,
		)

		pa.unsubscribeListenerFromWorkspace(pac, command.WorkspaceID)
	}
}

func (pa *PluginAdapter) getUserIDsForWorkspace(workspaceID string) []string {
	userMap := map[string]bool{}
	for _, pac := range pa.listenersByWorkspace[workspaceID] {
		userMap[pac.userID] = true
	}

	userIDs := []string{}
	for userID := range userMap {
		userIDs = append(userIDs, userID)
	}
	return userIDs
}

func (pa *PluginAdapter) sendMessageToAllSkipCluster(payload map[string]interface{}) {
	// Empty &mmModel.WebsocketBroadcast will send to all users
	pa.api.PublishWebSocketEvent(websocketActionUpdateConfig, payload, &mmModel.WebsocketBroadcast{})
}

func (pa *PluginAdapter) sendMessageToAll(payload map[string]interface{}) {
	go func() {
		clusterMessage := &ClusterMessage{Payload: payload}
		pa.sendMessageToCluster("websocket_message", clusterMessage)
	}()

	pa.sendMessageToAllSkipCluster(payload)
}

func (pa *PluginAdapter) BroadcastConfigChange(pluginConfig model.ClientConfig) {
	pa.sendMessageToAll(utils.StructToMap(pluginConfig))
}

// sendWorkspaceMessageSkipCluster sends a message to all the users
// with a websocket client connected to.
func (pa *PluginAdapter) sendWorkspaceMessageSkipCluster(workspaceID string, payload map[string]interface{}) {
	userIDs := pa.getUserIDsForWorkspace(workspaceID)
	for _, userID := range userIDs {
		pa.api.PublishWebSocketEvent(websocketActionUpdateBlock, payload, &mmModel.WebsocketBroadcast{UserId: userID})
	}
}

// sendWorkspaceMessage sends and propagates a message that is aimed
// for all the users that are subscribed to a given workspace.
func (pa *PluginAdapter) sendWorkspaceMessage(workspaceID string, payload map[string]interface{}) {
	go func() {
		clusterMessage := &ClusterMessage{
			WorkspaceID: workspaceID,
			Payload:     payload,
		}

		pa.sendMessageToCluster("websocket_message", clusterMessage)
	}()

	pa.sendWorkspaceMessageSkipCluster(workspaceID, payload)
}

func (pa *PluginAdapter) BroadcastBlockChange(workspaceID string, block model.Block) {
	pa.api.LogInfo("BroadcastingBlockChange",
		"workspaceID", workspaceID,
		"blockID", block.ID,
	)

	message := UpdateMsg{
		Action: websocketActionUpdateBlock,
		Block:  block,
	}

	pa.sendWorkspaceMessage(workspaceID, utils.StructToMap(message))
}

func (pa *PluginAdapter) BroadcastBlockDelete(workspaceID, blockID, parentID string) {
	now := time.Now().Unix()
	block := model.Block{}
	block.ID = blockID
	block.ParentID = parentID
	block.UpdateAt = now
	block.DeleteAt = now

	pa.BroadcastBlockChange(workspaceID, block)
}
