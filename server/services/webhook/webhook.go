package webhook

import (
	"bytes"
	"encoding/json"
	"log"
	"net/http"

	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/services/config"
)

// NotifyUpdate calls webhooks
func (wh *Client) NotifyUpdate(block model.Block) {
	if len(wh.config.WebhookUpdate) < 1 {
		return
	}

	json, err := json.Marshal(block)
	if err != nil {
		log.Fatal("NotifyUpdate: json.Marshal", err)
	}
	for _, url := range wh.config.WebhookUpdate {
		http.Post(url, "application/json", bytes.NewBuffer(json))
		log.Printf("webhook.NotifyUpdate: %s", url)
	}
}

// Client is a webhook client
type Client struct {
	config *config.Configuration
}

// NewClient creates a new Client
func NewClient(config *config.Configuration) *Client {
	return &Client{
		config: config,
	}
}
