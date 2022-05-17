package ws

import (
	"github.com/mattermost/focalboard/server/model"
)

// UpdateMsg is sent on block updates.
type UpdateMsg struct {
	Action string      `json:"action"`
	Block  model.Block `json:"block"`
}

// UpdateSubscription is sent on subscription updates.
type UpdateSubscription struct {
	Action       string              `json:"action"`
	Subscription *model.Subscription `json:"subscription"`
}

// UpdateClientConfig is sent on block updates.
type UpdateClientConfig struct {
	Action       string             `json:"action"`
	ClientConfig model.ClientConfig `json:"clientconfig"`
}

// UpdateClientConfig is sent on block updates.
type UpdateCardLimitTimestamp struct {
	Action       string             `json:"action"`
	Timestamp int64 `json:"timestamp"`
}

// WebsocketCommand is an incoming command from the client.
type WebsocketCommand struct {
	Action      string   `json:"action"`
	WorkspaceID string   `json:"workspaceId"`
	Token       string   `json:"token"`
	ReadToken   string   `json:"readToken"`
	BlockIDs    []string `json:"blockIds"`
}
