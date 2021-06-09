package model

import (
	"encoding/json"
	"fmt"
	"io"
)

// Block is the basic data unit
// swagger:model
type Block struct {
	// The id for this block
	// required: true
	ID string `json:"id"`

	// The id for this block's parent block. Empty for root blocks
	// required: false
	ParentID string `json:"parentId"`

	// The id for this block's root block
	// required: true
	RootID string `json:"rootId"`

	// The id for user who created the block
	// required: true
	CreatedBy string `json:"CreatedBy"`

	// The id for user who last modified this block
	// required: true
	ModifiedBy string `json:"modifiedBy"`

	// The schema version of this block
	// required: true
	Schema int64 `json:"schema"`

	// The block type
	// required: true
	Type string `json:"type"`

	// The display title
	// required: false
	Title string `json:"title"`

	// The block fields
	// required: false
	Fields map[string]interface{} `json:"fields"`

	// The creation time
	// required: true
	CreateAt int64 `json:"createAt"`

	// The last modified time
	// required: true
	UpdateAt int64 `json:"updateAt"`

	// The deleted time. Set to indicate this block is deleted
	// required: false
	DeleteAt int64 `json:"deleteAt"`
}

func (block Block) IsValid() error {
	if len(block.Type) < 1 {
		return fmt.Errorf("missing type for block id %s", block.ID)
	}

	if len(block.CreatedBy) == 0 {
		return fmt.Errorf("invalid createdBy for block id %s", block.ID)
	}

	if block.CreateAt < 1 {
		return fmt.Errorf("invalid createAt for block id %s", block.ID)
	}

	if block.UpdateAt < 1 {
		return fmt.Errorf("invalid UpdateAt for block id %s", block.ID)
	}

	return nil
}

// Archive is an import / export archive
type Archive struct {
	Version int64   `json:"version"`
	Date    int64   `json:"date"`
	Blocks  []Block `json:"blocks"`
}

func BlocksFromJSON(data io.Reader) []Block {
	var blocks []Block
	json.NewDecoder(data).Decode(&blocks)
	return blocks
}
