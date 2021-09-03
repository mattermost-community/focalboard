// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package notifymentions

import (
	"reflect"
	"testing"

	mm_model "github.com/mattermost/mattermost-server/v6/model"
	mm_store "github.com/mattermost/mattermost-server/v6/store"
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

	mockUsers = map[string]*mm_model.User{
		"dlauder":      user1,
		"steve.mqueen": user2,
		"bart_":        user3,
	}
)

func Test_userFromUsername(t *testing.T) {
	delivery := newDeliveryMock(mockUsers)

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

type deliveryMock struct {
	users map[string]*mm_model.User
}

func newDeliveryMock(users map[string]*mm_model.User) deliveryMock {
	return deliveryMock{
		users: users,
	}
}

func (dm deliveryMock) GetUserByUsername(name string) (*mm_model.User, error) {
	user, ok := dm.users[name]
	if !ok {
		return nil, &mm_store.ErrNotFound{
			ID: name,
		}
	}
	return user, nil
}

func (dm deliveryMock) GetDirectChannel(userID1, userID2 string) (*mm_model.Channel, error) {
	return nil, nil
}

func (dm deliveryMock) CreatePost(post *mm_model.Post) error {
	return nil
}

func (dm deliveryMock) GetUserByID(userID string) (*mm_model.User, error) {
	return nil, nil
}
