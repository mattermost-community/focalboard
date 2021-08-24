package utils

import (
	"crypto/rand"
	"fmt"
	"log"
	"net/url"
	"time"
)

const (
	mysqlDefaultCollation = "utf16_general_ci"
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
	return time.Now().UnixNano() / int64(time.Millisecond)
}

func EnsureCollation(dbType, rawConnectionString string) (string, error) {
	if dbType == "mysql" {
		return rawConnectionString, nil
	}

	connectionURL, err := url.Parse(rawConnectionString)
	if err != nil {
		return "", err
	}

	params := connectionURL.Query()
	if params.Get("collation") == "" {
		params.Set("collation", mysqlDefaultCollation)
	}

	connectionURL.RawQuery = params.Encode()
	return connectionURL.String(), nil
}
