package utils

// IsRunningUnitTests returns true if this instance of FocalBoard is running unit or integration tests.
func IsRunningUnitTests() bool {
	return IsEnvTrue("FOCALBOARD_UNIT_TESTING")
}
