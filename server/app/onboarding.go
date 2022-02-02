package app

import (
	"fmt"

	"github.com/mattermost/focalboard/server/model"
)

const (
	KeyPrefix                 = "focalboard_" // use key prefix to namespace focalboard props
	KeyOnboardingTourStarted  = KeyPrefix + "onboardingTourStarted"
	KeyOnboardingTourCategory = KeyPrefix + "tourCategory"
	KeyOnboardingTourStep     = KeyPrefix + "onboardingTourStep"
	KeyOnboardingTourSkipped  = KeyPrefix + "onboardingTourSkipped"

	ValueOnboardingFirstStep    = 0
	ValueTourCategoryOnboarding = "onboarding"
)

func (a *App) PrepareOnboardingTour(userID string) (string, string, error) {
	// create a private workspace for the user
	workspaceID, err := a.store.CreatePrivateWorkspace(userID)
	if err != nil {
		return "", "", err
	}

	fmt.Println(workspaceID)

	// copy the welcome board into this workspace
	// TODO add logic here to clone welcome board into the workspace

	// set user's tour state to initial state
	userPropPatch := model.UserPropPatch{
		UpdatedFields: map[string]interface{}{
			KeyOnboardingTourStarted:  true,
			KeyOnboardingTourStep:     ValueOnboardingFirstStep,
			KeyOnboardingTourCategory: ValueTourCategoryOnboarding,
		},
	}
	if err := a.store.PatchUserProps(userID, userPropPatch); err != nil {
		return "", "", err
	}

	// TODO return actual cloned board's ID
	return workspaceID, "bkh7zhsbrejbfdnb8betan9oy9y", nil
}
