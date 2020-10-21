package app

import (
	"crypto/rand"
	"errors"
	"fmt"
	"io"
	"log"
	"path/filepath"
	"strings"
)

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
