package model

// NotificationHint provides a hint that a block has been modified and has subscribers that
// should be notified.
// swagger:model
type NotificationHint struct {
	// BlockType is the block type of the entity (e.g. board, card) that was updated
	// required: true
	BlockType string `json:"block_type"`

	// BlockID is id of the entity that was updated
	// required: true
	BlockID string `json:"block_id"`

	// CreatedAt is the timestamp this notification hint was created
	// required: true
	CreateAt int64 `json:"create_at"`

	// NotifyAt is the timestamp this notification should be scheduled
	// required: true
	NotifyAt int64 `json:"notify_at"`
}

func (s *NotificationHint) IsValid() error {
	if s == nil {
		return ErrInvalidNotificationHint{"cannot be nil"}
	}
	if s.BlockID == "" {
		return ErrInvalidNotificationHint{"missing block id"}
	}
	if s.BlockType == "" {
		return ErrInvalidNotificationHint{"missing block type"}
	}
	return nil
}

func (s *NotificationHint) Copy() *NotificationHint {
	return &NotificationHint{
		BlockType: s.BlockType,
		BlockID:   s.BlockID,
		CreateAt:  s.CreateAt,
		NotifyAt:  s.NotifyAt,
	}
}

type ErrInvalidNotificationHint struct {
	msg string
}

func (e ErrInvalidNotificationHint) Error() string {
	return e.msg
}
