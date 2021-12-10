package model

type CategoryBlocks struct {
	Category
	BlockIDs []string `json:"blockIDs"`
}
