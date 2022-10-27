package utils

import (
	"encoding/json"
	"reflect"
	"time"

	mmModel "github.com/mattermost/mattermost-server/v6/model"
)

type IDType byte

const (
	IDTypeNone    IDType = '7'
	IDTypeTeam    IDType = 't'
	IDTypeBoard   IDType = 'b'
	IDTypeCard    IDType = 'c'
	IDTypeView    IDType = 'v'
	IDTypeSession IDType = 's'
	IDTypeUser    IDType = 'u'
	IDTypeToken   IDType = 'k'
	IDTypeBlock   IDType = 'a'
)

// NewId is a globally unique identifier.  It is a [A-Z0-9] string 27
// characters long.  It is a UUID version 4 Guid that is zbased32 encoded
// with the padding stripped off, and a one character alpha prefix indicating the
// type of entity or a `7` if unknown type.
func NewID(idType IDType) string {
	return string(idType) + mmModel.NewId()
}

// GetMillis is a convenience method to get milliseconds since epoch.
func GetMillis() int64 {
	return mmModel.GetMillis()
}

// GetMillisForTime is a convenience method to get milliseconds since epoch for provided Time.
func GetMillisForTime(thisTime time.Time) int64 {
	return mmModel.GetMillisForTime(thisTime)
}

// GetTimeForMillis is a convenience method to get time.Time for milliseconds since epoch.
func GetTimeForMillis(millis int64) time.Time {
	return mmModel.GetTimeForMillis(millis)
}

// SecondsToMillis is a convenience method to convert seconds to milliseconds.
func SecondsToMillis(seconds int64) int64 {
	return seconds * 1000
}

func StructToMap(v any) (m map[string]any) {
	b, _ := json.Marshal(v)
	_ = json.Unmarshal(b, &m)
	return
}

func intersection(a []any, b []any) []any {
	set := make([]any, 0)
	hash := make(map[any]bool)
	av := reflect.ValueOf(a)
	bv := reflect.ValueOf(b)

	for i := 0; i < av.Len(); i++ {
		el := av.Index(i).Interface()
		hash[el] = true
	}

	for i := 0; i < bv.Len(); i++ {
		el := bv.Index(i).Interface()
		if _, found := hash[el]; found {
			set = append(set, el)
		}
	}

	return set
}

func Intersection(x ...[]any) []any {
	if len(x) == 0 {
		return nil
	}

	if len(x) == 1 {
		return x[0]
	}

	result := x[0]
	i := 1
	for i < len(x) {
		result = intersection(result, x[i])
		i++
	}

	return result
}

func IsCloudLicense(license *mmModel.License) bool {
	return license != nil &&
		license.Features != nil &&
		license.Features.Cloud != nil &&
		*license.Features.Cloud
}
