package app

import (
	"crypto/rand"
	"errors"
	"fmt"
	"io"
	"log"
	"path/filepath"
	"strings"

	"github.com/mattermost/mattermost-octo-tasks/server/model"
	"github.com/mattermost/mattermost-octo-tasks/server/services/config"
	"github.com/mattermost/mattermost-octo-tasks/server/services/store"
	"github.com/mattermost/mattermost-octo-tasks/server/ws"
	"github.com/mattermost/mattermost-server/v5/services/filesstore"
)

type App struct {
	config       *config.Configuration
	store        store.Store
	wsServer     *ws.WSServer
	filesBackend filesstore.FileBackend
}

func New(config *config.Configuration, store store.Store, wsServer *ws.WSServer, filesBackend filesstore.FileBackend) *App {
	return &App{config: config, store: store, wsServer: wsServer, filesBackend: filesBackend}
}

func (a *App) GetBlocks(parentID string, blockType string) ([]model.Block, error) {
	if len(blockType) > 0 && len(parentID) > 0 {
		return a.store.GetBlocksWithParentAndType(parentID, blockType)
	}
	if len(blockType) > 0 {
		return a.store.GetBlocksWithType(blockType)
	}
	return a.store.GetBlocksWithParent(parentID)
}

func (a *App) GetParentID(blockID string) (string, error) {
	return a.store.GetParentID(blockID)
}

func (a *App) InsertBlock(block model.Block) error {
	return a.store.InsertBlock(block)
}

func (a *App) InsertBlocks(blocks []model.Block) error {
	var blockIDsToNotify = []string{}
	uniqueBlockIDs := make(map[string]bool)

	for _, block := range blocks {
		if !uniqueBlockIDs[block.ID] {
			blockIDsToNotify = append(blockIDsToNotify, block.ID)
		}
		if len(block.ParentID) > 0 && !uniqueBlockIDs[block.ParentID] {
			blockIDsToNotify = append(blockIDsToNotify, block.ParentID)
		}

		err := a.store.InsertBlock(block)
		if err != nil {
			return err
		}
	}

	a.wsServer.BroadcastBlockChangeToWebsocketClients(blockIDsToNotify)
	return nil
}

func (a *App) GetSubTree(blockID string) ([]model.Block, error) {
	return a.store.GetSubTree(blockID)
}

func (a *App) GetAllBlocks() ([]model.Block, error) {
	return a.store.GetAllBlocks()
}

func (a *App) DeleteBlock(blockID string) error {
	var blockIDsToNotify = []string{blockID}
	parentID, err := a.GetParentID(blockID)
	if err != nil {
		return err
	}

	if len(parentID) > 0 {
		blockIDsToNotify = append(blockIDsToNotify, parentID)
	}

	err = a.store.DeleteBlock(blockID)
	if err != nil {
		return err
	}

	a.wsServer.BroadcastBlockChangeToWebsocketClients(blockIDsToNotify)
	return nil
}

func (a *App) SaveFile(reader io.Reader, filename string) (string, error) {
	// NOTE: File extension includes the dot
	fileExtension := strings.ToLower(filepath.Ext(filename))
	if fileExtension == ".jpeg" {
		fileExtension = ".jpg"
	}

	createdFilename := fmt.Sprintf(`%s%s`, createGUID(), fileExtension)

	_, appErr := a.filesBackend.WriteFile(reader, createdFilename)
	if appErr != nil {
		return "", errors.New("unable to store the file in the files storage")
	}
	return fmt.Sprintf(`%s/files/%s`, a.config.ServerRoot, createdFilename), nil
}

func (a *App) GetFilePath(filename string) string {
	folderPath := a.config.FilesPath
	return filepath.Join(folderPath, filename)
}

// CreateGUID returns a random GUID
func createGUID() string {
	b := make([]byte, 16)
	_, err := rand.Read(b)
	if err != nil {
		log.Fatal(err)
	}
	uuid := fmt.Sprintf("%x-%x-%x-%x-%x",
		b[0:4], b[4:6], b[6:8], b[8:10], b[10:])

	return uuid
}
