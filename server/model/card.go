package model

// Card represents a group of content blocks and properties.
// swagger:model
type Card struct {
	// The id for this card
	// required: false
	ID string `json:"id"`

	// The id for board this card belongs to.
	// required: true
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

	// A map of property ids to property option ids
	// required: false
	Properties map[string]string `json:"properties"`

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
	UpdatedProperties map[string]string `json:"updatedProperties"`

	// A an array of property ids to delete
	// required: false
	DeletedProperties []string `json:"deletedProperties"`
}

type InvalidCardErr struct {
	msg string
}

func (e InvalidCardErr) Error() string {
	return "invalid card (" + e.msg + ")"
}

func (c *Card) IsValid() error {
	if c.BoardID == "" {
		return InvalidCardErr{"empty-board-id"}
	}
	return nil
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
		// first we accumulate all properties indexed by id, and maintain their order
		keyOrder := []string{}
		cardPropertyMap := map[string]map[string]interface{}{}
		for _, prop := range card.Properties {
			id, ok := prop["id"].(string)
			if !ok {
				// bad property, skipping
				continue
			}

			cardPropertyMap[id] = prop
			keyOrder = append(keyOrder, id)
		}

		// if there are properties marked for removal, we delete them
		for _, propertyID := range p.DeletedCardProperties {
			delete(cardPropertyMap, propertyID)
		}

		// if there are properties marked for update, we replace the
		// existing ones or add them
		for _, newprop := range p.UpdatedCardProperties {
			id, ok := newprop["id"].(string)
			if !ok {
				// bad new property, skipping
				continue
			}

			_, exists := cardPropertyMap[id]
			if !exists {
				keyOrder = append(keyOrder, id)
			}
			cardPropertyMap[id] = newprop
		}

		// and finally we flatten and save the updated properties
		newCardProperties := []map[string]interface{}{}
		for _, key := range keyOrder {
			p, exists := cardPropertyMap[key]
			if exists {
				newCardProperties = append(newCardProperties, p)
			}
		}

		board.CardProperties = newCardProperties
	}

	return board
}
