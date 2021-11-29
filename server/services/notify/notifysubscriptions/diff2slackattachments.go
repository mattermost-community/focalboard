// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package notifysubscriptions

import (
	"bytes"
	"fmt"
	"io"
	"strings"
	"sync"
	"text/template"

	"github.com/mattermost/focalboard/server/model"
	"github.com/wiggin77/merror"

	mm_model "github.com/mattermost/mattermost-server/v6/model"
)

const (
	// card change notifications.
	defAddCardNotify    = "@{{.Username}} has added the card {{.NewBlock | makeLink}}\n"
	defModifyCardNotify = "###### @{{.Username}} has modified the card {{.Card | makeLink}}\n"
	defDeleteCardNotify = "@{{.Username}} has deleted the card {{.Card | makeLink}}\n"
)

var (
	// templateCache is a map of text templateCache keyed by languange code.
	templateCache    = make(map[string]*template.Template)
	templateCacheMux sync.Mutex
)

// DiffConvOpts provides options when converting diffs to slack attachments.
type DiffConvOpts struct {
	Language     string
	MakeCardLink func(block *model.Block) string
}

// getTemplate returns a new or cached named template based on the language specified.
func getTemplate(name string, opts DiffConvOpts, def string) (*template.Template, error) {
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
			"stripNewlines": func(s string) string {
				return strings.TrimSpace(strings.ReplaceAll(s, "\n", "¶ "))
			},
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
func execTemplate(w io.Writer, name string, opts DiffConvOpts, def string, data interface{}) error {
	t, err := getTemplate(name, opts, def)
	if err != nil {
		return err
	}
	return t.Execute(w, data)
}

// Diffs2SlackAttachments converts a slice of `Diff` to slack attachments to be used in a post.
func Diffs2SlackAttachments(diffs []*Diff, opts DiffConvOpts) ([]*mm_model.SlackAttachment, error) {
	var attachments []*mm_model.SlackAttachment
	merr := merror.New()

	for _, d := range diffs {
		// only handle cards for now.
		if d.BlockType == model.TypeCard {
			a, err := cardDiff2SlackAttachment(d, opts)
			if err != nil {
				merr.Append(err)
				continue
			}
			attachments = append(attachments, a)
		}
	}
	return attachments, merr.ErrorOrNil()
}

func cardDiff2SlackAttachment(cardDiff *Diff, opts DiffConvOpts) (*mm_model.SlackAttachment, error) {
	// sanity check
	if cardDiff.NewBlock == nil && cardDiff.OldBlock == nil {
		return nil, nil
	}

	attachment := &mm_model.SlackAttachment{}
	buf := &bytes.Buffer{}

	// card added
	if cardDiff.NewBlock != nil && cardDiff.OldBlock == nil {
		if err := execTemplate(buf, "AddCardNotify", opts, defAddCardNotify, cardDiff); err != nil {
			return nil, err
		}
		attachment.Pretext = buf.String()
		attachment.Fallback = attachment.Pretext
		return attachment, nil
	}

	// card deleted
	if (cardDiff.NewBlock == nil || cardDiff.NewBlock.DeleteAt != 0) && cardDiff.OldBlock != nil {
		buf.Reset()
		if err := execTemplate(buf, "DeleteCardNotify", opts, defDeleteCardNotify, cardDiff); err != nil {
			return nil, err
		}
		attachment.Pretext = buf.String()
		attachment.Fallback = attachment.Pretext
		return attachment, nil
	}

	// at this point new and old block are non-nil

	buf.Reset()
	if err := execTemplate(buf, "ModifyCardNotify", opts, defModifyCardNotify, cardDiff); err != nil {
		return nil, fmt.Errorf("cannot write notification for card %s: %w", cardDiff.NewBlock.ID, err)
	}
	attachment.Pretext = buf.String()
	attachment.Fallback = attachment.Pretext

	// title changes
	if cardDiff.NewBlock.Title != cardDiff.OldBlock.Title {
		attachment.Fields = append(attachment.Fields, &mm_model.SlackAttachmentField{
			Short: false,
			Title: "Title",
			Value: fmt.Sprintf("%s  ~~`%s`~~", cardDiff.NewBlock.Title, cardDiff.OldBlock.Title),
		})
	}

	// property changes
	if len(cardDiff.PropDiffs) > 0 {
		for _, propDiff := range cardDiff.PropDiffs {
			if propDiff.NewValue == propDiff.OldValue {
				continue
			}

			var val string
			if propDiff.OldValue != "" {
				val = fmt.Sprintf("%s  ~~`%s`~~", propDiff.NewValue, propDiff.OldValue)
			} else {
				val = propDiff.NewValue
			}

			attachment.Fields = append(attachment.Fields, &mm_model.SlackAttachmentField{
				Short: false,
				Title: propDiff.Name,
				Value: val,
			})
		}
	}

	// comment add/delete
	for _, child := range cardDiff.Diffs {
		if child.BlockType == model.TypeComment {
			var format string
			var block *model.Block
			if child.NewBlock != nil && child.OldBlock == nil {
				// added comment
				format = "%s"
				block = child.NewBlock
			}

			if child.NewBlock == nil && child.OldBlock != nil {
				// deleted comment
				format = "~~`%s`~~"
				block = child.OldBlock
			}

			if format != "" {
				attachment.Fields = append(attachment.Fields, &mm_model.SlackAttachmentField{
					Short: false,
					Title: "Comment",
					Value: fmt.Sprintf(format, stripNewlines(block.Title)),
				})
			}
		}
	}

	// content/description changes
	for _, child := range cardDiff.Diffs {
		if child.BlockType != model.TypeComment {
			var newTitle, oldTitle string
			if child.NewBlock != nil {
				newTitle = stripNewlines(child.NewBlock.Title)
			}
			if child.OldBlock != nil {
				oldTitle = stripNewlines(child.OldBlock.Title)
			}

			if newTitle == oldTitle {
				continue
			}

			/*
				TODO: use diff lib for content changes which can be many paragraphs.
				      Unfortunately `github.com/sergi/go-diff` is not suitable for
					  markdown display. An alternate markdown friendly lib is being
					  worked on at github.com/wiggin77/go-difflib and will be substituted
					  here when ready.

				newTxt := cleanBlockTitle(child.NewBlock)
				oldTxt := cleanBlockTitle(child.OldBlock)

				dmp := diffmatchpatch.New()
				txtDiffs := dmp.DiffMain(oldTxt, newTxt, true)

				_, _ = w.Write([]byte(dmp.DiffPrettyText(txtDiffs)))

			*/

			if oldTitle != "" {
				oldTitle = fmt.Sprintf("\n~~`%s`~~", oldTitle)
			}

			attachment.Fields = append(attachment.Fields, &mm_model.SlackAttachmentField{
				Short: false,
				Title: "Description",
				Value: newTitle + oldTitle,
			})
		}
	}
	return attachment, nil
}
