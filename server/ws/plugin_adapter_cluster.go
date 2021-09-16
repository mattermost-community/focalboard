package ws

import (
	"encoding/json"

	mmModel "github.com/mattermost/mattermost-server/v6/model"
)

type ClusterMessage struct {
	WorkspaceID string
	Payload     map[string]interface{}
}

func (pa *PluginAdapter) sendMessageToCluster(id string, clusterMessage *ClusterMessage) {
	b, err := json.Marshal(clusterMessage)
	if err != nil {
		pa.api.LogError("couldn't get JSON bytes from cluster message",
			"id", id,
			"err", err,
		)
		return
	}

	event := mmModel.PluginClusterEvent{Id: id, Data: b}
	opts := mmModel.PluginClusterEventSendOptions{
		SendType: mmModel.PluginClusterEventSendTypeReliable,
	}

	if err := pa.api.PublishPluginClusterEvent(event, opts); err != nil {
		pa.api.LogError("error publishing cluster event",
			"id", id,
			"err", err,
		)
	}
}

func (pa *PluginAdapter) HandleClusterEvent(ev mmModel.PluginClusterEvent) {
	pa.api.LogDebug("received cluster event", "id", ev.Id)

	var clusterMessage ClusterMessage
	if err := json.Unmarshal(ev.Data, &clusterMessage); err != nil {
		pa.api.LogError("cannot unmarshal cluster message data",
			"id", ev.Id,
			"err", err,
		)
		return
	}

	pa.sendWorkspaceMessageSkipCluster(clusterMessage.WorkspaceID, clusterMessage.Payload)
}
