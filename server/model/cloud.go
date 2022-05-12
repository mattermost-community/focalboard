package model

// BoardsCloudLimits is the representation of the limits for the
// Boards server
// swagger:model
type BoardsCloudLimits struct {
	// The maximum number of cards on the server
	// required: true
	Cards int `json:"cards"`

	// The current number of cards on the server
	// required: true
	UsedCards int `json:"used_cards"`

	// The updated_at timestamp of the limit card
	// required: true
	CardLimitTimestamp int64 `json:"card_limit_timestamp"`

	// The maximum number of views for each board
	// required: true
    Views int `json:"views"`
}
