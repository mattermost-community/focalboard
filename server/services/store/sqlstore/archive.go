package sqlstore

import (
	"bufio"
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"

	sq "github.com/Masterminds/squirrel"
	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/services/store"

	"github.com/mattermost/mattermost-server/v6/shared/mlog"
)

type blockModifierInfo struct {
	modifier model.BlockModifier
	cache    map[string]interface{}
}

var (
	ErrUnsupportedLineType = errors.New("unsupported line type")
)

// InitializeTemplates imports default templates if the blocks table is empty.
func (s *SQLStore) importArchive(db sq.BaseRunner, container store.Container, r io.Reader, userID string, mod model.BlockModifier) error {
	s.logger.Debug("importArchive")

	// archives are stored in JSONL format so we must read them
	// line by line.
	reader := bufio.NewReader(r)

	// first line should be the archive header
	line, err := readLine(reader)
	if err != nil {
		return fmt.Errorf("error reading archive header: %w", err)
	}
	var header model.ArchiveHeader
	err = json.Unmarshal(line, &header)
	if err != nil {
		return err
	}

	modInfo := blockModifierInfo{
		modifier: mod,
		cache:    make(map[string]interface{}),
	}

	args := importArchiveLineArgs{
		db:        db,
		container: container,
		userID:    userID,
		modInfo:   modInfo,
	}

	lineNum := 1
	for {
		line, errRead := readLine(reader)
		if len(line) != 0 {
			var archiveLine model.ArchiveLine
			err = json.Unmarshal(line, &archiveLine)
			if err != nil {
				return fmt.Errorf("error parsing archive line %d: %w", lineNum, err)
			}
			if err2 := s.importArchiveLine(&archiveLine, args); err2 != nil {
				return fmt.Errorf("error importing archive line %d: %w", lineNum, err2)
			}
		}

		if errRead != nil {
			if errors.Is(errRead, io.EOF) {
				break
			}
			return fmt.Errorf("error reading archive line %d: %w", lineNum, errRead)
		}

		lineNum++
	}
	return nil
}

type importArchiveLineArgs struct {
	db        sq.BaseRunner
	container store.Container
	userID    string
	modInfo   blockModifierInfo
}

// importArchiveLine parses a single line from an archive and imports it to the database.
func (s *SQLStore) importArchiveLine(line *model.ArchiveLine, args importArchiveLineArgs) error {
	switch line.Type {
	case "block":
		var block model.Block
		err := json.Unmarshal(line.Data, &block)
		if err != nil {
			return err
		}
		if args.modInfo.modifier != nil {
			if !args.modInfo.modifier(&block, args.modInfo.cache) {
				s.logger.Trace("skipping insert block per block modifier",
					mlog.String("blockID", block.ID),
					mlog.String("block_type", block.Type.String()),
					mlog.String("block_title", block.Title),
				)
				return nil
			}
		}

		s.logger.Trace("insert block",
			mlog.String("blockID", block.ID),
			mlog.String("block_type", block.Type.String()),
			mlog.String("block_title", block.Title),
		)
		if err := s.insertBlock(args.db, args.container, &block, args.userID); err != nil {
			return err
		}

	default:
		return fmt.Errorf("%w (%s)", ErrUnsupportedLineType, line.Type)
	}
	return nil
}

func readLine(r *bufio.Reader) ([]byte, error) {
	line, err := r.ReadBytes('\n')
	line = bytes.TrimSpace(line)
	return line, err
}
