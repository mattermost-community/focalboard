package app

import (
	"bytes"
	"errors"
	"io"
	"path"

	"github.com/krolaw/zipstream"

	"github.com/mattermost/focalboard/server/model"

	"github.com/mattermost/mattermost-server/v6/shared/mlog"
)

const (
	archiveVersion = 2
)

// ImportArchive imports an archive containing zero or more boards, plus all
// associated content, including cards, content blocks, views, and images.
//
// Archives are ZIP files containing a `version.json` file and zero or more
// directories, each containing a `board.jsonl` and zero or more image files.
func (a *App) ImportArchive(r io.Reader, opt model.ImportArchiveOptions) error {
	zr := zipstream.NewReader(r)

	// boardMap := make(map[string]string) // maps old board ids to new

	for {
		hdr, err := zr.Next()
		if err != nil {
			if errors.Is(err, io.EOF) {
				a.logger.Debug("import archive - done")
				return nil
			}
		}

		dir, filename := path.Split(hdr.Name)
		dir = path.Clean(dir)

		buf := &bytes.Buffer{}

		n, err := io.Copy(buf, zr)
		if err != nil {
			return err
		}

		a.logger.Debug("import archive",
			mlog.String("dir", dir),
			mlog.String("filename", filename),
			mlog.Int64("bytes_read", n),
		)
	}
}
