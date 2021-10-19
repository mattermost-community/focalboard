package utils

import (
	"encoding/json"
	"time"

	"github.com/mattermost/focalboard/server/model"
	mm_model "github.com/mattermost/mattermost-server/v6/model"
)

type IDType byte

const (
	IDTypeNone      IDType = '7'
	IDTypeWorkspace IDType = 'w'
	IDTypeBoard     IDType = 'b'
	IDTypeCard      IDType = 'c'
	IDTypeView      IDType = 'v'
	IDTypeSession   IDType = 's'
	IDTypeUser      IDType = 'u'
	IDTypeToken     IDType = 'k'
	IDTypeBlock     IDType = 'a'
)

// NewId is a globally unique identifier.  It is a [A-Z0-9] string 27
// characters long.  It is a UUID version 4 Guid that is zbased32 encoded
// with the padding stripped off, and a one character alpha prefix indicating the
// type of entity or a `7` if unknown type.
func NewID(idType IDType) string {
	return string(idType) + mm_model.NewId()
}

// GetMillis is a convenience method to get milliseconds since epoch.
func GetMillis() int64 {
	return mm_model.GetMillis()
}

// GetMillisForTime is a convenience method to get milliseconds since epoch for provided Time.
func GetMillisForTime(thisTime time.Time) int64 {
	return mm_model.GetMillisForTime(thisTime)
}

// GetTimeForMillis is a convenience method to get time.Time for milliseconds since epoch.
func GetTimeForMillis(millis int64) time.Time {
	return mm_model.GetTimeForMillis(millis)
}

// SecondsToMillis is a convenience method to convert seconds to milliseconds.
func SecondsToMillis(seconds int64) int64 {
	return seconds * 1000
}

func StructToMap(v interface{}) (m map[string]interface{}) {
	b, _ := json.Marshal(v)
	_ = json.Unmarshal(b, &m)
	return
}

// GenerateBlockIDs generates new IDs for all the blocks of the list,
// keeping consistent any references that other blocks would made to
// the original IDs, so a tree of blocks can get new IDs and maintain
// its shape
func GenerateBlockIDs(blocks []model.Block) []model.Block {
	blockIDs := map[string]bool{}
	referenceIDs := map[string]bool{}
	for _, block := range blocks {
		if _, ok := blockIDs[block.ID]; !ok {
			blockIDs[block.ID] = true
		}

		if _, ok := referenceIDs[block.RootID]; !ok {
			referenceIDs[block.RootID] = true
		}
		if _, ok := referenceIDs[block.ParentID]; !ok {
			referenceIDs[block.ParentID] = true
		}
	}

	newIDs := map[string]string{}
	for id, _ := range blockIDs {
		for referenceID, _ := range referenceIDs {
			if id == referenceID {
				newIDs[id] = NewID(IDTypeBlock)
				continue
			}
		}
	}

	getExistingOrOldID := func(id string) string {
		if existingID, ok := newIDs[id]; ok {
			return existingID
		}
		return id
	}

	getExistingOrNewID := func(id string) string {
		if existingID, ok := newIDs[id]; ok {
			return existingID
		}
		return NewID(IDTypeBlock)
	}

	newBlocks := make([]model.Block, len(blocks))
	for i, block := range blocks {
		block.ID = getExistingOrNewID(block.ID)
		block.RootID = getExistingOrOldID(block.RootID)
		block.ParentID = getExistingOrOldID(block.ParentID)

		newBlocks[i] = block
	}

	return newBlocks
}
