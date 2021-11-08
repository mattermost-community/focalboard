package app

import (
	"fmt"
	"strconv"

	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/utils"

	"github.com/mattermost/mattermost-server/v6/shared/mlog"
)

const (
	UniqueIDsMigrationKey = "UniqueIDsMigrationComplete"
)

func (a *App) doUniqueIDsMigration() error {
	setting, err := a.store.GetSystemSetting(UniqueIDsMigrationKey)
	if err != nil {
		return fmt.Errorf("cannot get migration state: %w", err)
	}

	// If the migration is already completed, do not run it again.
	if hasAlreadyRun, _ := strconv.ParseBool(setting); hasAlreadyRun {
		return nil
	}

	blocks, err := a.store.GetBlocksWithSameID()
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
			if err := a.store.ReplaceBlockID(block.ID, newID, block.WorkspaceID); err != nil {
				return fmt.Errorf("cannot replace blockID %s: %w", block.ID, err)
			}
		}
	}

	if err := a.store.SetSystemSetting(UniqueIDsMigrationKey, strconv.FormatBool(true)); err != nil {
		return fmt.Errorf("cannot mark migration as completed: %w", err)
	}

	return nil
}

func (a *App) DoAppMigrations() error {
	if err := a.doUniqueIDsMigration(); err != nil {
		a.logger.Error("Error running unique IDs migration", mlog.Err(err))
		return err
	}

	return nil
}
