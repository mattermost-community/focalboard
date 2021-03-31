package server

import (
	"github.com/mattermost/focalboard/server/einterfaces"
)

var mattermostAuth func(einterfaces.MattermostAuthParameters, einterfaces.MattermostAuthStore) einterfaces.MattermostAuth

func RegisterMattermostAuth(f func(einterfaces.MattermostAuthParameters, einterfaces.MattermostAuthStore) einterfaces.MattermostAuth) {
	mattermostAuth = f
}
