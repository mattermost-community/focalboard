package model

import (
	"errors"
	"fmt"

	"github.com/mattermost/focalboard/server/utils"
	"github.com/rivo/uniseg"
)

var ErrBoardIDMismatch = errors.New("Board IDs do not match")

type ErrInvalidCard struct {
	msg string
}

func NewErrInvalidCard(msg string) ErrInvalidCard {
	return ErrInvalidCard{
		msg: msg,
	}
}

func (e ErrInvalidCard) Error() string {
	return fmt.Sprintf("invalid card, %s", e.msg)
}

// Card represents a group of content blocks and properties.
// swagger:model
type Card struct {
	// The id for this card
	// required: false
	ID string `json:"id"`

	// The id for board this card belongs to.
	// required: false
	BoardID string `json:"boardId"`

	// The id for user who created this card
	// required: false
	CreatedBy string `json:"createdBy"`

	// The id for user who last modified this card
	// required: false
	ModifiedBy string `json:"modifiedBy"`

	// The display title
	// required: false
	Title string `json:"title"`

	// An array of content block ids specifying the ordering of content for this card.
	// required: false
	ContentOrder []string `json:"contentOrder"`

	// The icon of the card
	// required: false
	Icon string `json:"icon"`

	// True if this card belongs to a template
	// required: false
	IsTemplate bool `json:"isTemplate"`

	// A map of property ids to property values (option ids, strings, array of option ids)
	// required: false
	Properties map[string]any `json:"properties"`

	// The creation time in milliseconds since the current epoch
	// required: false
	CreateAt int64 `json:"createAt"`

	// The last modified time in milliseconds since the current epoch
	// required: false
	UpdateAt int64 `json:"updateAt"`

	// The deleted time in milliseconds since the current epoch. Set to indicate this card is deleted
	// required: false
	DeleteAt int64 `json:"deleteAt"`
}

// Populate populates a Card with default values.
func (c *Card) Populate() {
	if c.ID == "" {
		c.ID = utils.NewID(utils.IDTypeCard)
	}
	if c.ContentOrder == nil {
		c.ContentOrder = make([]string, 0)
	}
	if c.Properties == nil {
		c.Properties = make(map[string]any)
	}
	now := utils.GetMillis()
	if c.CreateAt == 0 {
		c.CreateAt = now
	}
	if c.UpdateAt == 0 {
		c.UpdateAt = now
	}
}

func (c *Card) PopulateWithBoardID(boardID string) {
	c.BoardID = boardID
	c.Populate()
}

// CheckValid returns an error if the Card has invalid field values.
func (c *Card) CheckValid() error {
	if c.ID == "" {
		return ErrInvalidCard{"IDis missing"}
	}
	if c.BoardID == "" {
		return ErrInvalidCard{"BoardID is missing"}
	}
	if c.ContentOrder == nil {
		return ErrInvalidCard{"ContentOrder is missing"}
	}
	if uniseg.GraphemeClusterCount(c.Icon) > 1 {
		return ErrInvalidCard{"Icon can have only one grapheme"}
	}
	if c.Properties == nil {
		return ErrInvalidCard{"Properties"}
	}
	if c.CreateAt == 0 {
		return ErrInvalidCard{"CreateAt"}
	}
	if c.UpdateAt == 0 {
		return ErrInvalidCard{"UpdateAt"}
	}
	return nil
}

// CardPatch is a patch for modifying cards
// swagger:model
type CardPatch struct {
	// The display title
	// required: false
	Title *string `json:"title"`

	// An array of content block ids specifying the ordering of content for this card.
	// required: false
	ContentOrder []string `json:"contentOrder"`

	// The icon of the card
	// required: false
	Icon *string `json:"icon"`

	// A map of property ids to property option ids to be updated
	// required: false
	UpdatedProperties map[string]any `json:"updatedProperties"`

	// A an array of property ids to delete
	// required: false
	DeletedProperties []string `json:"deletedProperties"`
}

// Patch returns an updated version of the card.
func (p *CardPatch) Patch(card *Card) *Card {
	if p.Title != nil {
		card.Title = *p.Title
	}

	if len(p.ContentOrder) != 0 {
		card.ContentOrder = p.ContentOrder
	}

	if p.Icon != nil {
		card.Icon = *p.Icon
	}

	for key, property := range p.UpdatedProperties {
		card.Properties[key] = property
	}

	for _, key := range p.DeletedProperties {
		delete(card.Properties, key)
	}

	if len(p.UpdatedProperties) != 0 || len(p.DeletedProperties) != 0 {
		if card.Properties == nil {
			card.Properties = make(map[string]any)
		}

		// if there are properties marked for removal, we delete them
		for _, propID := range p.DeletedProperties {
			delete(card.Properties, propID)
		}

		// if there are properties marked for update, we replace the
		// existing ones or add them
		for propID, propVal := range p.UpdatedProperties {
			card.Properties[propID] = propVal
		}
	}

	return card
}
