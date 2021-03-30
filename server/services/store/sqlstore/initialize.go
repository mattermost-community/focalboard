package sqlstore

import (
	"encoding/json"
	"log"

	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/services/store"
	"github.com/mattermost/focalboard/server/services/store/sqlstore/initializations"
)

// InitializeTemplates imports default templates if the blocks table is empty
func (s *SQLStore) InitializeTemplates() error {
	isNeeded, err := s.isInitializationNeeded()
	if err != nil {
		return err
	}

	if isNeeded {
		return s.importInitialTemplates()
	}

	return nil
}

func (s *SQLStore) importInitialTemplates() error {
	log.Printf("importInitialTemplates")
	blocksJSON := initializations.MustAsset("templates.json")

	var archive model.Archive
	err := json.Unmarshal(blocksJSON, &archive)
	if err != nil {
		return err
	}

	globalContainer := store.Container{
		WorkspaceID: "0",
	}

	log.Printf("Inserting %d blocks", len(archive.Blocks))
	for _, block := range archive.Blocks {
		// log.Printf("\t%v %v %v", block.ID, block.Type, block.Title)
		err := s.InsertBlock(globalContainer, block)
		if err != nil {
			return err
		}
	}

	return nil
}

// isInitializationNeeded returns true if the blocks table is empty
func (s *SQLStore) isInitializationNeeded() (bool, error) {
	query := s.getQueryBuilder().
		Select("count(*)").
		From("blocks")

	row := query.QueryRow()

	var count int
	err := row.Scan(&count)
	if err != nil {
		log.Fatal(err)
		return false, err
	}

	return (count == 0), nil
}
