package app

import (
	"bytes"
	"fmt"
	"strings"

	_ "embed"

	"github.com/mattermost/focalboard/server/model"

	"github.com/mattermost/mattermost-server/v6/shared/mlog"
)

const (
	defaultTemplateVersion = 2
)

//go:embed templates.boardarchive
var defTemplates []byte

// initializeTemplates imports default templates if the blocks table is empty.
func (a *App) initializeTemplates() error {
	blocks, err := a.store.GetDefaultTemplateBlocks()
	if err != nil {
		return fmt.Errorf("cannot initialize templates: %w", err)
	}

	a.logger.Debug("Fetched template blocks", mlog.Int("count", len(blocks)))

	isNeeded, reason := a.isInitializationNeeded(blocks)
	if !isNeeded {
		a.logger.Debug("Template import not needed, skipping")
		return nil
	}

	a.logger.Debug("Importing new default templates", mlog.String("reason", reason))

	if err := a.store.RemoveDefaultTemplates(blocks); err != nil {
		return fmt.Errorf("cannot remove old templates: %w", err)
	}

	r := bytes.NewReader(defTemplates)

	opt := model.ImportArchiveOptions{
		WorkspaceID:   "0",
		ModifiedBy:    "system",
		BlockModifier: fixTemplateBlock,
	}

	return a.ImportArchive(r, opt)
}

// isInitializationNeeded returns true if the blocks table contains no default templates,
// or contains at least one default template with an old version number.
func (a *App) isInitializationNeeded(blocks []model.Block) (bool, string) {
	if len(blocks) == 0 {
		return true, "no default templates found"
	}

	// look for any template blocks with the wrong version number (or no version #).
	for _, block := range blocks {
		v, ok := block.Fields["templateVer"]
		if !ok {
			return true, "block missing templateVer"
		}
		version, ok := v.(float64)
		if !ok {
			return true, "templateVer NaN"
		}
		if version < defaultTemplateVersion {
			return true, "templateVer too old"
		}
	}
	return false, ""
}

// fixTemplateBlock fixes a block to be inserted as part of a template.
func fixTemplateBlock(block *model.Block, cache map[string]interface{}) bool {
	// cache contains ids of skipped blocks. Ensure their children are skipped as well.
	if _, ok := cache[block.ParentID]; ok {
		cache[block.ID] = struct{}{}
		return false
	}

	// filter out template blocks; we only want the non-template
	// blocks which we will turn into default template blocks.
	if b, ok := block.Fields["isTemplate"]; ok {
		if val, ok := b.(bool); ok && val {
			cache[block.ID] = struct{}{}
			return false
		}
	}

	// remove '(NEW)' from title & force template flag
	if block.Type == model.TypeBoard {
		block.Title = strings.ReplaceAll(block.Title, "(NEW)", "")
		block.Fields["isTemplate"] = true
		block.Fields["templateVer"] = defaultTemplateVersion
	}
	return true
}
