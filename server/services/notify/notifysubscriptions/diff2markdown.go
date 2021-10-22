// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package notifysubscriptions

import "fmt"

const (
	// todo: use i18n when that is available server side.
	defAddBoardTemplate            = "%s has added the board %s"
	defDeleteBoardTemplate         = "%s has deleted the board %s"
	defChgDescriptionBoardTemplate = "%s has updated the description for the board %s"
	defModifyCardTemplate          = "%s has modified the card %s"
)

// Diffs2Markdown converts a slice of `Diff` to markdown to be used in a post
// or which can be converted to HTML for email notifications. Each markdown
// string returned is meant to be an individual post.
func Diffs2Markdown(diffs []*Diff) ([]string, error) {
	var posts []string

	var s string

	for _, d := range diffs {
		switch d.BlockType {
		case "board":
			s = boardDiff2Markdown(d)
		case "card":
			s = cardDiff2Markdown(d)
		default:
			s = blockDiff2Markdown(d)
		}

		if s != "" {
			posts = append(posts, s)
		}
	}
	return posts, nil
}

func boardDiff2Markdown(boardDiff *Diff) string {
	// sanity check
	if boardDiff.NewBlock == nil && boardDiff.OldBlock == nil {
		return ""
	}

	// board added
	if boardDiff.NewBlock != nil && boardDiff.OldBlock == nil {
		return fmt.Sprintf(defAddBoardTemplate, boardDiff.Username, boardDiff.NewBlock.Title)
	}

	// board deleted
	if boardDiff.NewBlock == nil && boardDiff.OldBlock != nil {
		return fmt.Sprintf(defDeleteBoardTemplate, boardDiff.Username, boardDiff.OldBlock.Title)
	}

	// at this point new and old block are non-nil

	// description change
	oldDescription := getBoardDescription(boardDiff.OldBlock)
	newDescription := getBoardDescription(boardDiff.NewBlock)
	if oldDescription != newDescription {
		s := fmt.Sprintf(defChgDescriptionBoardTemplate, boardDiff.Username, boardDiff.OldBlock.Title)

	}

	// property schema changes
}

func cardDiff2Markdown(cardDiff *Diff) string {
	// title changes

	// property changes

	// comment add/delete

	// description changes
}

func blockDiff2Markdown(diff *Diff) string {

}
