package notifysubscriptions

import (
	"strings"

	"github.com/sergi/go-diff/diffmatchpatch"
)

func diff2Markdown(oldText string, newText string) string {
	oldTxtNorm := normalizeText(oldText)
	newTxtNorm := normalizeText(newText)

	dmp := diffmatchpatch.New()

	diffs := dmp.DiffMain(oldTxtNorm, newTxtNorm, false)

	diffs = dmp.DiffCleanupSemantic(diffs)
	diffs = dmp.DiffCleanupEfficiency(diffs)

	cfg := markDownCfg{
		insertOpen:  "`",
		insertClose: "`",
		deleteOpen:  "~~`",
		deleteClose: "`~~",
	}
	markdown := generateMarkdown(diffs, cfg)
	markdown = strings.ReplaceAll(markdown, "¶", "\n")

	return markdown
}

const (
	truncLenEquals  = 60
	truncLenInserts = 1024
	truncLenDeletes = 60
)

type markDownCfg struct {
	insertOpen  string
	insertClose string
	deleteOpen  string
	deleteClose string
}

func generateMarkdown(diffs []diffmatchpatch.Diff, cfg markDownCfg) string {
	sb := &strings.Builder{}
	equals := newBuffer("", "", truncLenEquals)
	inserts := newBuffer(cfg.insertOpen, cfg.insertClose, truncLenInserts)
	deletes := newBuffer(cfg.deleteOpen, cfg.deleteClose, truncLenDeletes)
	var lastType diffmatchpatch.Operation

	for _, diff := range diffs {
		if diff.Type != lastType {
			equals.flushToBuilder(sb)
			inserts.flushToBuilder(sb)
			deletes.flushToBuilder(sb)
		}

		switch diff.Type {
		case diffmatchpatch.DiffInsert:
			inserts.append(diff.Text)

		case diffmatchpatch.DiffDelete:
			deletes.append(diff.Text)

		case diffmatchpatch.DiffEqual:
			equals.append(diff.Text)
		}
	}
	equals.flushToBuilder(sb)
	inserts.flushToBuilder(sb)
	deletes.flushToBuilder(sb)

	return sb.String()
}

func normalizeText(s string) string {
	s = strings.ReplaceAll(s, "\n\n", "\n")
	s = strings.ReplaceAll(s, "\n", "¶")
	s = strings.ReplaceAll(s, "  ", " ")
	s = strings.ReplaceAll(s, "\t", " ")
	return s
}

// buffer is a simple string builder with associated properties.
type buffer struct {
	sb       *strings.Builder
	opener   string
	closer   string
	truncLen int
}

func newBuffer(opener string, closer string, truncLen int) *buffer {
	return &buffer{
		sb:       &strings.Builder{},
		opener:   opener,
		closer:   closer,
		truncLen: truncLen,
	}
}

func (b *buffer) append(s string) {
	b.sb.WriteString(s)
}

func (b *buffer) flushToBuilder(sb *strings.Builder) {
	if b.sb.Len() == 0 {
		return
	}

	defer sb.Reset()

	var truncated bool
	s := b.sb.String()
	if len(s) > b.truncLen {
		s = s[len(s)-b.truncLen:]
		truncated = true
	}

	sb.WriteString(b.opener)

	sb.WriteString(s)
	if truncated {
		sb.WriteString("...")
	}

	sb.WriteString(b.closer)

	if truncated {
		sb.WriteByte('\n')
	}
}
