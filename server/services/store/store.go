//go:generate mockgen --build_flags=--mod=mod -destination=mockstore/mockstore.go -package mockstore . Store
//go:generate go run ./generators/main.go
package store

import (
	"github.com/mattermost/focalboard/server/model"
)

// Conainer represents a container in a store
// Using a struct to make extending this easier in the future.
type Container struct {
	WorkspaceID string
}

// Store represents the abstraction of the data storage.
type Store interface {
	GetBlocksWithParentAndType(boardID, parentID string, blockType string) ([]model.Block, error)
	GetBlocksWithParent(boardID, parentID string) ([]model.Block, error)
	GetBlocksWithRootID(boardID, rootID string) ([]model.Block, error)
	GetBlocksWithType(boardID, blockType string) ([]model.Block, error)
	GetSubTree2(boardID, blockID string) ([]model.Block, error)
	GetSubTree3(boardID, blockID string) ([]model.Block, error)
	GetBlocksForBoard(boardID string) ([]model.Block, error)
	// @withTransaction
	InsertBlock(block *model.Block, userID string) error
	// @withTransaction
	DeleteBlock(blockID string, modifiedBy string) error
	GetBlockCountsByType() (map[string]int64, error)
	GetBlock(blockID string) (*model.Block, error)
	// @withTransaction
	PatchBlock(blockID string, blockPatch *model.BlockPatch, userID string) error

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
	GetUsersByTeam(teamID string) ([]*model.User, error)

	GetActiveUserCount(updatedSecondsAgo int64) (int, error)
	GetSession(token string, expireTime int64) (*model.Session, error)
	CreateSession(session *model.Session) error
	RefreshSession(session *model.Session) error
	UpdateSession(session *model.Session) error
	DeleteSession(sessionID string) error
	CleanUpSessions(expireTime int64) error

	UpsertSharing(sharing model.Sharing) error
	GetSharing(rootID string) (*model.Sharing, error)

	UpsertTeamSignupToken(team model.Team) error
	UpsertTeamSettings(team model.Team) error
	GetTeam(ID string) (*model.Team, error)
	GetTeamsForUser(userID string) ([]*model.Team, error)
	GetAllTeams() ([]*model.Team, error)
	GetTeamCount() (int64, error)

	InsertBoard(board *model.Board, userID string) (*model.Board, error)
	// @withTransaction
	InsertBoardWithAdmin(board *model.Board, userID string) (*model.Board, *model.BoardMember, error)
	// @withTransaction
	PatchBoard(boardID string, boardPatch *model.BoardPatch, userID string) (*model.Board, error)
	GetBoard(id string) (*model.Board, error)
	GetTeamTemplates(teamID string) ([]*model.Board, error)
	GetBoardsForUserAndTeam(userID, teamID string) ([]*model.Board, error)
	// @withTransaction
	DeleteBoard(boardID, userID string) error

	SaveMember(bm *model.BoardMember) (*model.BoardMember, error)
	DeleteMember(boardID, userID string) error
	GetMemberForBoard(boardID, userID string) (*model.BoardMember, error)
	GetMembersForBoard(boardID string) ([]*model.BoardMember, error)
	SearchBoardsForUserAndTeam(term, userID, teamID string) ([]*model.Board, error)

	// @withTransaction
	CreateBoardsAndBlocksWithAdmin(bab *model.BoardsAndBlocks, userID string) (*model.BoardsAndBlocks, []*model.BoardMember, error)
	// @withTransaction
	CreateBoardsAndBlocks(bab *model.BoardsAndBlocks, userID string) (*model.BoardsAndBlocks, error)
	// @withTransaction
	PatchBoardsAndBlocks(pbab *model.PatchBoardsAndBlocks, userID string) (*model.BoardsAndBlocks, error)
	// @withTransaction
	DeleteBoardsAndBlocks(dbab *model.DeleteBoardsAndBlocks, userID string) error

	GetCategory(id string) (*model.Category, error)
	CreateCategory(category model.Category) error
	UpdateCategory(category model.Category) error
	DeleteCategory(categoryID, userID, teamID string) error

	GetUserCategoryBlocks(userID, teamID string) ([]model.CategoryBlocks, error)
	AddUpdateCategoryBlock(userID, categoryID, blockID string) error
}
