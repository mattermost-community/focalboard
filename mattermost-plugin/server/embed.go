package main

import (
	"encoding/json"
	"fmt"
	"net/url"
	"strings"

	mmModel "github.com/mattermost/mattermost-server/v6/model"
	"github.com/mattermost/mattermost-server/v6/shared/markdown"
)

type BoardsEmbed struct {
	OriginalPath string `json:"originalPath"`
	WorkspaceID  string `json:"workspaceID"`
	BoardID      string `json:"boardID"`
	CardID       string `json:"cardID"`
	ReadToken    string `json:"readToken,omitempty"`
}

func postWithBoardsEmbed(post *mmModel.Post, showBoardsUnfurl bool) (*mmModel.Post, error) {
	if _, ok := post.GetProps()["boards"]; ok {
		post.AddProp("boards", nil)
	}

	if !showBoardsUnfurl {
		return post, nil
	}

	firstLink := getFirstLink(post.Message)

	if firstLink == "" {
		return post, nil
	}

	u, err := url.Parse(firstLink)
	if err != nil {
		return post, fmt.Errorf("could not parse first link: %w", err)
	}

	// Trim away the first / because otherwise after we split the string, the first element in the array is a empty element
	urlPath := u.Path
	urlPath = strings.TrimPrefix(urlPath, "/")
	urlPath = strings.TrimSuffix(urlPath, "/")

	pathSplit := strings.Split(strings.ToLower(urlPath), "/")
	queryParams := u.Query()

	if len(pathSplit) == 0 {
		return post, nil
	}

	workspaceID, boardID, _, cardID := returnBoardsParams(pathSplit)

	if workspaceID == "" || boardID == "" || cardID == "" {
		return post, nil
	}

	embed := BoardsEmbed{
		WorkspaceID:  workspaceID,
		BoardID:      boardID,
		CardID:       cardID,
		ReadToken:    queryParams.Get("r"),
		OriginalPath: u.RequestURI(),
	}

	return embedLinkInPost(post, embed)
}

func embedLinkInPost(post *mmModel.Post, embed BoardsEmbed) (*mmModel.Post, error) {
	b, err := json.Marshal(embed)
	if err != nil {
		return post, fmt.Errorf("could not marshal BoardsEmbed: %w", err)
	}

	BoardsPostEmbed := &mmModel.PostEmbed{
		Type: mmModel.PostEmbedBoards,
		Data: string(b),
	}

	if post.Metadata == nil {
		post.Metadata = &mmModel.PostMetadata{}
	}

	post.Metadata.Embeds = []*mmModel.PostEmbed{BoardsPostEmbed}
	post.AddProp("boards", string(b))

	return post, nil
}

func getFirstLink(str string) string {
	firstLink := ""

	markdown.Inspect(str, func(blockOrInline interface{}) bool {
		if _, ok := blockOrInline.(*markdown.Autolink); ok {
			if link := blockOrInline.(*markdown.Autolink).Destination(); firstLink == "" {
				firstLink = link
			}
		}
		return true
	})

	return firstLink
}

func returnBoardsParams(pathArray []string) (workspaceID, boardID, viewID, cardID string) {
	// The reason we are doing this search for the first instance of boards or plugins is to take into account URL subpaths
	index := -1
	for i := 0; i < len(pathArray); i++ {
		if pathArray[i] == "boards" || pathArray[i] == "plugins" {
			index = i
			break
		}
	}

	if index == -1 {
		return workspaceID, boardID, viewID, cardID
	}

	// If at index, the parameter in the path is boards,
	// then we've copied this directly as logged in user of that board

	// If at index, the parameter in the path is plugins,
	// then we've copied this from a shared board

	// For card links copied on a non-shared board, the path looks like {...Mattermost Url}.../boards/workspace/workspaceID/boardID/viewID/cardID

	// For card links copied on a shared board, the path looks like
	// {...Mattermost Url}.../plugins/focalboard/workspace/workspaceID/shared/boardID/viewID/cardID?r=read_token

	// This is a non-shared board card link
	if len(pathArray)-index == 6 && pathArray[index] == "boards" && pathArray[index+1] == "workspace" {
		workspaceID = pathArray[index+2]
		boardID = pathArray[index+3]
		viewID = pathArray[index+4]
		cardID = pathArray[index+5]
	} else if len(pathArray)-index == 8 && pathArray[index] == "plugins" &&
		pathArray[index+1] == "focalboard" &&
		pathArray[index+2] == "workspace" &&
		pathArray[index+4] == "shared" { // This is a shared board card link
		workspaceID = pathArray[index+3]
		boardID = pathArray[index+5]
		viewID = pathArray[index+6]
		cardID = pathArray[index+7]
	}
	return workspaceID, boardID, viewID, cardID
}
