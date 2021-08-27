package ws

import (
	"github.com/mattermost/focalboard/server/model"
)

const (
	websocketActionAuth              = "AUTH"
	websocketActionSubscribeTeam     = "SUBSCRIBE_TEAM"
	websocketActionUnsubscribeTeam   = "UNSUBSCRIBE_TEAM"
	websocketActionSubscribeBlocks   = "SUBSCRIBE_BLOCKS"
	websocketActionUnsubscribeBlocks = "UNSUBSCRIBE_BLOCKS"
	websocketActionUpdateBlock       = "UPDATE_BLOCK"
)

type Adapter interface {
	BroadcastBlockChange(teamID string, block model.Block)
	BroadcastBlockDelete(teamID, blockID, parentID string)
}
