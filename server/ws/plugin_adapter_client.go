package ws

import (
	"sync"
	"sync/atomic"
	"time"

	mmModel "github.com/mattermost/mattermost-server/v6/model"
)

type PluginAdapterClient struct {
	inactiveAt int64
	webConnID  string
	userID     string
	workspaces []string
	blocks     []string
	mu         sync.RWMutex
}

func (pac *PluginAdapterClient) isActive() bool {
	return atomic.LoadInt64(&pac.inactiveAt) == 0
}

func (pac *PluginAdapterClient) hasExpired(threshold time.Duration) bool {
	return !mmModel.GetTimeForMillis(atomic.LoadInt64(&pac.inactiveAt)).Add(threshold).After(time.Now())
}

func (pac *PluginAdapterClient) subscribeToWorkspace(workspaceID string) {
	pac.mu.Lock()
	defer pac.mu.Unlock()

	pac.workspaces = append(pac.workspaces, workspaceID)
}

func (pac *PluginAdapterClient) unsubscribeFromWorkspace(workspaceID string) {
	pac.mu.Lock()
	defer pac.mu.Unlock()

	newClientWorkspaces := []string{}
	for _, id := range pac.workspaces {
		if id != workspaceID {
			newClientWorkspaces = append(newClientWorkspaces, id)
		}
	}
	pac.workspaces = newClientWorkspaces
}

func (pac *PluginAdapterClient) unsubscribeFromBlock(blockID string) {
	pac.mu.Lock()
	defer pac.mu.Unlock()

	newClientBlocks := []string{}
	for _, id := range pac.blocks {
		if id != blockID {
			newClientBlocks = append(newClientBlocks, id)
		}
	}
	pac.blocks = newClientBlocks
}

func (pac *PluginAdapterClient) isSubscribedToWorkspace(workspaceID string) bool {
	pac.mu.RLock()
	defer pac.mu.RUnlock()

	for _, id := range pac.workspaces {
		if id == workspaceID {
			return true
		}
	}

	return false
}

//nolint:unused
func (pac *PluginAdapterClient) isSubscribedToBlock(blockID string) bool {
	pac.mu.RLock()
	defer pac.mu.RUnlock()

	for _, id := range pac.blocks {
		if id == blockID {
			return true
		}
	}

	return false
}
