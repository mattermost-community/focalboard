// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package notifysubscriptions

import "github.com/mattermost/focalboard/server/model"

// Diff represents a difference between two versions of a block.
type Diff struct {
	Board    *model.Block
	Card     *model.Block
	Username string

	BlockType string
	OldBlock  *model.Block
	NewBlock  *model.Block

	Diffs []*Diff // Diffs for child blocks
}

type PropDiff struct {
	Id       string
	OldName  string
	NewName  string
	OldValue string
}

/*
func generatePropDiffs(board, oldBlock, newBlock *model.Block) []PropDiff {
	var propDiffs []PropDiff

	boardProps, ok := board.Fields["cardProperties"]
	oldProps, ok2 := oldBlock.Fields["properties"]
	newProps, ok3 := newBlock.Fields["properties"]

	if !ok || !ok2 || !ok3 {
		return propDiffs
	}

	for k, v := range newProps {

	}

}
*/
