package app

import "github.com/mattermost/focalboard/server/services/store"

func (a *App) Reset(c store.Container) error {
	if err := a.store.CleanUpSessions(0); err != nil {
		return err
	}

	if err := a.store.DeleteAllBlocksPermanently(c); err != nil {
		return err
	}

	if err := a.store.DeleteAllUsers(); err != nil {
		return err
	}

	return nil
}
