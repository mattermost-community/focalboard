package model

type CategoryBoards struct {
	Category
	BoardIDs []string `json:"boardIDs"`
}

type BoardCategoryWebsocketData struct {
	BoardID    string `json:"boardID"`
	CategoryID string `json:"categoryID"`
}
