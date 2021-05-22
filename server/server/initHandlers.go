package server

import (
	"github.com/mattermost/focalboard/server/einterfaces"
)

func (s *Server) initHandlers() {
	cfg := s.config
	if cfg.AuthMode == "mattermost" && mattermostAuth != nil {
		s.logger.Info("Using Mattermost Auth")
		params := einterfaces.MattermostAuthParameters{
			ServerRoot:      cfg.ServerRoot,
			MattermostURL:   cfg.MattermostURL,
			ClientID:        cfg.MattermostClientID,
			ClientSecret:    cfg.MattermostClientSecret,
			UseSecureCookie: cfg.SecureCookie,
		}
		mmauthHandler := mattermostAuth(params, s.store)
		s.logger.Info("CREATING AUTH")
		s.webServer.AddRoutes(mmauthHandler)
		s.logger.Info("ADDING ROUTES")
		s.api.WorkspaceAuthenticator = mmauthHandler
		s.logger.Info("SETTING THE AUTHENTICATOR")
	}
}
