package model

import (
	"encoding/json"
	"errors"
)

var (
	ErrInvalidImageBlock = errors.New("invalid image block")
)

// Archive is an import / export archive.
// TODO: remove.
type Archive struct {
	Version int64   `json:"version"`
	Date    int64   `json:"date"`
	Blocks  []Block `json:"blocks"`
}

// ArchiveHeader is the first line of any archive file.
type ArchiveHeader struct {
	Version int   `json:"version"`
	Date    int64 `json:"date"`
}

// ArchiveLine is any non-header line in an archive.
type ArchiveLine struct {
	Type string          `json:"type"`
	Data json.RawMessage `json:"data"`
}

// ExportArchiveOptions provides options when exporting one or more boards
// to an archive.
type ExportArchiveOptions struct {
	WorkspaceID string

	// BoardIDs is the list of boards to include in the archive.
	// Empty slice means export all boards from workspace/team.
	BoardIDs []string
}

// ImportArchiveOptions provides options when importing an archive.
type ImportArchiveOptions struct {
	WorkspaceID string
}
