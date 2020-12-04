package model

import (
	"encoding/json"
	"io"
)

// Block is the basic data unit.
type Block struct {
	ID       string                 `json:"id"`
	ParentID string                 `json:"parentId"`
	RootID   string                 `json:"rootId"`
	Schema   int64                  `json:"schema"`
	Type     string                 `json:"type"`
	Title    string                 `json:"title"`
	Fields   map[string]interface{} `json:"fields"`
	CreateAt int64                  `json:"createAt"`
	UpdateAt int64                  `json:"updateAt"`
	DeleteAt int64                  `json:"deleteAt"`
}

func BlocksFromJSON(data io.Reader) []Block {
	var blocks []Block
	json.NewDecoder(data).Decode(&blocks)
	return blocks
}
