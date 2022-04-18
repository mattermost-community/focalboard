package model

// CategoryBoards is a board category and associated boards
// swagger:model
type CategoryBoards struct {
	Category

	// The IDs of boards in this category
	// required: true
	BoardIDs []string `json:"boardIDs"`
}

type BoardCategoryWebsocketData struct {
	BoardID    string `json:"boardID"`
	CategoryID string `json:"categoryID"`
}
