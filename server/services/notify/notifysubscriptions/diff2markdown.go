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
	"github.com/wiggin77/merror"
)

const (
	// board notifications.
	defAddBoardNotify = "{{.Username}} has added the board {{.NewBlock | makeLink}}"

	defDeleteBoardNotify = "{{.Username}} has deleted the board {{.NewBlock | makeLink}}"

	defAddBoardDescriptionNotify = "{{.Username}} has added a description for the board {{.NewBlock | makeLink}}\n" +
		"```Description:\n{{.NewBlock | getBoardDescription}}```"

	defModifyBoardDescriptionNotify = "{{.Username}} has updated the description for the board {{.Board | makeLink}}\n" +
		"```Description:\n~~{{.OldBlock | getBoardDescription }}~~\n{{.NewBlock | getBoardDescription}}```"

	// card notifications.
	defAddCardNotify = "{{.Username}} has added the card {{.NewBlock | makeLink}}"

	defAddCardTitleNotify = "{{.Username}} has added a title for card {{.OldBlock | makeLink}}\n" +
		"```Title:\n{{.NewBlock.Title}}```"

	defModifyCardTitleNotify = "{{.Username}} has modified the title for card {{.OldBlock | makeLink}}\n" +
		"```Title:\n~~{{.OldBlock.Title}}~~\n{{.NewBlock.Title}}```"

	defModifyCardNotify = "{{.Username}} has modified the card {{.Card.Title}}"

	defDeleteCardNotify = "{{.Username}} has deleted the card {{.Card.Title}}"
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

		if opts.MakeLink == nil {
			opts.MakeLink = func(block *model.Block) string { return block.Title }
		}
		myFuncs := template.FuncMap{
			"getBoardDescription": getBoardDescription,
			"makeLink":            opts.MakeLink,
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
	Language string
	MakeLink func(block *model.Block) string
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
		case "board":
			err = boardDiff2Markdown(buf, d, opts)
		case "card":
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
	if boardDiff.NewBlock == nil && boardDiff.OldBlock != nil {
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

	// property schema changes

	// TODO
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

	// board deleted
	if cardDiff.NewBlock == nil && cardDiff.OldBlock != nil {
		return execTemplate(w, "DeleteCardNotify", opts, defDeleteCardNotify, cardDiff)
	}

	// at this point new and old block are non-nil

	// title changes
	if cardDiff.NewBlock.Title != cardDiff.OldBlock.Title {
		var err error
		if cardDiff.OldBlock.Title == "" {
			err = execTemplate(w, "AddCardTitleNotify", opts, defAddCardTitleNotify, cardDiff)
		} else {
			err = execTemplate(w, "ModifyCardTitleNotify", opts, defModifyCardTitleNotify, cardDiff)
		}
		if err != nil {
			return err
		}
	}

	// property changes

	// comment add/delete

	// description changes

	return fmt.Errorf("not implemented yet")
}

func blockDiff2Markdown(w io.Writer, diff *Diff, opts MarkdownOpts) error {
	return fmt.Errorf("not implemented yet")
}
