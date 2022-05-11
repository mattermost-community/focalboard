package app

import (
	"errors"
	"fmt"
	"github.com/mattermost/mattermost-server/v6/model"
	"io"
	"path/filepath"
	"strings"

	"github.com/mattermost/focalboard/server/utils"

	"github.com/mattermost/mattermost-server/v6/shared/mlog"

	"github.com/mattermost/mattermost-server/v6/shared/filestore"
)

func (a *App) SaveFile(reader io.Reader, workspaceID, rootID, filename string) (string, error) {
	// NOTE: File extension includes the dot
	fileExtension := strings.ToLower(filepath.Ext(filename))
	if fileExtension == ".jpeg" {
		fileExtension = ".jpg"
	}

	createdFilename := utils.NewID(utils.IDTypeNone)
	fullFilename := fmt.Sprintf(`%s%s`, createdFilename, fileExtension)
	filePath := filepath.Join(workspaceID, rootID, fullFilename)

	fileSize, appErr := a.filesBackend.WriteFile(reader, filePath)
	if appErr != nil {
		return "", fmt.Errorf("unable to store the file in the files storage: %w", appErr)
	}

	now := utils.GetMillis()

	fileInfo := &model.FileInfo{
		Id:              createdFilename[1:],
		CreatorId:       "boards",
		PostId:          " ",
		ChannelId:       " ",
		CreateAt:        now,
		UpdateAt:        now,
		DeleteAt:        0,
		Path:            " ",
		ThumbnailPath:   " ",
		PreviewPath:     " ",
		Name:            filename,
		Extension:       fileExtension,
		Size:            fileSize,
		MimeType:        " ",
		Width:           0,
		Height:          0,
		HasPreviewImage: false,
		MiniPreview:     nil,
		Content:         "",
		RemoteId:        nil,
	}
	err := a.store.SaveFileInfo(fileInfo)
	if appErr != nil {
		return "", err
	}

	return fullFilename, nil
}

func (a *App) GetFileInfo(filename string) (*model.FileInfo, error) {
	if len(filename) == 0 {
		return nil, errors.New("IsFileArchived: empty filename not allowed")
	}

	// filename is in the format 7<some-alphanumeric-string>.<extension>
	// we want to extract the <some-alphanumeric-string> part of this as this
	// will be the fileinfo id.
	parts := strings.Split(filename, ".")
	fileInfoId := parts[0][1:]
	fileInfo, err := a.store.GetFileInfo(fileInfoId)
	if err != nil {
		return nil, err
	}

	if fileInfo == nil {
		return nil, nil
	}

	return fileInfo, nil
}

func (a *App) GetFileReader(workspaceID, rootID, filename string) (filestore.ReadCloseSeeker, error) {
	filePath := filepath.Join(workspaceID, rootID, filename)
	exists, err := a.filesBackend.FileExists(filePath)
	if err != nil {
		return nil, err
	}
	// FIXUP: Check the deprecated old location
	if workspaceID == "0" && !exists {
		oldExists, err2 := a.filesBackend.FileExists(filename)
		if err2 != nil {
			return nil, err2
		}
		if oldExists {
			err2 := a.filesBackend.MoveFile(filename, filePath)
			if err2 != nil {
				a.logger.Error("ERROR moving file",
					mlog.String("old", filename),
					mlog.String("new", filePath),
					mlog.Err(err2),
				)
			} else {
				a.logger.Debug("Moved file",
					mlog.String("old", filename),
					mlog.String("new", filePath),
				)
			}
		}
	}

	reader, err := a.filesBackend.Reader(filePath)
	if err != nil {
		return nil, err
	}

	return reader, nil
}
