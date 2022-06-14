// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package product

import (
	"fmt"
	"math"
	"net/url"
	"path"
	"strings"

	"github.com/mattermost/focalboard/server/services/config"
	mmModel "github.com/mattermost/mattermost-server/v6/model"
	"github.com/mattermost/mattermost-server/v6/shared/markdown"
)

const (
	boardsFeatureFlagName = "BoardsFeatureFlags"
	pluginName            = "focalboard"
	sharedBoardsName      = "enablepublicsharedboards"

	notifyFreqCardSecondsKey  = "notify_freq_card_seconds"
	notifyFreqBoardSecondsKey = "notify_freq_board_seconds"
)

type BoardsEmbed struct {
	OriginalPath string `json:"originalPath"`
	TeamID       string `json:"teamID"`
	ViewID       string `json:"viewID"`
	BoardID      string `json:"boardID"`
	CardID       string `json:"cardID"`
	ReadToken    string `json:"readToken,omitempty"`
}

func createBoardsConfig(mmconfig mmModel.Config, baseURL string, serverID string) *config.Configuration {
	filesS3Config := config.AmazonS3Config{}
	if mmconfig.FileSettings.AmazonS3AccessKeyId != nil {
		filesS3Config.AccessKeyID = *mmconfig.FileSettings.AmazonS3AccessKeyId
	}
	if mmconfig.FileSettings.AmazonS3SecretAccessKey != nil {
		filesS3Config.SecretAccessKey = *mmconfig.FileSettings.AmazonS3SecretAccessKey
	}
	if mmconfig.FileSettings.AmazonS3Bucket != nil {
		filesS3Config.Bucket = *mmconfig.FileSettings.AmazonS3Bucket
	}
	if mmconfig.FileSettings.AmazonS3PathPrefix != nil {
		filesS3Config.PathPrefix = *mmconfig.FileSettings.AmazonS3PathPrefix
	}
	if mmconfig.FileSettings.AmazonS3Region != nil {
		filesS3Config.Region = *mmconfig.FileSettings.AmazonS3Region
	}
	if mmconfig.FileSettings.AmazonS3Endpoint != nil {
		filesS3Config.Endpoint = *mmconfig.FileSettings.AmazonS3Endpoint
	}
	if mmconfig.FileSettings.AmazonS3SSL != nil {
		filesS3Config.SSL = *mmconfig.FileSettings.AmazonS3SSL
	}
	if mmconfig.FileSettings.AmazonS3SignV2 != nil {
		filesS3Config.SignV2 = *mmconfig.FileSettings.AmazonS3SignV2
	}
	if mmconfig.FileSettings.AmazonS3SSE != nil {
		filesS3Config.SSE = *mmconfig.FileSettings.AmazonS3SSE
	}
	if mmconfig.FileSettings.AmazonS3Trace != nil {
		filesS3Config.Trace = *mmconfig.FileSettings.AmazonS3Trace
	}

	enableTelemetry := false
	if mmconfig.LogSettings.EnableDiagnostics != nil {
		enableTelemetry = *mmconfig.LogSettings.EnableDiagnostics
	}

	enablePublicSharedBoards := false
	if mmconfig.PluginSettings.Plugins[pluginName][sharedBoardsName] == true {
		enablePublicSharedBoards = true
	}

	enableBoardsDeletion := false
	if mmconfig.DataRetentionSettings.EnableBoardsDeletion != nil {
		enableBoardsDeletion = true
	}

	featureFlags := parseFeatureFlags(mmconfig.FeatureFlags.ToMap())

	return &config.Configuration{
		ServerRoot:               baseURL + "/plugins/focalboard",
		Port:                     -1,
		DBType:                   *mmconfig.SqlSettings.DriverName,
		DBConfigString:           *mmconfig.SqlSettings.DataSource,
		DBTablePrefix:            "focalboard_",
		UseSSL:                   false,
		SecureCookie:             true,
		WebPath:                  path.Join(*mmconfig.PluginSettings.Directory, "focalboard", "pack"),
		FilesDriver:              *mmconfig.FileSettings.DriverName,
		FilesPath:                *mmconfig.FileSettings.Directory,
		FilesS3Config:            filesS3Config,
		MaxFileSize:              *mmconfig.FileSettings.MaxFileSize,
		Telemetry:                enableTelemetry,
		TelemetryID:              serverID,
		WebhookUpdate:            []string{},
		SessionExpireTime:        2592000,
		SessionRefreshTime:       18000,
		LocalOnly:                false,
		EnableLocalMode:          false,
		LocalModeSocketLocation:  "",
		AuthMode:                 "mattermost",
		EnablePublicSharedBoards: enablePublicSharedBoards,
		FeatureFlags:             featureFlags,
		NotifyFreqCardSeconds:    getPluginSettingInt(mmconfig, notifyFreqCardSecondsKey, 120),
		NotifyFreqBoardSeconds:   getPluginSettingInt(mmconfig, notifyFreqBoardSecondsKey, 86400),
		EnableDataRetention:      enableBoardsDeletion,
		DataRetentionDays:        *mmconfig.DataRetentionSettings.BoardsRetentionDays,
	}
}

func getPluginSetting(mmConfig mmModel.Config, key string) (interface{}, bool) {
	plugin, ok := mmConfig.PluginSettings.Plugins[pluginName]
	if !ok {
		return nil, false
	}

	val, ok := plugin[key]
	if !ok {
		return nil, false
	}
	return val, true
}

func getPluginSettingInt(mmConfig mmModel.Config, key string, def int) int {
	val, ok := getPluginSetting(mmConfig, key)
	if !ok {
		return def
	}
	valFloat, ok := val.(float64)
	if !ok {
		return def
	}
	return int(math.Round(valFloat))
}

func parseFeatureFlags(configFeatureFlags map[string]string) map[string]string {
	featureFlags := make(map[string]string)
	for key, value := range configFeatureFlags {
		// Break out FeatureFlags and pass remaining
		if key == boardsFeatureFlagName {
			for _, flag := range strings.Split(value, "-") {
				featureFlags[flag] = "true"
			}
		} else {
			featureFlags[key] = value
		}
	}
	return featureFlags
}

func getFirstLinkAndShortenAllBoardsLink(postMessage string) (firstLink, newPostMessage string) {
	newPostMessage = postMessage
	seenLinks := make(map[string]bool)
	markdown.Inspect(postMessage, func(blockOrInline interface{}) bool {
		if autoLink, ok := blockOrInline.(*markdown.Autolink); ok {
			link := autoLink.Destination()

			if firstLink == "" {
				firstLink = link
			}

			if seen := seenLinks[link]; !seen && isBoardsLink(link) {
				// TODO: Make sure that <Jump To Card> is Internationalized and translated to the Users Language preference
				markdownFormattedLink := fmt.Sprintf("[%s](%s)", "<Jump To Card>", link)
				newPostMessage = strings.ReplaceAll(newPostMessage, link, markdownFormattedLink)
				seenLinks[link] = true
			}
		}
		if inlineLink, ok := blockOrInline.(*markdown.InlineLink); ok {
			if link := inlineLink.Destination(); firstLink == "" {
				firstLink = link
			}
		}
		return true
	})

	return firstLink, newPostMessage
}

func returnBoardsParams(pathArray []string) (teamID, boardID, viewID, cardID string) {
	// The reason we are doing this search for the first instance of boards or plugins is to take into account URL subpaths
	index := -1
	for i := 0; i < len(pathArray); i++ {
		if pathArray[i] == "boards" || pathArray[i] == "plugins" {
			index = i
			break
		}
	}

	if index == -1 {
		return teamID, boardID, viewID, cardID
	}

	// If at index, the parameter in the path is boards,
	// then we've copied this directly as logged in user of that board

	// If at index, the parameter in the path is plugins,
	// then we've copied this from a shared board

	// For card links copied on a non-shared board, the path looks like {...Mattermost Url}.../boards/team/teamID/boardID/viewID/cardID

	// For card links copied on a shared board, the path looks like
	// {...Mattermost Url}.../plugins/focalboard/team/teamID/shared/boardID/viewID/cardID?r=read_token

	// This is a non-shared board card link
	if len(pathArray)-index == 6 && pathArray[index] == "boards" && pathArray[index+1] == "team" {
		teamID = pathArray[index+2]
		boardID = pathArray[index+3]
		viewID = pathArray[index+4]
		cardID = pathArray[index+5]
	} else if len(pathArray)-index == 8 && pathArray[index] == "plugins" &&
		pathArray[index+1] == "focalboard" &&
		pathArray[index+2] == "team" &&
		pathArray[index+4] == "shared" { // This is a shared board card link
		teamID = pathArray[index+3]
		boardID = pathArray[index+5]
		viewID = pathArray[index+6]
		cardID = pathArray[index+7]
	}
	return teamID, boardID, viewID, cardID
}

func isBoardsLink(link string) bool {
	u, err := url.Parse(link)

	if err != nil {
		return false
	}

	urlPath := u.Path
	urlPath = strings.TrimPrefix(urlPath, "/")
	urlPath = strings.TrimSuffix(urlPath, "/")
	pathSplit := strings.Split(strings.ToLower(urlPath), "/")

	if len(pathSplit) == 0 {
		return false
	}

	teamID, boardID, viewID, cardID := returnBoardsParams(pathSplit)
	return teamID != "" && boardID != "" && viewID != "" && cardID != ""
}
