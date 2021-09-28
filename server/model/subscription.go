package model

import (
	"encoding/json"
	"io"
)

// Subscription is a subscription to a board, card, etc, for a user or channel.
// swagger:model
type Subscription struct {
	// BlockType is the block type of the entity (e.g. board, card) subscribed to
	// required: true
	BlockType string `json:"block_type"`

	// BlockID is id of the entity being subscribed to
	// required: true
	BlockID string `json:"block_id"`

	// SubscriberType is the type of the entity (e.g. user, channel) that is subscribing
	// required: true
	SubscriberType string `json:"subscriber_type"`

	// SubscriberID is the id of the entity that is subscribing
	// required: true
	SubscriberID string `json:"subscriber_id"`

	// NotifiedAt is the timestamp of the last notification sent for this subscription
	// required: true
	NotifiedAt int64 `json:"notified_at,omitempty"`

	// CreatedAt is the timestamp this subscription was created
	// required: true
	CreateAt int64 `json:"create_at"`

	// DeleteAt is the timestamp this subscription was deleted, or zero if not deleted
	// required: true
	DeleteAt int64 `json:"delete_at"`
}

func (s *Subscription) IsValid() error {
	if s == nil {
		return ErrInvalidSubscription{"cannot be nil"}
	}
	if s.BlockID == "" {
		return ErrInvalidSubscription{"missing block id"}
	}
	if s.BlockType == "" {
		return ErrInvalidSubscription{"missing block type"}
	}
	if s.SubscriberID == "" {
		return ErrInvalidSubscription{"missing subscriber id"}
	}
	if s.SubscriberType == "" {
		return ErrInvalidSubscription{"missing subscriber type"}
	}
	return nil
}

func SubscriptionFromJSON(data io.Reader) (*Subscription, error) {
	var subscription Subscription
	if err := json.NewDecoder(data).Decode(&subscription); err != nil {
		return nil, err
	}
	return &subscription, nil
}

type ErrInvalidSubscription struct {
	msg string
}

func (e ErrInvalidSubscription) Error() string {
	return e.msg
}

// Subscriber is an entity (e.g. user, channel) that can subscribe to events from boards, cards, etc
// swagger:model
type Subscriber struct {
	// SubscriberType is the type of the entity (e.g. user, channel) that is subscribing
	// required: true
	SubscriberType string `json:"subscriber_type"`

	// SubscriberID is the id of the entity that is subscribing
	// required: true
	SubscriberID string `json:"subscriber_id"`
}
