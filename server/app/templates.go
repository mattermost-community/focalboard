package app

import (
	"bytes"
	"database/sql"
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

func (a *App) InitTemplates() error {
	return a.initializeTemplates()
}

// initializeTemplates imports default templates if the blocks table is empty.
func (a *App) initializeTemplates() error {
	teams, err := a.store.GetAllTeams()
	if err != nil && err != sql.ErrNoRows {
		return fmt.Errorf("cannot initialize templates: %w", err)
	}
	for _, team := range teams {
		boards, err := a.store.GetTemplateBoards(team.ID)
		if err != nil {
			return fmt.Errorf("cannot initialize templates: %w", err)
		}

		a.logger.Debug("Fetched template boards", mlog.Int("count", len(boards)))

		isNeeded, reason := a.isInitializationNeeded(boards)
		if !isNeeded {
			a.logger.Debug("Template import not needed, skipping")
			return nil
		}

		a.logger.Debug("Importing new default templates", mlog.String("reason", reason))

		if err := a.store.RemoveDefaultTemplates(boards); err != nil {
			return fmt.Errorf("cannot remove old templates: %w", err)
		}

		r := bytes.NewReader(defTemplates)

		opt := model.ImportArchiveOptions{
			TeamID:        team.ID,
			ModifiedBy:    "system",
			BoardModifier: fixTemplateBoard,
		}
		if err = a.ImportArchive(r, opt); err != nil {
			return fmt.Errorf("cannot initialize templates for team %s: %w", team.ID, err)
		}
	}
	return nil
}

// isInitializationNeeded returns true if the blocks table contains no default templates,
// or contains at least one default template with an old version number.
func (a *App) isInitializationNeeded(boards []*model.Board) (bool, string) {
	if len(boards) == 0 {
		return true, "no default templates found"
	}

	// look for any template blocks with the wrong version number (or no version #).
	for _, board := range boards {
		if board.TemplateVersion < defaultTemplateVersion {
			return true, "template_version too old"
		}
	}
	return false, ""
}

// fixTemplateBoard fixes a board to be inserted as part of a template.
func fixTemplateBoard(board *model.Board, cache map[string]interface{}) bool {
	// filter out template blocks; we only want the non-template
	// blocks which we will turn into default template blocks.
	if board.IsTemplate {
		cache[board.ID] = struct{}{}
	}

	// remove '(NEW)' from title & force template flag
	board.Title = strings.ReplaceAll(board.Title, "(NEW)", "")
	board.IsTemplate = true
	board.TemplateVersion = defaultTemplateVersion
	return true
}
