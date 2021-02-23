package app

import (
	"errors"
	"fmt"
	"io"
	"path/filepath"
	"strings"

	"github.com/mattermost/focalboard/server/utils"
)

func (a *App) SaveFile(reader io.Reader, filename string) (string, error) {
	// NOTE: File extension includes the dot
	fileExtension := strings.ToLower(filepath.Ext(filename))
	if fileExtension == ".jpeg" {
		fileExtension = ".jpg"
	}

	createdFilename := fmt.Sprintf(`%s%s`, utils.CreateGUID(), fileExtension)

	_, appErr := a.filesBackend.WriteFile(reader, createdFilename)
	if appErr != nil {
		return "", errors.New("unable to store the file in the files storage")
	}

	return createdFilename, nil
}

func (a *App) GetFilePath(filename string) string {
	folderPath := a.config.FilesPath

	return filepath.Join(folderPath, filename)
}
