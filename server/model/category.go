package model

import (
	"errors"
	"strings"
)

type Category struct {
	ID     string `json:"id"`
	Name   string `json:"name"`
	UserID string `json:"userID"`
	TeamID string `json:"teamID"`
}

func (c Category) IsValid() error {
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
