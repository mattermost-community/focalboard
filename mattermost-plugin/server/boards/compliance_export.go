// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
package boards

import (
	"archive/zip"
	"encoding/csv"
	"encoding/json"
	"io"
	"path"
	"strconv"
	"time"

	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/services/store"
	"github.com/mattermost/mattermost-server/v6/einterfaces"
	"github.com/mattermost/mattermost-server/v6/shared/filestore"
	"github.com/mattermost/mattermost-server/v6/shared/mlog"
)

const (
	BlockMissingFileMessage = "WARNING: file missing for block, cannot copy file to archive"
	BoardsWarningFilename   = "boards-warning.txt"
)

var boardFields = []string{
	"ID",
	"TeamID",
	"ChannelID",
	"Modified by",
	"Modified by email",
	"Modified by username",
	"Type",
	"Minimum role",
	"Title",
	"Description",
	"Icon",
	"Is template",
	"Properties",
	"Card properties",
	"Create at",
	"Update at",
	"Delete at",
}

func boardToLine(board *model.BoardExport) []string {
	return []string{
		board.ID,
		board.TeamID,
		board.ChannelID,
		board.ModifiedBy,
		board.ModifiedByEmail,
		board.ModifiedByUsername,
		board.Type,
		board.MinimumRole,
		board.Title,
		board.Description,
		board.Icon,
		strconv.FormatBool(board.IsTemplate),
		board.Properties,
		board.CardProperties,
		time.Unix(board.CreateAt, 0).UTC().Format(time.RFC3339),
		time.Unix(board.UpdateAt, 0).UTC().Format(time.RFC3339),
		time.Unix(board.DeleteAt, 0).UTC().Format(time.RFC3339),
	}
}

var blockFields = []string{
	"ID",
	"Board ID",
	"Parent ID",
	"Modified by",
	"Modified by email",
	"Modified by username",
	"Type",
	"Title",
	"Fields",
	"Create at",
	"Update at",
	"Delete at",
}

func blockToLine(block *model.BlockExport) []string {
	return []string{
		block.ID,
		block.BoardID,
		block.ParentID,
		block.ModifiedBy,
		block.ModifiedByEmail,
		block.ModifiedByUsername,
		block.Type,
		block.Title,
		block.Fields,
		time.Unix(block.CreateAt, 0).UTC().Format(time.RFC3339),
		time.Unix(block.UpdateAt, 0).UTC().Format(time.RFC3339),
		time.Unix(block.DeleteAt, 0).UTC().Format(time.RFC3339),
	}
}

type BoardsExporter struct {
	boardsToExport []*model.BoardExport
	blocksToExport []*model.BlockExport
	store          store.Store
	logger         mlog.LoggerIFace
}

func (be *BoardsExporter) ExportedEntitiesCount() int {
	return len(be.boardsToExport) + len(be.blocksToExport)
}

func (be *BoardsExporter) CsvExport(zipFile *zip.Writer, fileBackend filestore.FileBackend) error {
	be.logger.Info(
		"Running Boards CSV Export",
		mlog.Int("BoardsToExport", len(be.boardsToExport)),
		mlog.Int("BlocksToExport", len(be.blocksToExport)),
	)

	metadata := &model.ExportMetadata{}
	missingFiles := []string{}

	if len(be.boardsToExport) != 0 {
		boardsFile, err := zipFile.Create("boards.csv")
		if err != nil {
			be.logger.Error("Cannot create boards.csv file inside the export zipfile", mlog.Err(err))
			return err
		}

		boardsWriter := csv.NewWriter(boardsFile)
		if err := boardsWriter.Write(boardFields); err != nil {
			be.logger.Error("Cannot write boards heading line to the boards.csv file", mlog.Err(err))
			return err
		}

		for _, board := range be.boardsToExport {
			if err := boardsWriter.Write(boardToLine(board)); err != nil {
				be.logger.Error("Cannot write contents of board to the boards.csv file", mlog.String("boardID", board.ID), mlog.Err(err))
				return err
			}

			metadata.UpdateBoard(board)
		}

		boardsWriter.Flush()
	}

	if len(be.blocksToExport) != 0 {
		blocksFile, err := zipFile.Create("blocks.csv")
		if err != nil {
			be.logger.Error("Cannot create blocks.csv file inside the export zipfile", mlog.Err(err))
			return err
		}

		blocksWriter := csv.NewWriter(blocksFile)
		if err := blocksWriter.Write(blockFields); err != nil {
			be.logger.Error("Cannot write blocks heading line to the blocks.csv file", mlog.Err(err))
			return err
		}

		for _, block := range be.blocksToExport {
			if err := blocksWriter.Write(blockToLine(block)); err != nil {
				be.logger.Error(
					"Cannot write contents of block to the blocks.csv file",
					mlog.String("blockID", block.ID),
					mlog.Err(err),
				)
				return err
			}

			metadata.UpdateBlock(block)
		}

		blocksWriter.Flush()

		// once blocks.csv has been written, we iterate through blocks
		// again to copy their attachments
		for _, block := range be.blocksToExport {
			if block.Type == model.TypeImage {
				var fieldsData map[string]string
				if err := json.Unmarshal([]byte(block.Fields), &fieldsData); err != nil {
					be.logger.Info(
						"Cannot unmarshal fields from block while looking for attachments",
						mlog.String("blockID", block.ID),
						mlog.Err(err),
					)
					missingFiles = append(missingFiles, BlockMissingFileMessage+"- BlockID: "+block.ID)
					continue
				}

				filename, ok := fieldsData["fileId"]
				if !ok {
					be.logger.Info(
						"Cannot get file id from block of type image",
						mlog.String("blockID", block.ID),
					)
					missingFiles = append(missingFiles, BlockMissingFileMessage+"- BlockID: "+block.ID)
					continue
				}

				board, err := be.store.GetBoard(block.BoardID)
				if err != nil {
					be.logger.Info(
						"Cannot get board for block of type image",
						mlog.String("blockID", block.ID),
						mlog.String("boardID", block.BoardID),
						mlog.Err(err),
					)
					missingFiles = append(missingFiles, BlockMissingFileMessage+"- BlockID: "+block.ID)
					continue
				}

				filePath := path.Join(board.TeamID, board.ID, filename)

				fileExists, err := fileBackend.FileExists(filePath)
				if err != nil {
					be.logger.Info(
						"Cannot check if file exists for block of type image",
						mlog.String("blockID", block.ID),
						mlog.String("filename", filename),
						mlog.String("path", filePath),
						mlog.Err(err),
					)
					missingFiles = append(missingFiles, BlockMissingFileMessage+"- BlockID: "+block.ID+" - "+filePath)
					continue
				}

				if !fileExists {
					be.logger.Info(
						"Cannot add attachment to export zipfile: file doesn't exist",
						mlog.String("blockID", block.ID),
						mlog.String("filename", filename),
						mlog.String("path", filePath),
					)
					missingFiles = append(missingFiles, BlockMissingFileMessage+"- BlockID: "+block.ID+" - "+filePath)
					continue
				}

				var attachmentSrc io.ReadCloser
				attachmentSrc, nErr := fileBackend.Reader(filePath)
				if nErr != nil {
					be.logger.Info(
						"Cannot read attachment from block of type image",
						mlog.String("blockID", block.ID),
						mlog.String("filename", filename),
						mlog.String("path", filePath),
						mlog.Err(nErr),
					)
					missingFiles = append(missingFiles, BlockMissingFileMessage+"- BlockID: "+block.ID+" - "+filePath)
					continue
				}
				defer attachmentSrc.Close()

				attachmentDst, err := zipFile.Create(path.Join("boards-files", block.BoardID, block.ID, filename))
				if err != nil {
					be.logger.Error(
						"Cannot create dest file inside zipfile when copying an attachment",
						mlog.String("blockID", block.ID),
						mlog.String("filename", filename),
						mlog.Err(err),
					)
					return err
				}

				if _, err := io.Copy(attachmentDst, attachmentSrc); err != nil {
					be.logger.Error(
						"Cannot copy attachment file into zipfile",
						mlog.String("blockID", block.ID),
						mlog.String("filename", filename),
						mlog.Err(err),
					)
					return err
				}
			}
		}
	}

	warningCount := len(missingFiles)
	if warningCount != 0 {
		warningsFile, err := zipFile.Create(BoardsWarningFilename)
		if err != nil {
			be.logger.Error("Cannot create boards-warning.txt file inside the export zipfile", mlog.Err(err))
			return err
		}
		for _, value := range missingFiles {
			if _, err := warningsFile.Write([]byte(value + "\n")); err != nil {
				be.logger.Error("Cannot write missing file metadata to the boards-warning.txt file", mlog.Err(err))
				return err
			}
		}
	}

	metadataFile, err := zipFile.Create("boards-metadata.json")
	if err != nil {
		be.logger.Error("Cannot create boards-metadata.csv file inside the export zipfile", mlog.Err(err))
		return err
	}

	data, err := json.MarshalIndent(metadata, "", "  ")
	if err != nil {
		be.logger.Error("Cannot marshal metadata of the boards export", mlog.Err(err))
		return err
	}

	if _, err := metadataFile.Write(data); err != nil {
		be.logger.Error("Cannot write boards metadata to the boards-metadata.csv file", mlog.Err(err))
		return err
	}

	return nil
}

func (b *BoardsApp) Exporter(cursor map[string]any, limit int) (einterfaces.ComplianceExporter, map[string]any, error) {
	b.logger.Info("Generating boards exporter", mlog.Map("cursor", cursor), mlog.Int("limit", limit))

	boardCursor := model.ComplianceExportCursorFromMap(cursor, "Board")
	var boardsToExport []*model.BoardExport
	var boardsErr error
	boardsToExport, boardCursor, boardsErr = b.server.Store().BoardsComplianceExport(boardCursor, limit)
	if boardsErr != nil {
		b.logger.Error("Cannot fetch boards info for compliance export", mlog.Err(boardsErr))
		return nil, nil, boardsErr
	}

	blockCursor := model.ComplianceExportCursorFromMap(cursor, "Block")
	var blocksToExport []*model.BlockExport
	var blocksErr error
	blocksToExport, blockCursor, blocksErr = b.server.Store().BlocksComplianceExport(blockCursor, limit)
	if blocksErr != nil {
		b.logger.Error("Cannot fetch blocks info for compliance export", mlog.Err(blocksErr))
		return nil, nil, blocksErr
	}

	boardsExporter := &BoardsExporter{
		boardsToExport: boardsToExport,
		blocksToExport: blocksToExport,
		store:          b.server.Store(),
		logger:         b.logger,
	}

	updatedCursor := model.MapFromComplianceExportCursors(boardCursor, blockCursor)

	return boardsExporter, updatedCursor, nil
}
