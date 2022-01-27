package app

import (
	"io"

	"github.com/krolaw/zipstream"
)

const (
	archiveVersion = 2
)

// ImportArchive imports an archive containing zero or more boards, plus all
// associated content, including cards, content blocks, views, and images.
//
// Archives are ZIP files containing a `version.json` file and zero or more
// directories, each containing a `board.jsonl` and zero or more image files.
func (a *App) ImportArchive(r io.Reader) error {
	zr, err := zipstream.NewReader()
}
