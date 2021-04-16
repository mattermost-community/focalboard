package model

// This is a list of all the current versions including any patches.
// It should be maintained in chronological order with most current
// release at the front of the list.
var versions = []string{
	"0.6.5",
	"0.6.2",
	"0.6.1",
	"0.6.0",
	"0.5.0",
}

var (
	CurrentVersion string = versions[0]
	BuildNumber    string
	BuildDate      string
	BuildHash      string
	Edition        string
)
