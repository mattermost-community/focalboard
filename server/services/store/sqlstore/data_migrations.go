package sqlstore

import (
	"fmt"
	"strconv"

	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/utils"
)

const (
	UniqueIDsMigrationKey = "UniqueIDsMigrationComplete"
)

func (s *SQLStore) runUniqueIDsMigration() error {
	setting, err := s.GetSystemSetting(UniqueIDsMigrationKey)
	if err != nil {
		return fmt.Errorf("cannot get migration state: %w", err)
	}

	// If the migration is already completed, do not run it again.
	if hasAlreadyRun, _ := strconv.ParseBool(setting); hasAlreadyRun {
		return nil
	}

	s.logger.Debug("Running Unique IDs migration")

	blocks, err := s.GetBlocksWithSameID()
	if err != nil {
		return fmt.Errorf("cannot get blocks with same ID: %w", err)
	}

	blocksByID := map[string][]model.Block{}
	for _, block := range blocks {
		blocksByID[block.ID] = append(blocksByID[block.ID], block)
	}

	for _, blocks := range blocksByID {
		for i, block := range blocks {
			if i == 0 {
				// do nothing for the first ID, only updating the others
				continue
			}

			newID := utils.NewID(model.BlockType2IDType(block.Type))
			if err := s.ReplaceBlockID(block.ID, newID, block.WorkspaceID); err != nil {
				return fmt.Errorf("cannot replace blockID %s: %w", block.ID, err)
			}
		}
	}

	if err := s.SetSystemSetting(UniqueIDsMigrationKey, strconv.FormatBool(true)); err != nil {
		return fmt.Errorf("cannot mark migration as completed: %w", err)
	}

	s.logger.Debug("Unique IDs migration finished successfully")
	return nil
}
