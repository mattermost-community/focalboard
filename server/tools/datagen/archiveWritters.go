package main

import (
	"archive/zip"
	"encoding/json"
	"fmt"
	"io"

	"github.com/mattermost/focalboard/server/model"
)

const (
	archiveVersion = 2
)

var (
	newline = []byte{'\n'}
)

// writeArchiveBoard writes a single board to the archive in a zip directory.
func writeArchiveBoard(zw *zip.Writer, board model.Board) error {
	// create a directory per board
	w, err := zw.Create(board.ID + "/board.jsonl")
	if err != nil {
		return err
	}

	// write the board block first
	if err = writeArchiveBoardLine(w, board); err != nil {
		return err
	}

	for _, block := range generateViewsForBoard(board.ID, 4) {
		if err = writeArchiveBlockLine(w, block); err != nil {
			return err
		}
	}

	var files []string
	for _, card := range generateCardsForBoard(board.ID, 10, 4) {
		if err = writeArchiveBlockLine(w, card); err != nil {
			return err
		}
		for _, block := range generateContentsForCard(board.ID, card.ID, 4) {
			if err = writeArchiveBlockLine(w, block); err != nil {
				return err
			}
			if block.Type == model.TypeImage {
				filename, err := extractImageFilename(block)
				if err != nil {
					return err
				}
				files = append(files, filename)
			}
		}

		for _, block := range generateCommentsForCard(board.ID, card.ID, 4) {
			if err = writeArchiveBlockLine(w, block); err != nil {
				return err
			}
		}

	}

	// write the files
	for _, filename := range files {
		if err := writeArchiveFile(zw, filename, board.ID); err != nil {
			return fmt.Errorf("cannot write file %s to archive: %w", filename, err)
		}
	}
	return nil
}

// writeArchiveBlockLine writes a single block to the archive.
func writeArchiveBlockLine(w io.Writer, block model.Block) error {
	b, err := json.Marshal(&block)
	if err != nil {
		return err
	}
	line := model.ArchiveLine{
		Type: "block",
		Data: b,
	}

	b, err = json.Marshal(&line)
	if err != nil {
		return err
	}

	_, err = w.Write(b)
	if err != nil {
		return err
	}

	// jsonl files need a newline
	_, err = w.Write(newline)
	return err
}

// writeArchiveBlockLine writes a single block to the archive.
func writeArchiveBoardLine(w io.Writer, board model.Board) error {
	b, err := json.Marshal(&board)
	if err != nil {
		return err
	}
	line := model.ArchiveLine{
		Type: "board",
		Data: b,
	}

	b, err = json.Marshal(&line)
	if err != nil {
		return err
	}

	_, err = w.Write(b)
	if err != nil {
		return err
	}

	// jsonl files need a newline
	_, err = w.Write(newline)
	return err
}

// writeArchiveVersion writes a version file to the zip.
func writeArchiveVersion(zw *zip.Writer) error {
	archiveHeader := model.ArchiveHeader{
		Version: archiveVersion,
		Date:    model.GetMillis(),
	}
	b, _ := json.Marshal(&archiveHeader)

	w, err := zw.Create("version.json")
	if err != nil {
		return fmt.Errorf("cannot write archive header: %w", err)
	}

	if _, err := w.Write(b); err != nil {
		return fmt.Errorf("cannot write archive header: %w", err)
	}
	return nil
}

// writeArchiveFile writes a single file to the archive.
func writeArchiveFile(zw *zip.Writer, filename string, boardID string) error {
	dest, err := zw.Create(boardID + "/" + filename)
	if err != nil {
		return err
	}

	src := generateFileContent(boardID, filename)

	_, err = io.Copy(dest, src)
	return err
}

func extractImageFilename(imageBlock model.Block) (string, error) {
	f, ok := imageBlock.Fields["fileId"]
	if !ok {
		return "", model.ErrInvalidImageBlock
	}

	filename, ok := f.(string)
	if !ok {
		return "", model.ErrInvalidImageBlock
	}
	return filename, nil
}
