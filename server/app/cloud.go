package app

import "fmt"

func (a *App) NotifyPortalAdminsUpgradeRequest(workspaceID string) error {
	team, err := a.store.GetWorkspaceTeam(workspaceID)
	if err != nil {
		return err
	}

	message := fmt.Sprintf("A member of %s has notified you to upgrade this workspace before the trial ends.", team.DisplayName)
	receipt, err := a.store.GetPortalAdmin()
	if err != nil {
		return err
	}

	return a.store.SendMessage(message, []string{receipt.Id})
}
