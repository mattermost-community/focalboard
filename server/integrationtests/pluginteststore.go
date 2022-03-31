package integrationtests

import (
	"fmt"
	"strings"

	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/services/store"
)

type PluginTestStore struct {
	store.Store
	users     map[string]*model.User
	testTeam  *model.Team
	otherTeam *model.Team
}

func NewPluginTestStore(innerStore store.Store) *PluginTestStore {
	return &PluginTestStore{
		Store: innerStore,
		users: map[string]*model.User{
			"no-team-member": {ID: "no-team-member", Username: "no-team-member", Email: "no-team-member@sample.com", CreateAt: model.GetMillis(), UpdateAt: model.GetMillis()},
			"team-member":    {ID: "team-member", Username: "team-member", Email: "team-member@sample.com", CreateAt: model.GetMillis(), UpdateAt: model.GetMillis()},
			"viewer":         {ID: "viewer", Username: "viewer", Email: "viewer@sample.com", CreateAt: model.GetMillis(), UpdateAt: model.GetMillis()},
			"commenter":      {ID: "commenter", Username: "commenter", Email: "commenter@sample.com", CreateAt: model.GetMillis(), UpdateAt: model.GetMillis()},
			"editor":         {ID: "editor", Username: "editor", Email: "editor@sample.com", CreateAt: model.GetMillis(), UpdateAt: model.GetMillis()},
			"admin":          {ID: "admin", Username: "admin", Email: "admin@sample.com", CreateAt: model.GetMillis(), UpdateAt: model.GetMillis()},
		},
		testTeam:  &model.Team{ID: "other-team", Title: "Other Team"},
		otherTeam: &model.Team{ID: "test-team", Title: "Test Team"},
	}
}

func (s *PluginTestStore) GetTeam(id string) (*model.Team, error) {
	if id == "0" {
		return &model.Team{ID: "0", Title: "Base Team"}, nil
	} else if id == "other-team" {
		return &model.Team{ID: "other-team", Title: "Other Team"}, nil
	} else if id == "test-team" {
		return &model.Team{ID: "test-team", Title: "Test Team"}, nil
	}
	return nil, fmt.Errorf("Team id %s not found", id)
}

func (s *PluginTestStore) GetTeamsForUser(userID string) ([]*model.Team, error) {
	switch userID {
	case "no-team-member":
		return []*model.Team{s.otherTeam}, nil
	case "team-member":
		return []*model.Team{s.testTeam}, nil
	case "viewer":
		return []*model.Team{s.testTeam}, nil
	case "commenter":
		return []*model.Team{s.testTeam}, nil
	case "editor":
		return []*model.Team{s.testTeam}, nil
	case "admin":
		return []*model.Team{s.testTeam}, nil
	}
	return nil, fmt.Errorf("UserID %s not found", userID)
}

func (s *PluginTestStore) GetUserByID(userID string) (*model.User, error) {
	user := s.users[userID]
	if user == nil {
		return nil, fmt.Errorf("UserID %s not found", userID)
	}
	return user, nil
}

func (s *PluginTestStore) GetUserByEmail(email string) (*model.User, error) {
	for _, user := range s.users {
		if user.Email == email {
			return user, nil
		}
	}
	return nil, fmt.Errorf("User email %s not found", email)
}

func (s *PluginTestStore) GetUserByUsername(username string) (*model.User, error) {
	for _, user := range s.users {
		if user.Username == username {
			return user, nil
		}
	}
	return nil, fmt.Errorf("User username %s not found", username)
}

func (s *PluginTestStore) PatchUserProps(userID string, patch model.UserPropPatch) error {
	user, err := s.GetUserByID(userID)
	if err != nil {
		return err
	}

	props := user.Props

	for _, key := range patch.DeletedFields {
		delete(props, key)
	}

	for key, value := range patch.UpdatedFields {
		props[key] = value
	}

	user.Props = props

	return nil
}

func (s *PluginTestStore) GetUsersByTeam(teamID string) ([]*model.User, error) {
	if teamID == s.testTeam.ID {
		return []*model.User{
			s.users["team-member"],
			s.users["viewer"],
			s.users["commenter"],
			s.users["editor"],
			s.users["admin"],
		}, nil
	} else if teamID == s.otherTeam.ID {
		return []*model.User{
			s.users["no-team-member"],
		}, nil
	}
	return nil, fmt.Errorf("TeamID %s not found", teamID)
}

func (s *PluginTestStore) SearchUsersByTeam(teamID string, searchQuery string) ([]*model.User, error) {
	users := []*model.User{}
	for _, user := range s.users {
		if strings.Contains(user.Username, searchQuery) {
			users = append(users, user)
		}
	}
	return users, nil
}
