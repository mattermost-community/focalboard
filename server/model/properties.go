// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package model

import (
	"errors"
)

// PropDef represents a property definition as defined in a board's Fields member.
type PropDef struct {
	ID      string                `json:"id"`
	Index   int                   `json:"index"`
	Name    string                `json:"name"`
	Type    string                `json:"type"`
	Options map[string]PropOption `json:"options"`
}

// PropOption represents an option within a property definition.
type PropOption struct {
	ID    string `json:"id"`
	Index int    `json:"index"`
	Color string `json:"color"`
	Value string `json:"value"`
}

var ErrInvalidBoardBlock = errors.New("invalid board block")
var ErrInvalidPropSchema = errors.New("invalid property schema")

// ParsePropertySchema parses a board block's `Fields` to extract the properties
// schema for all cards within the board.
// The result is provided as a map for quick lookup, and the original order is
// preserved via the `Index` field.
func ParsePropertySchema(board *Block) (map[string]PropDef, error) {
	if board == nil || board.Type != "board" {
		return nil, ErrInvalidBoardBlock
	}

	defs := make(map[string]PropDef)

	// cardProperties contains a slice of maps (untyped at this point).
	cardPropsIface, ok := board.Fields["cardProperties"]
	if !ok {
		return defs, nil
	}

	cardProps, ok := cardPropsIface.([]interface{})
	if !ok || len(cardProps) == 0 {
		return defs, nil
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
			Options: make(map[string]PropOption),
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
				po := PropOption{
					ID:    getMapString("id", propOpt),
					Index: j,
					Value: getMapString("value", propOpt),
					Color: getMapString("color", propOpt),
				}
				pd.Options[po.ID] = po
			}
		}
		defs[pd.ID] = pd
	}
	return defs, nil
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
