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

	"github.com/mattermost/mattermost-server/v5/shared/filestore"
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

func (a *App) GetFileReader(workspaceID, rootID, filename string) (filestore.ReadCloseSeeker, error) {
	filePath := filepath.Join(workspaceID, rootID, filename)
	exists, err := a.filesBackend.FileExists(filePath)
	if err != nil {
		return nil, err
	}
	// FIXUP: Check the deprecated old location
	if workspaceID == "0" && !exists {
		oldExists, err := a.filesBackend.FileExists(filename)
		if err != nil {
			return nil, err
		}
		if oldExists {
			err := a.filesBackend.MoveFile(filename, filePath)
			if err != nil {
				a.logger.Error("ERROR moving file", mlog.String("old", filename), mlog.String("new", filePath))
			} else {
				a.logger.Debug("Moved file", mlog.String("old", filename), mlog.String("new", filePath))
			}
		}
	}

	reader, err := a.filesBackend.Reader(filePath)
	if err != nil {
		return nil, err
	}

	return reader, nil
}

func fileExists(path string) bool {
	_, err := os.Stat(path)
	return !os.IsNotExist(err)
}
