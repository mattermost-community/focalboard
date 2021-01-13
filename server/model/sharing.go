package model

import (
	"encoding/json"
	"io"
)

type Sharing struct {
	ID         string `json:"id"`
	Token      string `json:"token"`
	Enabled    bool   `json:"enabled"`
	ModifiedBy string `json:"modifiedBy"`
	UpdateAt   int64  `json:"update_at,omitempty"`
}

func SharingFromJSON(data io.Reader) Sharing {
	var sharing Sharing
	json.NewDecoder(data).Decode(&sharing)
	return sharing
}
