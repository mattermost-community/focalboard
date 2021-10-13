//go:generate mockgen --build_flags=--mod=mod -destination=mocks/mockpluginapi.go -package mocks github.com/mattermost/mattermost-server/v6/plugin API
package ws

import (
	"fmt"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	"github.com/mattermost/focalboard/server/auth"
	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/utils"

	mmModel "github.com/mattermost/mattermost-server/v6/model"
	"github.com/mattermost/mattermost-server/v6/plugin"
)

const websocketMessagePrefix = "custom_focalboard_"

var errMissingWorkspaceInCommand = fmt.Errorf("command doesn't contain workspaceId")

type PluginAdapterInterface interface {
	OnWebSocketConnect(webConnID, userID string)
	OnWebSocketDisconnect(webConnID, userID string)
	WebSocketMessageHasBeenPosted(webConnID, userID string, req *mmModel.WebSocketRequest)
	BroadcastConfigChange(clientConfig model.ClientConfig)
	BroadcastBlockChange(workspaceID string, block model.Block)
	BroadcastBlockDelete(workspaceID, blockID, parentID string)
	HandleClusterEvent(ev mmModel.PluginClusterEvent)
}

type PluginAdapter struct {
	api            plugin.API
	auth           auth.AuthInterface
	staleThreshold time.Duration

	listenersMU       sync.RWMutex
	listeners         map[string]*PluginAdapterClient
	listenersByUserID map[string][]*PluginAdapterClient

	subscriptionsMU      sync.RWMutex
	listenersByWorkspace map[string][]*PluginAdapterClient
	listenersByBlock     map[string][]*PluginAdapterClient
}

func NewPluginAdapter(api plugin.API, auth auth.AuthInterface) *PluginAdapter {
	return &PluginAdapter{
		api:                  api,
		auth:                 auth,
		staleThreshold:       5 * time.Minute,
		listeners:            make(map[string]*PluginAdapterClient),
		listenersByUserID:    make(map[string][]*PluginAdapterClient),
		listenersByWorkspace: make(map[string][]*PluginAdapterClient),
		listenersByBlock:     make(map[string][]*PluginAdapterClient),
		listenersMU:          sync.RWMutex{},
		subscriptionsMU:      sync.RWMutex{},
	}
}

func (pa *PluginAdapter) GetListenerByWebConnID(webConnID string) (pac *PluginAdapterClient, ok bool) {
	pa.listenersMU.RLock()
	defer pa.listenersMU.RUnlock()

	pac, ok = pa.listeners[webConnID]
	return
}

func (pa *PluginAdapter) GetListenersByUserID(userID string) []*PluginAdapterClient {
	pa.listenersMU.RLock()
	defer pa.listenersMU.RUnlock()

	return pa.listenersByUserID[userID]
}

func (pa *PluginAdapter) GetListenersByWorkspace(workspaceID string) []*PluginAdapterClient {
	pa.subscriptionsMU.RLock()
	defer pa.subscriptionsMU.RUnlock()

	return pa.listenersByWorkspace[workspaceID]
}

func (pa *PluginAdapter) GetListenersByBlock(blockID string) []*PluginAdapterClient {
	pa.subscriptionsMU.RLock()
	defer pa.subscriptionsMU.RUnlock()

	return pa.listenersByBlock[blockID]
}

func (pa *PluginAdapter) addListener(pac *PluginAdapterClient) {
	pa.listenersMU.Lock()
	defer pa.listenersMU.Unlock()

	pa.listeners[pac.webConnID] = pac
	pa.listenersByUserID[pac.userID] = append(pa.listenersByUserID[pac.userID], pac)
}

func (pa *PluginAdapter) removeListener(pac *PluginAdapterClient) {
	pa.listenersMU.Lock()
	defer pa.listenersMU.Unlock()

	// workspace subscriptions
	for _, workspace := range pac.workspaces {
		pa.removeListenerFromWorkspace(pac, workspace)
	}

	// block subscriptions
	for _, block := range pac.blocks {
		pa.removeListenerFromBlock(pac, block)
	}

	// user ID list
	newUserListeners := []*PluginAdapterClient{}
	for _, listener := range pa.listenersByUserID[pac.userID] {
		if listener.webConnID != pac.webConnID {
			newUserListeners = append(newUserListeners, listener)
		}
	}
	pa.listenersByUserID[pac.userID] = newUserListeners

	delete(pa.listeners, pac.webConnID)
}

func (pa *PluginAdapter) removeExpiredForUserID(userID string) {
	for _, pac := range pa.GetListenersByUserID(userID) {
		if !pac.isActive() && pac.hasExpired(pa.staleThreshold) {
			pa.removeListener(pac)
		}
	}
}

func (pa *PluginAdapter) removeListenerFromWorkspace(pac *PluginAdapterClient, workspaceID string) {
	newWorkspaceListeners := []*PluginAdapterClient{}
	for _, listener := range pa.GetListenersByWorkspace(workspaceID) {
		if listener.webConnID != pac.webConnID {
			newWorkspaceListeners = append(newWorkspaceListeners, listener)
		}
	}
	pa.subscriptionsMU.Lock()
	pa.listenersByWorkspace[workspaceID] = newWorkspaceListeners
	pa.subscriptionsMU.Unlock()

	pac.unsubscribeFromWorkspace(workspaceID)
}

func (pa *PluginAdapter) removeListenerFromBlock(pac *PluginAdapterClient, blockID string) {
	newBlockListeners := []*PluginAdapterClient{}
	for _, listener := range pa.GetListenersByBlock(blockID) {
		if listener.webConnID != pac.webConnID {
			newBlockListeners = append(newBlockListeners, listener)
		}
	}
	pa.subscriptionsMU.Lock()
	pa.listenersByBlock[blockID] = newBlockListeners
	pa.subscriptionsMU.Unlock()

	pac.unsubscribeFromBlock(blockID)
}

func (pa *PluginAdapter) subscribeListenerToWorkspace(pac *PluginAdapterClient, workspaceID string) {
	if pac.isSubscribedToWorkspace(workspaceID) {
		return
	}

	pa.subscriptionsMU.Lock()
	pa.listenersByWorkspace[workspaceID] = append(pa.listenersByWorkspace[workspaceID], pac)
	pa.subscriptionsMU.Unlock()

	pac.subscribeToWorkspace(workspaceID)
}

func (pa *PluginAdapter) unsubscribeListenerFromWorkspace(pac *PluginAdapterClient, workspaceID string) {
	if !pac.isSubscribedToWorkspace(workspaceID) {
		return
	}

	pa.removeListenerFromWorkspace(pac, workspaceID)
}

func (pa *PluginAdapter) getUserIDsForWorkspace(workspaceID string) []string {
	userMap := map[string]bool{}
	for _, pac := range pa.GetListenersByWorkspace(workspaceID) {
		if pac.isActive() {
			userMap[pac.userID] = true
		}
	}

	userIDs := []string{}
	for userID := range userMap {
		userIDs = append(userIDs, userID)
	}
	return userIDs
}

//nolint:unused
func (pa *PluginAdapter) unsubscribeListenerFromBlocks(pac *PluginAdapterClient, blockIDs []string) {
	for _, blockID := range blockIDs {
		if pac.isSubscribedToBlock(blockID) {
			pa.removeListenerFromBlock(pac, blockID)
		}
	}
}

func (pa *PluginAdapter) OnWebSocketConnect(webConnID, userID string) {
	if existingPAC, ok := pa.GetListenerByWebConnID(webConnID); ok {
		pa.api.LogDebug("inactive connection found for webconn, reusing",
			"webConnID", webConnID,
			"userID", userID,
		)
		atomic.StoreInt64(&existingPAC.inactiveAt, 0)
		return
	}

	newPAC := &PluginAdapterClient{
		inactiveAt: 0,
		webConnID:  webConnID,
		userID:     userID,
		workspaces: []string{},
		blocks:     []string{},
	}

	pa.addListener(newPAC)
	pa.removeExpiredForUserID(userID)
}

func (pa *PluginAdapter) OnWebSocketDisconnect(webConnID, userID string) {
	pac, ok := pa.GetListenerByWebConnID(webConnID)
	if !ok {
		pa.api.LogDebug("received a disconnect for an unregistered webconn",
			"webConnID", webConnID,
			"userID", userID,
		)
		return
	}

	atomic.StoreInt64(&pac.inactiveAt, mmModel.GetMillis())
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
	pac, ok := pa.GetListenerByWebConnID(webConnID)
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
	now := utils.GetMillis()
	block := model.Block{}
	block.ID = blockID
	block.ParentID = parentID
	block.UpdateAt = now
	block.DeleteAt = now
	block.WorkspaceID = workspaceID

	pa.BroadcastBlockChange(workspaceID, block)
}
