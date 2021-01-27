//go:generate mockgen -destination=mockstore/mockstore.go -package mockstore . Store
package store

import "github.com/mattermost/focalboard/server/model"

// Store represents the abstraction of the data storage.
type Store interface {
	GetBlocksWithParentAndType(parentID string, blockType string) ([]model.Block, error)
	GetBlocksWithParent(parentID string) ([]model.Block, error)
	GetBlocksWithType(blockType string) ([]model.Block, error)
	GetSubTree2(blockID string) ([]model.Block, error)
	GetSubTree3(blockID string) ([]model.Block, error)
	GetAllBlocks() ([]model.Block, error)
	GetRootID(blockID string) (string, error)
	GetParentID(blockID string) (string, error)
	InsertBlock(block model.Block) error
	DeleteBlock(blockID string, modifiedBy string) error

	Shutdown() error

	GetSystemSettings() (map[string]string, error)
	SetSystemSetting(key string, value string) error

	GetRegisteredUserCount() (int, error)
	GetUserById(userID string) (*model.User, error)
	GetUserByEmail(email string) (*model.User, error)
	GetUserByUsername(username string) (*model.User, error)
	CreateUser(user *model.User) error
	UpdateUser(user *model.User) error
	UpdateUserPassword(username string, password string) error
	UpdateUserPasswordByID(userID string, password string) error

	GetActiveUserCount(updatedSecondsAgo int64) (int, error)
	GetSession(token string, expireTime int64) (*model.Session, error)
	CreateSession(session *model.Session) error
	RefreshSession(session *model.Session) error
	UpdateSession(session *model.Session) error
	DeleteSession(sessionId string) error
	CleanUpSessions(expireTime int64) error

	UpsertSharing(sharing model.Sharing) error
	GetSharing(rootID string) (*model.Sharing, error)

	UpsertWorkspaceSignupToken(workspace model.Workspace) error
	UpsertWorkspaceSettings(workspace model.Workspace) error
	GetWorkspace(ID string) (*model.Workspace, error)
}
