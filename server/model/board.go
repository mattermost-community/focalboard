package model

import (
	"encoding/json"
	"io"
)

// BoardMetadata contains metadata for a Board
// swagger:model
type BoardMetadata struct {
	// The ID for the board
	// required: true
	BoardID string `json:"boardId"`

	// The most recent time a descendant of this board was added, modified, or deleted
	// required: true
	DescendantLastUpdateAt int64 `json:"descendantLastUpdateAt"`

	// The earliest time a descendant of this board was added, modified, or deleted
	// required: true
	DescendantFirstUpdateAt int64 `json:"descendantFirstUpdateAt"`

	// The ID of the user that created the board
	// required: true
	CreatedBy string `json:"createdBy"`

	// The ID of the user that last modified the most recently modified descendant
	// required: true
	LastModifiedBy string `json:"lastModifiedBy"`
}

func BoardMetadataFromJSON(data io.Reader) *BoardMetadata {
	var boardMetadata *BoardMetadata
	_ = json.NewDecoder(data).Decode(&boardMetadata)
	return boardMetadata
}
