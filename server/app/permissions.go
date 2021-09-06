package app

func (a *App) CanCreateBoards(userID, teamID string) bool {
	// ToDo: this could be solved with the plugin API method
	// HasPermissionToTeam. Maybe we should have a layer or other
	// mechanism in plugin mode to intercept methods that can be
	// solved through the plugin API?

	return a.store.HasTeamPermission(userID, teamID, "focalboard_team_create_board")
}

func (a *App) CanCreateCards(userID, boardID string) bool {
	return a.store.HasBoardPermission(userID, boardID, "focalboard_board_add_card")
}
