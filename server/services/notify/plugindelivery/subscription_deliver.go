// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package plugindelivery

import (
	"errors"
	"fmt"

	"github.com/mattermost/focalboard/server/model"

	mm_model "github.com/mattermost/mattermost-server/v6/model"
)

var (
	ErrUnsupportedSubscriberType = errors.New("invalid subscriber type")
)

// SubscriptionDeliverSlashAttachments notifies a user that changes were made to a block they are subscribed to.
func (pd *PluginDelivery) SubscriptionDeliverSlackAttachments(workspaceID string, subscriberID string, subscriptionType model.SubscriberType,
	attachments []*mm_model.SlackAttachment) error {
	// check subscriber is member of channel
	_, err := pd.api.GetChannelMember(workspaceID, subscriberID)
	if err != nil {
		if pd.api.IsErrNotFound(err) {
			// subscriber is not a member of the channel; fail silently.
			return nil
		}
		return fmt.Errorf("cannot fetch channel member for user %s: %w", subscriberID, err)
	}

	channelID, err := pd.getDirectChannelID(subscriberID, subscriptionType, pd.botID)
	if err != nil {
		return err
	}

	post := &mm_model.Post{
		UserId:    pd.botID,
		ChannelId: channelID,
	}

	mm_model.ParseSlackAttachment(post, attachments)

	return pd.api.CreatePost(post)
}

func (pd *PluginDelivery) getDirectChannelID(subscriberID string, subscriberType model.SubscriberType, botID string) (string, error) {
	switch subscriberType {
	case model.SubTypeUser:
		user, err := pd.api.GetUserByID(subscriberID)
		if err != nil {
			return "", fmt.Errorf("cannot find user: %w", err)
		}
		channel, err := pd.api.GetDirectChannel(user.Id, botID)
		if err != nil {
			return "", fmt.Errorf("cannot get direct channel: %w", err)
		}
		return channel.Id, nil
	case model.SubTypeChannel:
		return subscriberID, nil
	default:
		return "", ErrUnsupportedSubscriberType
	}
}
