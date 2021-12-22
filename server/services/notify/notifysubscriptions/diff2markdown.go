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
	changeLenInserts = 1024
	changeLenDeletes = 60
)

type markDownCfg struct {
	insertOpen  string
	insertClose string
	deleteOpen  string
	deleteClose string
}

func generateMarkdown(diffs []diffmatchpatch.Diff, cfg markDownCfg) string {
	var sb strings.Builder
	inserts := &strings.Builder{}
	deletes := &strings.Builder{}

	flush := func(newline bool) {
		if inserts.Len() > 0 {
			sb.WriteString(cfg.insertOpen)
			sb.WriteString(strings.TrimSpace(inserts.String()))
			sb.WriteString(cfg.insertClose)
			if newline {
				sb.WriteString("\n")
			}
			inserts.Reset()
		}

		if deletes.Len() > 0 {
			sb.WriteString(cfg.deleteOpen)
			sb.WriteString(strings.TrimSpace(deletes.String()))
			sb.WriteString(cfg.deleteClose)
			if newline {
				sb.WriteString("\n")
			}
			deletes.Reset()
		}
	}

	for _, diff := range diffs {
		switch diff.Type {
		case diffmatchpatch.DiffInsert:
			if inserts.Len()+len(diff.Text) > changeLenInserts {
				inserts.WriteString(diff.Text[:changeLenInserts])
				inserts.WriteString("...")
				flush(true)
				break
			}
			inserts.WriteString(diff.Text)

		case diffmatchpatch.DiffDelete:
			if deletes.Len()+len(diff.Text) > changeLenDeletes {
				deletes.WriteString(diff.Text[:changeLenDeletes])
				deletes.WriteString("...")
				flush(true)
				break
			}
			deletes.WriteString(diff.Text)

		case diffmatchpatch.DiffEqual:
			flush(false)
			sb.WriteString(diff.Text)
		}
	}
	flush(false)

	return sb.String()
}

func normalizeText(s string) string {
	s = strings.ReplaceAll(s, "\n\n", "\n")
	s = strings.ReplaceAll(s, "\n", "¶")
	s = strings.ReplaceAll(s, "  ", " ")
	s = strings.ReplaceAll(s, "\t", " ")
	return s
}
