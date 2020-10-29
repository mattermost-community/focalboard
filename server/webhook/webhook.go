package webhook

import (
	"bytes"
	"encoding/json"
	"log"
	"net/http"

	"github.com/mattermost/mattermost-octo-tasks/server/model"
	"github.com/mattermost/mattermost-octo-tasks/server/services/config"
)

// NotifyUpdate calls webhooks
func (wh *WebhookClient) NotifyUpdate(block model.Block) {
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

// WebhookClient is a webhook client
type WebhookClient struct {
	config *config.Configuration
}

// New creates a new WebhookClient
func New(config *config.Configuration) *WebhookClient {
	return &WebhookClient{
		config: config,
	}
}
