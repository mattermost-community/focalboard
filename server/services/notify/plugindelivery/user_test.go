// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package plugindelivery

import (
	"reflect"
	"testing"

	mm_model "github.com/mattermost/mattermost-server/v6/model"
)

var (
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

	mockUsers = map[string]*mm_model.User{
		"dlauder":      user1,
		"steve.mqueen": user2,
		"bart_":        user3,
	}
)

func Test_userFromUsername(t *testing.T) {
	delivery := newPlugAPIMock(mockUsers)

	tests := []struct {
		name    string
		uname   string
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
			got, err := userFromUsername(delivery, tt.uname)
			if (err != nil) != tt.wantErr {
				t.Errorf("userFromUsername() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !reflect.DeepEqual(got, tt.want) {
				t.Errorf("userFromUsername() = %v, want %v", got, tt.want)
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
		return nil, ErrNotFound{}
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
	return nil, nil
}

type ErrNotFound struct{}

func (e ErrNotFound) Error() string {
	return "not found"
}
