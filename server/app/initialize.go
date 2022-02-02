package app

import "github.com/mattermost/mattermost-server/v6/shared/mlog"

// initialize is called when the App is first created.
func (a *App) initialize(skipTemplateInit bool) {
	if !skipTemplateInit {
		if err := a.initializeTemplates(); err != nil {
			a.logger.Error(`InitializeTemplates failed`, mlog.Err(err))
		}
	}
}
