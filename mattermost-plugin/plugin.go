package root

import (
	_ "embed" // Need to embed manifest file
	"strings"

	"github.com/mattermost/mattermost-server/v6/model"
)

//go:embed plugin.json
var manifestString string

var Manifest model.Manifest

func init() {
	Manifest = *model.ManifestFromJson(strings.NewReader(manifestString))
}
