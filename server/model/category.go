package model

import (
	"strings"

	"github.com/mattermost/focalboard/server/utils"
)

// Category is a board category
// swagger:model
type Category struct {
	// The id for this category
	// required: true
	ID string `json:"id"`

	// The name for this category
	// required: true
	Name string `json:"name"`

	// The user's id for this category
	// required: true
	UserID string `json:"userID"`

	// The team id for this category
	// required: true
	TeamID string `json:"teamID"`

	// The creation time in miliseconds since the current epoch
	// required: true
	CreateAt int64 `json:"createAt"`

	// The last modified time in miliseconds since the current epoch
	// required: true
	UpdateAt int64 `json:"updateAt"`

	// The deleted time in miliseconds since the current epoch. Set to indicate this category is deleted
	// required: false
	DeleteAt int64 `json:"deleteAt"`
}

func (c *Category) Hydrate() {
	c.ID = utils.NewID(utils.IDTypeNone)
	c.CreateAt = utils.GetMillis()
	c.UpdateAt = c.CreateAt
}

func (c *Category) IsValid() error {
	if strings.TrimSpace(c.ID) == "" {
		return newErrInvalidCategory("category ID cannot be empty")
	}

	if strings.TrimSpace(c.Name) == "" {
		return newErrInvalidCategory("category name cannot be empty")
	}

	if strings.TrimSpace(c.UserID) == "" {
		return newErrInvalidCategory("category user ID cannot be empty")
	}

	if strings.TrimSpace(c.TeamID) == "" {
		return newErrInvalidCategory("category team id ID cannot be empty")
	}

	return nil
}

type ErrInvalidCategory struct {
	msg string
}

func newErrInvalidCategory(msg string) *ErrInvalidCategory {
	return &ErrInvalidCategory{
		msg: msg,
	}
}

func (e *ErrInvalidCategory) Error() string {
	return e.msg
}
