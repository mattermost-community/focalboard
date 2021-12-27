package model

import (
	"errors"
	"github.com/mattermost/focalboard/server/utils"
	"strings"
)

type Category struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	UserID   string `json:"userID"`
	TeamID   string `json:"teamID"`
	CreateAt int64  `json:"createAt"`
	UpdateAt int64  `json:"updateAt"`
	DeleteAt int64  `json:"deleteAt"`
}

func (c *Category) Hydrate() {
	c.ID = utils.NewID(utils.IDTypeNone)
	c.CreateAt = utils.GetMillis()
	c.UpdateAt = c.CreateAt
}

func (c *Category) IsValid() error {
	if strings.TrimSpace(c.ID) == "" {
		return errors.New("category ID cannot be empty")
	}

	if strings.TrimSpace(c.Name) == "" {
		return errors.New("category name cannot be empty")
	}

	if strings.TrimSpace(c.UserID) == "" {
		return errors.New("category user ID cannot be empty")
	}

	if strings.TrimSpace(c.TeamID) == "" {
		return errors.New("category team id ID cannot be empty")
	}

	return nil
}
