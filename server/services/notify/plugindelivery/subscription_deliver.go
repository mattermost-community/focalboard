// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package plugindelivery

import (
	"fmt"

	"github.com/wiggin77/merror"

	"github.com/mattermost/mattermost-server/v6/model"
)

// SubscriptionDeliver notifies a user that changes were made to a block they are subscribed to.
func (pd *PluginDelivery) SubscriptionDeliver(subscriberID string, subscriberType string, markdown []string) error {
	user, err := pd.api.GetUserByID(subscriberID)
	if err != nil {
		return fmt.Errorf("cannot find user: %w", err)
	}

	channel, err := pd.api.GetDirectChannel(user.Id, pd.botID)
	if err != nil {
		return fmt.Errorf("cannot get direct channel: %w", err)
	}

	merr := merror.New()

	for _, md := range markdown {
		post := &model.Post{
			UserId:    pd.botID,
			ChannelId: channel.Id,
			Message:   md,
		}

		if err = pd.api.CreatePost(post); err != nil {
			merr.Append(err)
		}
	}

	err = merr.ErrorOrNil()
	if err != nil {
		return fmt.Errorf("cannot deliver all subscription notifications: %w", err)
	}
	return nil
}
