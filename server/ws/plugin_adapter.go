package ws

import (
	"encoding/json"
	"fmt"
	"strings"
	"sync"
	"time"

	"github.com/mattermost/focalboard/server/auth"
	"github.com/mattermost/focalboard/server/model"
	mmModel "github.com/mattermost/mattermost-server/v6/model"
	"github.com/mattermost/mattermost-server/v6/plugin"
)

const websocketMessagePrefix = "custom_focalboard_"

var errMissingTeamInCommand = fmt.Errorf("command doesn't contain teamId")

func structToMap(v interface{}) (m map[string]interface{}) {
	b, _ := json.Marshal(v)
	_ = json.Unmarshal(b, &m)
	return
}

type PluginAdapterClient struct {
	webConnID string
	userID    string
	teams     []string
	blocks    []string
}

func (pac *PluginAdapterClient) isSubscribedToTeam(teamID string) bool {
	for _, id := range pac.teams {
		if id == teamID {
			return true
		}
	}

	return false
}

//nolint:unused
func (pac *PluginAdapterClient) isSubscribedToBlock(blockID string) bool {
	for _, id := range pac.blocks {
		if id == blockID {
			return true
		}
	}

	return false
}

type PluginAdapter struct {
	api  plugin.API
	auth *auth.Auth

	listeners        map[string]*PluginAdapterClient
	listenersByTeam  map[string][]*PluginAdapterClient
	listenersByBlock map[string][]*PluginAdapterClient
	mu               sync.RWMutex
}

func NewPluginAdapter(api plugin.API, auth *auth.Auth) *PluginAdapter {
	return &PluginAdapter{
		api:              api,
		auth:             auth,
		listeners:        make(map[string]*PluginAdapterClient),
		listenersByTeam:  make(map[string][]*PluginAdapterClient),
		listenersByBlock: make(map[string][]*PluginAdapterClient),
		mu:               sync.RWMutex{},
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

	// team subscriptions
	for _, team := range pac.teams {
		pa.removeListenerFromTeam(pac, team)
	}

	// block subscriptions
	for _, block := range pac.blocks {
		pa.removeListenerFromBlock(pac, block)
	}

	delete(pa.listeners, pac.webConnID)
}

func (pa *PluginAdapter) removeListenerFromTeam(pac *PluginAdapterClient, teamID string) {
	newTeamListeners := []*PluginAdapterClient{}
	for _, listener := range pa.listenersByTeam[teamID] {
		if listener.webConnID != pac.webConnID {
			newTeamListeners = append(newTeamListeners, listener)
		}
	}
	pa.listenersByTeam[teamID] = newTeamListeners

	newClientTeams := []string{}
	for _, id := range pac.teams {
		if id != teamID {
			newClientTeams = append(newClientTeams, id)
		}
	}
	pac.teams = newClientTeams
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

func (pa *PluginAdapter) subscribeListenerToTeam(pac *PluginAdapterClient, teamID string) {
	if pac.isSubscribedToTeam(teamID) {
		return
	}

	pa.mu.Lock()
	defer pa.mu.Unlock()

	pa.listenersByTeam[teamID] = append(pa.listenersByTeam[teamID], pac)
	pac.teams = append(pac.teams, teamID)
}

func (pa *PluginAdapter) unsubscribeListenerFromTeam(pac *PluginAdapterClient, teamID string) {
	if !pac.isSubscribedToTeam(teamID) {
		return
	}

	pa.mu.Lock()
	defer pa.mu.Unlock()

	pa.removeListenerFromTeam(pac, teamID)
}

//nolint:unused
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
		webConnID: webConnID,
		userID:    userID,
		teams:     []string{},
		blocks:    []string{},
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

	if teamID, ok := req.Data["teamId"]; ok {
		c.TeamID = teamID.(string)
	} else {
		return nil, errMissingTeamInCommand
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
			"teamID", command.TeamID,
		)

	case websocketActionSubscribeTeam:
		pa.api.LogDebug(`Command: SUBSCRIBE_TEAM`,
			"webConnID", webConnID,
			"userID", userID,
			"teamID", command.TeamID,
		)

		if !pa.auth.DoesUserHaveTeamAccess(userID, command.TeamID) {
			return
		}

		pa.subscribeListenerToTeam(pac, command.TeamID)
	case websocketActionUnsubscribeTeam:
		pa.api.LogDebug(`Command: UNSUBSCRIBE_TEAM`,
			"webConnID", webConnID,
			"userID", userID,
			"teamID", command.TeamID,
		)

		pa.unsubscribeListenerFromTeam(pac, command.TeamID)
	}
}

func (pa *PluginAdapter) getUserIDsForTeam(teamID string) []string {
	userMap := map[string]bool{}
	for _, pac := range pa.listenersByTeam[teamID] {
		userMap[pac.userID] = true
	}

	userIDs := []string{}
	for userID := range userMap {
		userIDs = append(userIDs, userID)
	}
	return userIDs
}

func (pa *PluginAdapter) BroadcastBlockChange(teamID string, block model.Block) {
	pa.api.LogInfo("BroadcastingBlockChange",
		"teamID", teamID,
		"blockID", block.ID,
	)

	message := UpdateMsg{
		Action: websocketActionUpdateBlock,
		Block:  block,
	}

	userIDs := pa.getUserIDsForTeam(teamID)
	for _, userID := range userIDs {
		pa.api.PublishWebSocketEvent(websocketActionUpdateBlock, structToMap(message), &mmModel.WebsocketBroadcast{UserId: userID})
	}
}

func (pa *PluginAdapter) BroadcastBlockDelete(teamID, blockID, parentID string) {
	now := time.Now().Unix()
	block := model.Block{}
	block.ID = blockID
	block.ParentID = parentID
	block.UpdateAt = now
	block.DeleteAt = now

	pa.BroadcastBlockChange(teamID, block)
}
