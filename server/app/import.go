package app

import (
	"bufio"
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"path"
	"path/filepath"
	"strings"

	"github.com/krolaw/zipstream"

	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/utils"

	"github.com/mattermost/mattermost-server/v6/shared/mlog"
)

const (
	archiveVersion  = 2
	legacyFileBegin = "{\"version\":1"
)

// ImportArchive imports an archive containing zero or more boards, plus all
// associated content, including cards, content blocks, views, and images.
//
// Archives are ZIP files containing a `version.json` file and zero or more
// directories, each containing a `board.jsonl` and zero or more image files.
func (a *App) ImportArchive(r io.Reader, opt model.ImportArchiveOptions) error {
	// peek at the first bytes to see if this is a legacy archive format
	br := bufio.NewReader(r)
	peek, err := br.Peek(len(legacyFileBegin))
	if err == nil && string(peek) == legacyFileBegin {
		a.logger.Debug("importing legacy archive")
		_, errImport := a.ImportBoardJSONL(br, opt)
		return errImport
	}

	a.logger.Debug("importing archive")
	zr := zipstream.NewReader(br)

	boardMap := make(map[string]string) // maps old board ids to new

	for {
		hdr, err := zr.Next()
		if err != nil {
			if errors.Is(err, io.EOF) {
				a.logger.Debug("import archive - done", mlog.Int("boards_imported", len(boardMap)))
				return nil
			}
			return err
		}

		dir, filename := path.Split(hdr.Name)
		dir = path.Clean(dir)

		switch filename {
		case "version.json":
			ver, errVer := parseVersionFile(zr)
			if errVer != nil {
				return errVer
			}
			if ver != archiveVersion {
				return model.NewErrUnsupportedArchiveVersion(ver, archiveVersion)
			}
		case "board.jsonl":
			boardID, err := a.ImportBoardJSONL(zr, opt)
			if err != nil {
				return fmt.Errorf("cannot import board %s: %w", dir, err)
			}
			boardMap[dir] = boardID
		default:
			// import file/image;  dir is the old board id
			boardID, ok := boardMap[dir]
			if !ok {
				a.logger.Error("skipping orphan image in archive",
					mlog.String("dir", dir),
					mlog.String("filename", filename),
				)
				continue
			}
			// save file with original filename so it matches name in image block.
			filePath := filepath.Join(opt.TeamID, boardID, filename)
			_, err := a.filesBackend.WriteFile(zr, filePath)
			if err != nil {
				return fmt.Errorf("cannot import file %s for board %s: %w", filename, dir, err)
			}
		}

		a.logger.Trace("import archive file",
			mlog.String("dir", dir),
			mlog.String("filename", filename),
		)
	}
}

// ImportBoardJSONL imports a JSONL file containing blocks for one board. The resulting
// board id is returned.
func (a *App) ImportBoardJSONL(r io.Reader, opt model.ImportArchiveOptions) (string, error) {
	// TODO: Stream this once `model.GenerateBlockIDs` can take a stream of blocks.
	//       We don't want to load the whole file in memory, even though it's a single board.
	boardsAndBlocks := &model.BoardsAndBlocks{
		Blocks: make([]model.Block, 0, 10),
		Boards: make([]*model.Board, 0, 10),
	}
	lineReader := bufio.NewReader(r)

	userID := opt.ModifiedBy
	if userID == model.SingleUser {
		userID = ""
	}
	now := utils.GetMillis()

	lineNum := 1
	for {
		line, errRead := readLine(lineReader)
		if len(line) != 0 {
			var skip bool
			if lineNum == 1 {
				// first line might be a header tag (old archive format)
				if strings.HasPrefix(string(line), legacyFileBegin) {
					skip = true
				}
			}

			if !skip {
				var archiveLine model.ArchiveLine
				if err := json.Unmarshal(line, &archiveLine); err != nil {
					return "", fmt.Errorf("error parsing archive line %d: %w", lineNum, err)
				}
				switch archiveLine.Type {
				case "block":
					var block model.Block
					if err2 := json.Unmarshal(archiveLine.Data, &block); err2 != nil {
						return "", fmt.Errorf("invalid block in archive line %d: %w", lineNum, err2)
					}
					block.ModifiedBy = userID
					block.UpdateAt = now
					boardsAndBlocks.Blocks = append(boardsAndBlocks.Blocks, block)
				case "board":
					var board model.Board
					if err2 := json.Unmarshal(archiveLine.Data, &board); err2 != nil {
						return "", fmt.Errorf("invalid block in archive line %d: %w", lineNum, err2)
					}
					board.ModifiedBy = userID
					board.UpdateAt = now
					board.TeamID = opt.TeamID
					boardsAndBlocks.Boards = append(boardsAndBlocks.Boards, &board)
				default:
					return "", model.NewErrUnsupportedArchiveLineType(lineNum, archiveLine.Type)
				}
			}
		}

		if errRead != nil {
			if errors.Is(errRead, io.EOF) {
				break
			}
			return "", fmt.Errorf("error reading archive line %d: %w", lineNum, errRead)
		}
		lineNum++
	}

	modInfoCache := make(map[string]interface{})
	modBoards := make([]*model.Board, 0, len(boardsAndBlocks.Boards))
	for _, board := range boardsAndBlocks.Boards {
		b := *board
		if opt.BoardModifier != nil && !opt.BoardModifier(&b, modInfoCache) {
			a.logger.Debug("skipping insert block per block modifier",
				mlog.String("blockID", board.ID),
			)
			continue
		}
		modBoards = append(modBoards, &b)
	}
	boardsAndBlocks.Boards = modBoards

	var err error
	boardsAndBlocks, err = model.GenerateBoardsAndBlocksIDs(boardsAndBlocks, a.logger)
	if err != nil {
		return "", fmt.Errorf("error inserting archive blocks: %w", err)
	}

	boardsAndBlocks, err = a.CreateBoardsAndBlocks(boardsAndBlocks, opt.ModifiedBy, false)
	if err != nil {
		return "", fmt.Errorf("error inserting archive blocks: %w", err)
	}

	// find new board id
	for _, board := range boardsAndBlocks.Boards {
		return board.ID, nil
	}
	return "", fmt.Errorf("missing board in archive: %w", model.ErrInvalidBoardBlock)
}

func parseVersionFile(r io.Reader) (int, error) {
	file, err := io.ReadAll(r)
	if err != nil {
		return 0, fmt.Errorf("cannot read version.json: %w", err)
	}

	var header model.ArchiveHeader
	if err := json.Unmarshal(file, &header); err != nil {
		return 0, fmt.Errorf("cannot parse version.json: %w", err)
	}
	return header.Version, nil
}

func readLine(r *bufio.Reader) ([]byte, error) {
	line, err := r.ReadBytes('\n')
	line = bytes.TrimSpace(line)
	return line, err
}
