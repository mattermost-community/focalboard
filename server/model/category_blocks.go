package model

type CategoryBlocks struct {
	Category
	BlockAttributes []CategoryBlockAttributes `json:"blockAttributes"`
}

type CategoryBlockAttributes struct {
	BlockID string `json:"blockID"`
}
