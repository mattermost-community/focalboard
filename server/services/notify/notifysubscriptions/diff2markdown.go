// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package notifysubscriptions

import (
	"bytes"
	"fmt"
	"io"
	"sync"
	"text/template"

	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/utils"
	"github.com/wiggin77/merror"
)

const (
	// board change notifications.
	defAddBoardNotify = "@{{.Username}} has added the board {{.NewBlock | makeLink}}"

	defDeleteBoardNotify = "@{{.Username}} has deleted the board {{.NewBlock | makeLink}}"

	defAddBoardDescriptionNotify = "@{{.Username}} has added a description for the board {{.NewBlock | makeLink}}\n" +
		"```Description:\n{{.NewBlock | getBoardDescription}}```"

	defModifyBoardDescriptionNotify = "@{{.Username}} has updated the description for the board {{.Board | makeLink}}\n" +
		"```Description:\n~~{{.OldBlock | getBoardDescription }}~~\n{{.NewBlock | getBoardDescription}}```"

	// card change notifications.
	defAddCardNotify = "@{{.Username}} has added the card {{.NewBlock | makeLink}}\n"

	defModifyCardTitleNotify = "Title:\t{{.NewBlock.Title}}  ~~{{.OldBlock.Title}}~~\n"

	defModifyCardNotify = "###### @{{.Username}} has modified the card {{.Card | makeLink}}\n"

	defDeleteCardNotify = "@{{.Username}} has deleted the card {{.Card | makeLink}}\n"

	defModifyCardPropsNotify = "{{.Name}}:\t{{.NewValue}}  {{if .OldValue}}~~{{.OldValue}}~~{{end}}\n"

	defModifyCardContentNotify = "{{.NewBlock.Title}}  {{if .OldBlock.Title}}~~{{.OldBlock.Title}}~~{{end}}\n"

	defModifyCardAddCommentNotify = "Comment: {{.NewValue}}\n"

	defModifyCardRemoveCommentNotify = "Comment: ~~{{.OldValue}}~~\n"

	// block change notifications.
	defAddBlockNotify = "Added: {{.NewValue}}\n"

	defModifyBlockNotify = "{{.NewValue}} ~~{{.OldValue}}~~\n"

	defDeleteBlockNotify = "Removed: ~~{{.OldValue}}~~\n"
)

var (
	// templateCache is a map of text templateCache keyed by languange code.
	templateCache    = make(map[string]*template.Template)
	templateCacheMux sync.Mutex
)

// getTemplate returns a new or cached named template based on the language specified.
func getTemplate(name string, opts MarkdownOpts, def string) (*template.Template, error) {
	templateCacheMux.Lock()
	defer templateCacheMux.Unlock()

	key := name + "&" + opts.Language
	t, ok := templateCache[key]
	if !ok {
		t = template.New(key)

		if opts.MakeCardLink == nil {
			opts.MakeCardLink = func(block *model.Block) string { return fmt.Sprintf("`%s`", block.Title) }
		}
		myFuncs := template.FuncMap{
			"getBoardDescription": getBoardDescription,
			"makeLink":            opts.MakeCardLink,
		}
		t.Funcs(myFuncs)

		s := def // TODO: lookup i18n string when supported on server
		t2, err := t.Parse(s)
		if err != nil {
			return nil, fmt.Errorf("cannot parse markdown template '%s' for notifications: %w", key, err)
		}
		templateCache[key] = t2
	}
	return t, nil
}

// execTemplate executes the named template corresponding to the template name and language specified.
func execTemplate(w io.Writer, name string, opts MarkdownOpts, def string, data interface{}) error {
	t, err := getTemplate(name, opts, def)
	if err != nil {
		return err
	}
	return t.Execute(w, data)
}

// MarkdownOpts provides options when converting diffs to markdown.
type MarkdownOpts struct {
	Language     string
	MakeCardLink func(block *model.Block) string
}

// Diffs2Markdown converts a slice of `Diff` to markdown to be used in a post
// or which can be converted to HTML for email notifications. Each markdown
// string returned is meant to be an individual post.
func Diffs2Markdown(diffs []*Diff, opts MarkdownOpts) ([]string, error) {
	var posts []string
	var err error
	merr := merror.New()

	for _, d := range diffs {
		buf := &bytes.Buffer{}
		switch d.BlockType {
		case model.TypeBoard:
			err = boardDiff2Markdown(buf, d, opts)
		case model.TypeCard:
			err = cardDiff2Markdown(buf, d, opts)
		default:
			err = blockDiff2Markdown(buf, d, opts)
		}

		if err != nil {
			merr.Append(err)
			continue
		}

		s := buf.String()
		if s != "" {
			posts = append(posts, s)
		}
	}
	return posts, merr.ErrorOrNil()
}

func boardDiff2Markdown(w io.Writer, boardDiff *Diff, opts MarkdownOpts) error {
	// sanity check
	if boardDiff.NewBlock == nil && boardDiff.OldBlock == nil {
		return nil
	}

	// board added
	if boardDiff.NewBlock != nil && boardDiff.OldBlock == nil {
		return execTemplate(w, "AddBoardNotify", opts, defAddBoardNotify, boardDiff)
	}

	// board deleted
	if (boardDiff.NewBlock == nil || boardDiff.NewBlock.DeleteAt != 0) && boardDiff.OldBlock != nil {
		return execTemplate(w, "DeleteBoardNotify", opts, defDeleteBoardNotify, boardDiff)
	}

	// at this point new and old block are non-nil

	// description change
	oldDescription := getBoardDescription(boardDiff.OldBlock)
	newDescription := getBoardDescription(boardDiff.NewBlock)
	if oldDescription != newDescription {
		var err error
		if oldDescription == "" {
			err = execTemplate(w, "AddBoardDescriptionNotify", opts, defAddBoardDescriptionNotify, boardDiff)
		} else {
			err = execTemplate(w, "ModifyBoardDescriptionNotify", opts, defModifyBoardDescriptionNotify, boardDiff)
		}
		if err != nil {
			return err
		}
	}

	// TODO: property schema changes

	return nil
}

func cardDiff2Markdown(w io.Writer, cardDiff *Diff, opts MarkdownOpts) error {
	// sanity check
	if cardDiff.NewBlock == nil && cardDiff.OldBlock == nil {
		return nil
	}

	// card added
	if cardDiff.NewBlock != nil && cardDiff.OldBlock == nil {
		return execTemplate(w, "AddCardNotify", opts, defAddCardNotify, cardDiff)
	}

	// card deleted
	if cardDiff.NewBlock == nil && cardDiff.OldBlock != nil {
		return execTemplate(w, "DeleteCardNotify", opts, defDeleteCardNotify, cardDiff)
	}

	// at this point new and old block are non-nil

	pairWriter := utils.NewPairWriter(w, "", "")
	_, _ = pairWriter.WriteOpen()
	defer func() { _, _ = pairWriter.WriteCloseIfOpened() }()

	if err := execTemplate(w, "ModifyCardNotify", opts, defModifyCardNotify, cardDiff); err != nil {
		return fmt.Errorf("cannot write notification for card %s: %w", cardDiff.NewBlock.ID, err)
	}

	// title changes
	if cardDiff.NewBlock.Title != cardDiff.OldBlock.Title {
		_, _ = pairWriter.WriteOpen()
		if err := execTemplate(w, "ModifyCardTitleNotify", opts, defModifyCardTitleNotify, cardDiff); err != nil {
			return fmt.Errorf("cannot write title change for card %s: %w", cardDiff.NewBlock.ID, err)
		}
	}

	// property changes
	if len(cardDiff.PropDiffs) > 0 {
		_, _ = pairWriter.WriteOpen()

		for _, propDiff := range cardDiff.PropDiffs {
			if err := execTemplate(w, "ModifyCardPropsNotify", opts, defModifyCardPropsNotify, propDiff); err != nil {
				return fmt.Errorf("cannot write property changes for card %s: %w", cardDiff.NewBlock.ID, err)
			}
		}
	}

	// content/description changes
	for _, child := range cardDiff.Diffs {
		if child.BlockType != model.TypeComment {
			_, _ = pairWriter.WriteOpen()

			if err := execTemplate(w, "ModifyCardContentNotify", opts, defModifyCardContentNotify, child); err != nil {
				return fmt.Errorf("cannot write content change for card %s: %w", cardDiff.NewBlock.ID, err)
			}
		}
	}

	// comment add/delete
	for _, child := range cardDiff.Diffs {
		if child.BlockType == model.TypeComment {
			if child.NewBlock != nil && child.OldBlock == nil {
				_, _ = pairWriter.WriteOpen()
				// added comment
				if err := execTemplate(w, "ModifyCardAddCommentNotify", opts, defModifyCardAddCommentNotify, child); err != nil {
					return fmt.Errorf("cannot write comment for card %s: %w", cardDiff.NewBlock.ID, err)
				}
			}

			if child.NewBlock == nil && child.OldBlock != nil {
				_, _ = pairWriter.WriteOpen()
				// deleted comment
				if err := execTemplate(w, "ModifyCardRemoveCommentNotify", opts, defModifyCardRemoveCommentNotify, child); err != nil {
					return fmt.Errorf("cannot write removed comment for card %s: %w", cardDiff.NewBlock.ID, err)
				}
			}
		}
	}

	return nil
}

func blockDiff2Markdown(w io.Writer, diff *Diff, opts MarkdownOpts) error {
	// sanity check
	if diff.NewBlock == nil && diff.OldBlock == nil {
		return nil
	}

	// block added
	if diff.NewBlock != nil && diff.OldBlock == nil {
		return execTemplate(w, "AddBlockNotify", opts, defAddBlockNotify, diff)
	}

	// block deleted
	if diff.NewBlock == nil && diff.OldBlock != nil {
		return execTemplate(w, "DeleteBlockNotify", opts, defDeleteBlockNotify, diff)
	}

	// at this point new and old block are non-nil

	if err := execTemplate(w, "ModifyBlockNotify", opts, defModifyBlockNotify, diff); err != nil {
		return fmt.Errorf("cannot write notification for card %s: %w", diff.NewBlock.ID, err)
	}
	return nil
}
