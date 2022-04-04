package integrationtests

import (
	"errors"
	"strings"

	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/services/store"
)

var errTestStore = errors.New("plugin test store error")

type PluginTestStore struct {
	store.Store
	users     map[string]*model.User
	testTeam  *model.Team
	otherTeam *model.Team
	emptyTeam *model.Team
	baseTeam  *model.Team
}

func NewPluginTestStore(innerStore store.Store) *PluginTestStore {
	return &PluginTestStore{
		Store: innerStore,
		users: map[string]*model.User{
			"no-team-member": {
				ID:       "no-team-member",
				Props:    map[string]interface{}{},
				Username: "no-team-member",
				Email:    "no-team-member@sample.com",
				CreateAt: model.GetMillis(),
				UpdateAt: model.GetMillis(),
			},
			"team-member": {
				ID:       "team-member",
				Props:    map[string]interface{}{},
				Username: "team-member",
				Email:    "team-member@sample.com",
				CreateAt: model.GetMillis(),
				UpdateAt: model.GetMillis(),
			},
			"viewer": {
				ID:       "viewer",
				Props:    map[string]interface{}{},
				Username: "viewer",
				Email:    "viewer@sample.com",
				CreateAt: model.GetMillis(),
				UpdateAt: model.GetMillis(),
			},
			"commenter": {
				ID:       "commenter",
				Props:    map[string]interface{}{},
				Username: "commenter",
				Email:    "commenter@sample.com",
				CreateAt: model.GetMillis(),
				UpdateAt: model.GetMillis(),
			},
			"editor": {
				ID:       "editor",
				Props:    map[string]interface{}{},
				Username: "editor",
				Email:    "editor@sample.com",
				CreateAt: model.GetMillis(),
				UpdateAt: model.GetMillis(),
			},
			"admin": {
				ID:       "admin",
				Props:    map[string]interface{}{},
				Username: "admin",
				Email:    "admin@sample.com",
				CreateAt: model.GetMillis(),
				UpdateAt: model.GetMillis(),
			},
		},
		testTeam:  &model.Team{ID: "test-team", Title: "Test Team"},
		otherTeam: &model.Team{ID: "other-team", Title: "Other Team"},
		emptyTeam: &model.Team{ID: "empty-team", Title: "Empty Team"},
		baseTeam:  &model.Team{ID: "0", Title: "Base Team"},
	}
}

func (s *PluginTestStore) GetTeam(id string) (*model.Team, error) {
	switch id {
	case "0":
		return s.baseTeam, nil
	case "other-team":
		return s.otherTeam, nil
	case "test-team":
		return s.testTeam, nil
	case "empty-team":
		return s.emptyTeam, nil
	}
	return nil, errTestStore
}

func (s *PluginTestStore) GetTeamsForUser(userID string) ([]*model.Team, error) {
	switch userID {
	case "no-team-member":
		return []*model.Team{}, nil
	case "team-member":
		return []*model.Team{s.testTeam, s.otherTeam}, nil
	case "viewer":
		return []*model.Team{s.testTeam, s.otherTeam}, nil
	case "commenter":
		return []*model.Team{s.testTeam, s.otherTeam}, nil
	case "editor":
		return []*model.Team{s.testTeam, s.otherTeam}, nil
	case "admin":
		return []*model.Team{s.testTeam, s.otherTeam}, nil
	}
	return nil, errTestStore
}

func (s *PluginTestStore) GetUserByID(userID string) (*model.User, error) {
	user := s.users[userID]
	if user == nil {
		return nil, errTestStore
	}
	return user, nil
}

func (s *PluginTestStore) GetUserByEmail(email string) (*model.User, error) {
	for _, user := range s.users {
		if user.Email == email {
			return user, nil
		}
	}
	return nil, errTestStore
}

func (s *PluginTestStore) GetUserByUsername(username string) (*model.User, error) {
	for _, user := range s.users {
		if user.Username == username {
			return user, nil
		}
	}
	return nil, errTestStore
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
	switch {
	case teamID == s.testTeam.ID:
		return []*model.User{
			s.users["team-member"],
			s.users["viewer"],
			s.users["commenter"],
			s.users["editor"],
			s.users["admin"],
		}, nil
	case teamID == s.otherTeam.ID:
		return []*model.User{
			s.users["team-member"],
			s.users["viewer"],
			s.users["commenter"],
			s.users["editor"],
			s.users["admin"],
		}, nil
	case teamID == s.emptyTeam.ID:
		return []*model.User{}, nil
	}
	return nil, errTestStore
}

func (s *PluginTestStore) SearchUsersByTeam(teamID string, searchQuery string) ([]*model.User, error) {
	users := []*model.User{}
	teamUsers, err := s.GetUsersByTeam(teamID)
	if err != nil {
		return nil, err
	}

	for _, user := range teamUsers {
		if strings.Contains(user.Username, searchQuery) {
			users = append(users, user)
		}
	}
	return users, nil
}
