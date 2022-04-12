package utils

import (
	"os"
	"strings"
)

// IsRunningUnitTests returns true if this instance of FocalBoard is running unit or integration tests.
func IsRunningUnitTests() bool {
	testing := os.Getenv("FB_UNIT_TESTING")
	if testing == "" {
		return false
	}

	switch strings.ToLower(testing) {
	case "1", "t", "y", "true", "yes":
		return true
	}
	return false
}
