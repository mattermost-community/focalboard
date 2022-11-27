// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
package model

import (
	mmModel "github.com/mattermost/mattermost-server/v6/model"
)

type ExportMetadata struct {
	BoardsCount      int
	BlocksCount      int
	AttachmentsCount int
	BlockStartTime   int64
	BlockEndTime     int64
	BoardStartTime   int64
	BoardEndTime     int64
}

func (em *ExportMetadata) UpdateBlock(block *BlockExport) {
	em.BlocksCount += 1
	if block.Type == TypeImage {
		em.AttachmentsCount += 1
	}
	if em.BlockStartTime == 0 {
		em.BlockStartTime = block.UpdateAt
	}
	em.BlockEndTime = block.UpdateAt
}

func (em *ExportMetadata) UpdateBoard(board *BoardExport) {
	em.BoardsCount += 1
	if em.BoardStartTime == 0 {
		em.BoardStartTime = board.UpdateAt
	}
	em.BoardEndTime = board.UpdateAt
}

type BlockExport struct {
	ID                 string
	BoardID            string
	ParentID           string
	ModifiedBy         string
	ModifiedByEmail    string
	ModifiedByUsername string
	Type               string
	Title              string
	Fields             string
	CreateAt           int64
	UpdateAt           int64
	DeleteAt           int64
}

type BoardExport struct {
	ID                 string
	TeamID             string
	ChannelID          string
	ModifiedBy         string
	ModifiedByEmail    string
	ModifiedByUsername string
	Type               string
	MinimumRole        string
	Title              string
	Description        string
	Icon               string
	IsTemplate         bool
	Properties         string
	CardProperties     string
	CreateAt           int64
	UpdateAt           int64
	DeleteAt           int64
}

type ComplianceExportCursor struct {
	LastUpdateAt int64
	LastID       string
}

func ComplianceExportCursorFromMap(m map[string]any, entity string) ComplianceExportCursor {
	var cursor ComplianceExportCursor

	var lastUpdateKey, lastIDKey string
	switch entity {
	case "Board":
		lastUpdateKey = mmModel.ComplianceCursorLastBoardUpdateAt
		lastIDKey = mmModel.ComplianceCursorLastBoardID
	case "Block":
		lastUpdateKey = mmModel.ComplianceCursorLastBlockUpdateAt
		lastIDKey = mmModel.ComplianceCursorLastBlockID
	}

	if lastUpdateAt, ok := m[lastUpdateKey].(int64); ok {
		cursor.LastUpdateAt = lastUpdateAt
	}

	if lastID, ok := m[lastIDKey].(string); ok {
		cursor.LastID = lastID
	}

	return cursor
}

func MapFromComplianceExportCursors(boardsCursor, blocksCursor ComplianceExportCursor) map[string]any {
	m := map[string]any{}

	if boardsCursor.LastUpdateAt != 0 {
		m[mmModel.ComplianceCursorLastBoardUpdateAt] = boardsCursor.LastUpdateAt
	}

	if boardsCursor.LastID != "" {
		m[mmModel.ComplianceCursorLastBoardID] = boardsCursor.LastID
	}

	if blocksCursor.LastUpdateAt != 0 {
		m[mmModel.ComplianceCursorLastBlockUpdateAt] = blocksCursor.LastUpdateAt
	}

	if blocksCursor.LastID != "" {
		m[mmModel.ComplianceCursorLastBlockID] = blocksCursor.LastID
	}

	return m
}
