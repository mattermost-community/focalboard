//go:generate mockgen --build_flags=--mod=mod -destination=mockstore/mockstore.go -package mockstore . Store
//go:generate go run ./generators/main.go
package store

import (
	"errors"
	"fmt"
	"time"

	"github.com/mattermost/focalboard/server/model"
)

// Conainer represents a container in a store
// Using a struct to make extending this easier in the future.
type Container struct {
	WorkspaceID string
}

// Store represents the abstraction of the data storage.
type Store interface {
	GetBlocksWithParentAndType(c Container, parentID string, blockType string) ([]model.Block, error)
	GetBlocksWithParent(c Container, parentID string) ([]model.Block, error)
	GetBlocksWithRootID(c Container, rootID string) ([]model.Block, error)
	GetBlocksWithType(c Container, blockType string) ([]model.Block, error)
	GetSubTree2(c Container, blockID string, opts model.QuerySubtreeOptions) ([]model.Block, error)
	GetSubTree3(c Container, blockID string, opts model.QuerySubtreeOptions) ([]model.Block, error)
	GetAllBlocks(c Container) ([]model.Block, error)
	GetRootID(c Container, blockID string) (string, error)
	GetParentID(c Container, blockID string) (string, error)
	// @withTransaction
	InsertBlock(c Container, block *model.Block, userID string) error
	// @withTransaction
	InsertBlocks(c Container, blocks []model.Block, userID string) error
	// @withTransaction
	DeleteBlock(c Container, blockID string, modifiedBy string) error
	// @withTransaction
	UndeleteBlock(c Container, blockID string, modifiedBy string) error
	GetBlockCountsByType() (map[string]int64, error)
	GetBlock(c Container, blockID string) (*model.Block, error)
	// @withTransaction
	PatchBlock(c Container, blockID string, blockPatch *model.BlockPatch, userID string) error
	GetBlockHistory(c Container, blockID string, opts model.QueryBlockHistoryOptions) ([]model.Block, error)
	GetBoardAndCardByID(c Container, blockID string) (board *model.Block, card *model.Block, err error)
	GetBoardAndCard(c Container, block *model.Block) (board *model.Block, card *model.Block, err error)
	// @withTransaction
	PatchBlocks(c Container, blockPatches *model.BlockPatchBatch, userID string) error

	Shutdown() error

	GetSystemSetting(key string) (string, error)
	GetSystemSettings() (map[string]string, error)
	SetSystemSetting(key, value string) error

	GetRegisteredUserCount() (int, error)
	GetUserByID(userID string) (*model.User, error)
	GetUserByEmail(email string) (*model.User, error)
	GetUserByUsername(username string) (*model.User, error)
	CreateUser(user *model.User) error
	UpdateUser(user *model.User) error
	UpdateUserPassword(username, password string) error
	UpdateUserPasswordByID(userID, password string) error
	GetUsersByWorkspace(workspaceID string) ([]*model.User, error)
	PatchUserProps(userID string, patch model.UserPropPatch) error

	GetActiveUserCount(updatedSecondsAgo int64) (int, error)
	GetSession(token string, expireTime int64) (*model.Session, error)
	CreateSession(session *model.Session) error
	RefreshSession(session *model.Session) error
	UpdateSession(session *model.Session) error
	DeleteSession(sessionID string) error
	CleanUpSessions(expireTime int64) error

	UpsertSharing(c Container, sharing model.Sharing) error
	GetSharing(c Container, rootID string) (*model.Sharing, error)

	UpsertWorkspaceSignupToken(workspace model.Workspace) error
	UpsertWorkspaceSettings(workspace model.Workspace) error
	GetWorkspace(ID string) (*model.Workspace, error)
	HasWorkspaceAccess(userID string, workspaceID string) (bool, error)
	GetWorkspaceCount() (int64, error)
	GetUserWorkspaces(userID string) ([]model.UserWorkspace, error)
	CreatePrivateWorkspace(userID string) (string, error)

	CreateSubscription(c Container, sub *model.Subscription) (*model.Subscription, error)
	DeleteSubscription(c Container, blockID string, subscriberID string) error
	GetSubscription(c Container, blockID string, subscriberID string) (*model.Subscription, error)
	GetSubscriptions(c Container, subscriberID string) ([]*model.Subscription, error)
	GetSubscribersForBlock(c Container, blockID string) ([]*model.Subscriber, error)
	GetSubscribersCountForBlock(c Container, blockID string) (int, error)
	UpdateSubscribersNotifiedAt(c Container, blockID string, notifiedAt int64) error

	UpsertNotificationHint(hint *model.NotificationHint, notificationFreq time.Duration) (*model.NotificationHint, error)
	DeleteNotificationHint(c Container, blockID string) error
	GetNotificationHint(c Container, blockID string) (*model.NotificationHint, error)
	GetNextNotificationHint(remove bool) (*model.NotificationHint, error)

	RemoveDefaultTemplates(blocks []model.Block) error
	GetDefaultTemplateBlocks() ([]model.Block, error)

	DBType() string

	IsErrNotFound(err error) bool
}

// ErrNotFound is an error type that can be returned by store APIs when a query unexpectedly fetches no records.
type ErrNotFound struct {
	resource string
}

// NewErrNotFound creates a new ErrNotFound instance.
func NewErrNotFound(resource string) *ErrNotFound {
	return &ErrNotFound{
		resource: resource,
	}
}

func (nf *ErrNotFound) Error() string {
	return fmt.Sprintf("{%s} not found", nf.resource)
}

// IsErrNotFound returns true if `err` is or wraps a ErrNotFound.
func IsErrNotFound(err error) bool {
	if err == nil {
		return false
	}

	var nf *ErrNotFound
	return errors.As(err, &nf)
}
