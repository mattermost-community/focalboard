package utils

import (
	"crypto/rand"
	"encoding/json"
	"fmt"
	"log"
	"time"

	mm_model "github.com/mattermost/mattermost-server/v6/model"
)

// CreateGUID returns a random GUID.
func CreateGUID() string {
	b := make([]byte, 16)
	_, err := rand.Read(b)
	if err != nil {
		log.Fatal(err)
	}
	uuid := fmt.Sprintf("%x-%x-%x-%x-%x", b[0:4], b[4:6], b[6:8], b[8:10], b[10:])

	return uuid
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
