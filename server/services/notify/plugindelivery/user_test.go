// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package plugindelivery

import (
	"reflect"
	"testing"

	"github.com/mattermost/focalboard/server/model"

	mm_model "github.com/mattermost/mattermost-server/v6/model"
)

var (
	defTeamID = mm_model.NewId()

	user1 = &mm_model.User{
		Id:       mm_model.NewId(),
		Username: "dlauder",
	}
	user2 = &mm_model.User{
		Id:       mm_model.NewId(),
		Username: "steve.mqueen",
	}
	user3 = &mm_model.User{
		Id:       mm_model.NewId(),
		Username: "bart_",
	}
	user4 = &mm_model.User{
		Id:       mm_model.NewId(),
		Username: "missing_",
	}
	user5 = &mm_model.User{
		Id:       mm_model.NewId(),
		Username: "wrong_team",
	}

	mockUsers = map[string]*mm_model.User{
		"dlauder":      user1,
		"steve.mqueen": user2,
		"bart_":        user3,
		"wrong_team":   user5,
	}
)

func Test_userByUsername(t *testing.T) {
	pluginAPI := newPlugAPIMock(mockUsers)
	delivery := New("bot_id", "server_root", pluginAPI)

	tests := []struct {
		name    string
		uname   string
		teamID  string
		want    *mm_model.User
		wantErr bool
	}{
		{name: "user1", uname: user1.Username, want: user1, wantErr: false},
		{name: "user1 with period", uname: user1.Username + ".", want: user1, wantErr: false},
		{name: "user1 with period plus more", uname: user1.Username + ". ", want: user1, wantErr: false},
		{name: "user2 with periods", uname: user2.Username + "...", want: user2, wantErr: false},
		{name: "user2 with underscore", uname: user2.Username + "_", want: user2, wantErr: false},
		{name: "user2 with hyphen plus more", uname: user2.Username + "- ", want: user2, wantErr: false},
		{name: "user2 with hyphen plus all", uname: user2.Username + ".-_ ", want: user2, wantErr: false},
		{name: "user3 with underscore", uname: user3.Username + "_", want: user3, wantErr: false},
		{name: "user4 missing", uname: user4.Username, want: nil, wantErr: true},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := delivery.UserByUsername(tt.uname)
			if (err != nil) != tt.wantErr {
				t.Errorf("userByUsername() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !reflect.DeepEqual(got, tt.want) {
				t.Errorf("userByUsername()\ngot:\n%v\nwant:\n%v\n", got, tt.want)
			}
		})
	}
}

type pluginAPIMock struct {
	users map[string]*mm_model.User
}

func newPlugAPIMock(users map[string]*mm_model.User) pluginAPIMock {
	return pluginAPIMock{
		users: users,
	}
}

func (m pluginAPIMock) GetUserByUsername(name string) (*mm_model.User, error) {
	user, ok := m.users[name]
	if !ok {
		return nil, model.NewErrNotFound(name)
	}
	return user, nil
}

func (m pluginAPIMock) GetDirectChannel(userID1, userID2 string) (*mm_model.Channel, error) {
	return nil, nil
}

func (m pluginAPIMock) CreatePost(post *mm_model.Post) error {
	return nil
}

func (m pluginAPIMock) GetUserByID(userID string) (*mm_model.User, error) {
	for _, user := range m.users {
		if user.Id == userID {
			return user, nil
		}
	}
	return nil, model.NewErrNotFound(userID)
}

func (m pluginAPIMock) GetTeamMember(teamID string, userID string) (*mm_model.TeamMember, error) {
	user, err := m.GetUserByID(userID)
	if err != nil {
		return nil, err
	}

	if teamID != defTeamID {
		return nil, model.NewErrNotFound(teamID)
	}

	member := &mm_model.TeamMember{
		UserId: user.Id,
		TeamId: teamID,
	}
	return member, nil
}

func (m pluginAPIMock) GetChannelByID(channelID string) (*mm_model.Channel, error) {
	return nil, model.NewErrNotFound(channelID)
}

func (m pluginAPIMock) GetChannelMember(channelID string, userID string) (*mm_model.ChannelMember, error) {
	return nil, model.NewErrNotFound(userID)
}

func (m pluginAPIMock) CreateMember(teamID string, userID string) (*mm_model.TeamMember, error) {
	member := &mm_model.TeamMember{
		UserId: userID,
		TeamId: teamID,
	}
	return member, nil
}
