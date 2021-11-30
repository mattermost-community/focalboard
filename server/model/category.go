package model

type Category struct {
	ID     string  `json:"id"`
	Name   string  `json:"name"`
	UserID string  `json:"userID"`
	TeamID string  `json:"teamID"`
	Blocks []Block `json:"blocks"`
}
