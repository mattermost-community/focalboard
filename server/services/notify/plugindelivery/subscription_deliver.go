// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package plugindelivery

import (
	"errors"
	"fmt"

	"github.com/wiggin77/merror"

	"github.com/mattermost/focalboard/server/model"

	mm_model "github.com/mattermost/mattermost-server/v6/model"
)

var (
	ErrUnsupportedSubscriberType = errors.New("invalid subscriber type")
)

// SubscriptionDeliverMarkdown notifies a user that changes were made to a block they are subscribed to.
func (pd *PluginDelivery) SubscriptionDeliverMarkdown(subscriberID string, subscriberType model.SubscriberType, markdown []string) error {
	channelID, err := pd.getDirectChannelID(subscriberID, subscriberType, pd.botID)
	if err != nil {
		return err
	}

	merr := merror.New()

	for _, md := range markdown {
		post := &mm_model.Post{
			UserId:    pd.botID,
			ChannelId: channelID,
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

// SubscriptionDeliverSlashAttachments notifies a user that changes were made to a block they are subscribed to.
func (pd *PluginDelivery) SubscriptionDeliverSlackAttachments(subscriptionID string, subscriptionType model.SubscriberType,
	attachments []*mm_model.SlackAttachment) error {
	//
	channelID, err := pd.getDirectChannelID(subscriptionID, subscriptionType, pd.botID)
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
