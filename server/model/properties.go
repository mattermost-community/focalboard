// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package model

import (
	"errors"
)

var ErrInvalidBoardBlock = errors.New("invalid board block")
var ErrInvalidPropSchema = errors.New("invalid property schema")

// Properties is a map of Prop's keyed by property id.
type Properties map[string]Prop

// Prop represent a property attached to a block (typically a card).
type Prop struct {
	ID    string `json:"id"`
	Name  string `json:"name"`
	Value string `json:"value"`
}

// PropSchema is a map of PropDef's keyed by property id.
type PropSchema map[string]PropDef

// PropDefOption represents an option within a property definition.
type PropDefOption struct {
	ID    string `json:"id"`
	Index int    `json:"index"`
	Color string `json:"color"`
	Value string `json:"value"`
}

// PropDef represents a property definition as defined in a board's Fields member.
type PropDef struct {
	ID      string                   `json:"id"`
	Index   int                      `json:"index"`
	Name    string                   `json:"name"`
	Type    string                   `json:"type"`
	Options map[string]PropDefOption `json:"options"`
}

// GetValue resolves the value of a property if the passed value is an ID for an option,
// otherwise returns the original value.
func (pd PropDef) GetValue(v string) string {
	// v may be an id to an option.
	opt, ok := pd.Options[v]
	if ok {
		return opt.Value
	}
	return v
}

// ParsePropertySchema parses a board block's `Fields` to extract the properties
// schema for all cards within the board.
// The result is provided as a map for quick lookup, and the original order is
// preserved via the `Index` field.
func ParsePropertySchema(board *Block) (PropSchema, error) {
	if board == nil || board.Type != TypeBoard {
		return nil, ErrInvalidBoardBlock
	}

	schema := make(map[string]PropDef)

	// cardProperties contains a slice of maps (untyped at this point).
	cardPropsIface, ok := board.Fields["cardProperties"]
	if !ok {
		return schema, nil
	}

	cardProps, ok := cardPropsIface.([]interface{})
	if !ok || len(cardProps) == 0 {
		return schema, nil
	}

	for i, cp := range cardProps {
		prop, ok := cp.(map[string]interface{})
		if !ok {
			return nil, ErrInvalidPropSchema
		}

		pd := PropDef{
			ID:      getMapString("id", prop),
			Index:   i,
			Name:    getMapString("name", prop),
			Type:    getMapString("type", prop),
			Options: make(map[string]PropDefOption),
		}
		optsIface, ok := prop["options"]
		if ok {
			opts, ok := optsIface.([]interface{})
			if !ok {
				return nil, ErrInvalidPropSchema
			}
			for j, propOptIface := range opts {
				propOpt, ok := propOptIface.(map[string]interface{})
				if !ok {
					return nil, ErrInvalidPropSchema
				}
				po := PropDefOption{
					ID:    getMapString("id", propOpt),
					Index: j,
					Value: getMapString("value", propOpt),
					Color: getMapString("color", propOpt),
				}
				pd.Options[po.ID] = po
			}
		}
		schema[pd.ID] = pd
	}
	return schema, nil
}

func getMapString(key string, m map[string]interface{}) string {
	iface, ok := m[key]
	if !ok {
		return ""
	}

	s, ok := iface.(string)
	if !ok {
		return ""
	}
	return s
}

// ParseProperties parses a block's `Fields` to extract the properties. Properties typically exist on
// card blocks.
func ParseProperties(block *Block, schema PropSchema) Properties {
	props := make(map[string]Prop)

	if block == nil {
		return props
	}

	// `properties` contains a map (untyped at this point).
	propsIface, ok := block.Fields["properties"]
	if !ok {
		return props
	}

	blockProps, ok := propsIface.(map[string]string)
	if !ok || len(blockProps) == 0 {
		return props
	}

	for k, v := range blockProps {
		prop := Prop{
			ID:    k,
			Name:  k,
			Value: v,
		}

		def, ok := schema[k]
		if ok {
			prop.Name = def.Name
			prop.Value = def.GetValue(v)
		}
		props[k] = prop
	}
	return props
}
