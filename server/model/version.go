package model

// This is a list of all the current versions including any patches.
// It should be maintained in chronological order with most current
// release at the front of the list.
var versions = []string{
	"0.6.0",
	"0.5.0",
}

var CurrentVersion string = versions[0]
var BuildNumber string
var BuildDate string
var BuildHash string
var Edition string
