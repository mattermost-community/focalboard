package model

type CategoryBlocks struct {
	Category
	BlockIDs []string `json:"blockIDs"`
}

type BlockCategoryWebsocketData struct {
	BlockID    string `json:"blockID"`
	CategoryID string `json:"categoryID"`
}
