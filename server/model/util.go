// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package model

import (
	"time"

	mm_model "github.com/mattermost/mattermost-server/v6/model"
)

// NewId is a globally unique identifier.  It is a [A-Z0-9] string 27
// characters long.  It is a UUID version 4 Guid that is zbased32 encoded
// with the padding stripped off, and a one character alpha prefix indicating the
// type of entity or an 8 if unknown type.
func NewID(idType string) string {
	var prefix string
	switch idType {
	case "workspace":
		prefix = "w"
	case "board":
		prefix = "b"
	case "card":
		prefix = "c"
	case "view":
		prefix = "v"
	default:
		prefix = "8"
	}
	return prefix + mm_model.NewId()
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
