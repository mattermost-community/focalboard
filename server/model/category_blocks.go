package model

type CategoryBlocks struct {
	Category
	BlockAttributes []CategoryBlockAttributes
}

type CategoryBlockAttributes struct {
	BlockID string `json:"blockID"`
}
