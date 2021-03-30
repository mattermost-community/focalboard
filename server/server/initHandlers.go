package server

import (
	"log"

	"github.com/mattermost/focalboard/server/einterfaces"
)

func (s *Server) initHandlers() {
	cfg := s.config
	if cfg.AuthMode == "mattermost" && mattermostAuth != nil {
		log.Println("Using Mattermost Auth")
		params := einterfaces.MattermostAuthParameters{
			ServerRoot:      cfg.ServerRoot,
			MattermostURL:   cfg.MattermostURL,
			ClientID:        cfg.MattermostClientID,
			ClientSecret:    cfg.MattermostClientSecret,
			UseSecureCookie: cfg.SecureCookie,
		}
		mmauthHandler := mattermostAuth(params, s.store)
		log.Println("CREATING AUTH")
		s.webServer.AddRoutes(mmauthHandler)
		log.Println("ADDING ROUTES")
		s.api.WorkspaceAuthenticator = mmauthHandler
		log.Println("SETTING THE AUTHENTICATOR")
	}
}
