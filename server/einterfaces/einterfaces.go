package einterfaces

import (
	"github.com/gorilla/mux"
	"github.com/mattermost/focalboard/server/model"
)

type MattermostAuth interface {
	RegisterRoutes(*mux.Router)
	DoesUserHaveWorkspaceAccess(session *model.Session, workspaceID string) bool
	GetWorkspace(session *model.Session, workspaceID string) *model.Workspace
}

type MattermostAuthParameters struct {
	ServerRoot      string
	MattermostURL   string
	ClientID        string
	ClientSecret    string
	UseSecureCookie bool
}

type MattermostAuthStore interface {
	GetUserById(userID string) (*model.User, error)
	CreateUser(user *model.User) error
	CreateSession(session *model.Session) error
}
