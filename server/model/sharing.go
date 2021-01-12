package model

type Sharing struct {
	ID         string `json:"id"`
	Token      string `json:"token"`
	Enabled    bool   `json:"enabled"`
	ModifiedBy string `json:"modifiedBy"`
	UpdateAt   int64  `json:"update_at,omitempty"`
}
