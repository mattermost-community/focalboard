// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package notifymentions

import "github.com/mattermost/mattermost-server/v6/model"

type Delivery interface {

	// GetDirectChannel gets a direct message channel.
	// If the channel does not exist it will create it.
	GetDirectChannel(userID1, userID2 string) (*model.Channel, error)

	// CreatePost creates a post.
	CreatePost(post *model.Post) error

	// GetUserByIS gets a user by their ID.
	GetUserByID(userID string) (*model.User, error)

	// GetUserByUsername gets a user by their username.
	GetUserByUsername(name string) (*model.User, error)
}
