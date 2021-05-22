package app

import (
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"

	"github.com/mattermost/focalboard/server/services/mlog"
	"github.com/mattermost/focalboard/server/utils"
)

func (a *App) SaveFile(reader io.Reader, workspaceID, rootID, filename string) (string, error) {
	// NOTE: File extension includes the dot
	fileExtension := strings.ToLower(filepath.Ext(filename))
	if fileExtension == ".jpeg" {
		fileExtension = ".jpg"
	}

	createdFilename := fmt.Sprintf(`%s%s`, utils.CreateGUID(), fileExtension)
	filePath := filepath.Join(workspaceID, rootID, createdFilename)

	_, appErr := a.filesBackend.WriteFile(reader, filePath)
	if appErr != nil {
		return "", errors.New("unable to store the file in the files storage")
	}

	return createdFilename, nil
}

func (a *App) GetFilePath(workspaceID, rootID, filename string) string {
	folderPath := a.config.FilesPath
	rootPath := filepath.Join(folderPath, workspaceID, rootID)

	filePath := filepath.Join(rootPath, filename)

	// FIXUP: Check the deprecated old location
	if workspaceID == "0" && !fileExists(filePath) {
		oldFilePath := filepath.Join(folderPath, filename)
		if fileExists(oldFilePath) {
			err := os.Rename(oldFilePath, filePath)
			if err != nil {
				a.logger.Error("ERROR moving file", mlog.String("old", oldFilePath), mlog.String("new", filePath))
			} else {
				a.logger.Debug("Moved file", mlog.String("old", oldFilePath), mlog.String("new", filePath))
			}
		}
	}

	return filePath
}

func fileExists(path string) bool {
	_, err := os.Stat(path)
	return !os.IsNotExist(err)
}
