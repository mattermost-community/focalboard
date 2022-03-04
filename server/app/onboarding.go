package app

import (
	"errors"

	"github.com/mattermost/focalboard/server/model"
	"github.com/mattermost/focalboard/server/services/store"
)

const (
	KeyPrefix                 = "focalboard_" // use key prefix to namespace focalboard props
	KeyOnboardingTourStarted  = KeyPrefix + "onboardingTourStarted"
	KeyOnboardingTourCategory = KeyPrefix + "tourCategory"
	KeyOnboardingTourStep     = KeyPrefix + "onboardingTourStep"

	ValueOnboardingFirstStep    = "0"
	ValueTourCategoryOnboarding = "onboarding"

	WelcomeBoardTitle = "Welcome to Boards!"
)

var (
	errUnableToFindWelcomeBoard = errors.New("unable to find welcome board in newly created blocks")
)

func (a *App) PrepareOnboardingTour(userID string) (string, string, error) {
	// create a private workspace for the user
	workspaceID, err := a.store.CreatePrivateWorkspace(userID)
	if err != nil {
		return "", "", err
	}

	// copy the welcome board into this workspace
	boardID, err := a.createWelcomeBoard(userID, workspaceID)
	if err != nil {
		return "", "", err
	}

	// set user's tour state to initial state
	userPropPatch := model.UserPropPatch{
		UpdatedFields: map[string]string{
			KeyOnboardingTourStarted:  "1",
			KeyOnboardingTourStep:     ValueOnboardingFirstStep,
			KeyOnboardingTourCategory: ValueTourCategoryOnboarding,
		},
	}
	if err := a.store.PatchUserProps(userID, userPropPatch); err != nil {
		return "", "", err
	}

	return workspaceID, boardID, nil
}

func (a *App) getOnboardingBoardID() (string, error) {
	blocks, err := a.store.GetDefaultTemplateBlocks()
	if err != nil {
		return "", err
	}

	var onboardingBoardID string
	for _, block := range blocks {
		if block.Type == model.TypeBoard && block.Title == WelcomeBoardTitle {
			onboardingBoardID = block.ID
			break
		}
	}

	if onboardingBoardID == "" {
		return "", errUnableToFindWelcomeBoard
	}

	return onboardingBoardID, nil
}

func (a *App) createWelcomeBoard(userID, workspaceID string) (string, error) {
	onboardingBoardID, err := a.getOnboardingBoardID()
	if err != nil {
		return "", err
	}

	blocks, err := a.GetSubTree(store.Container{WorkspaceID: "0"}, onboardingBoardID, 3)
	if err != nil {
		return "", err
	}

	blocks = model.GenerateBlockIDs(blocks, a.logger)

	if errUpdateFileIDs := a.CopyCardFiles(onboardingBoardID, workspaceID, blocks); errUpdateFileIDs != nil {
		return "", errUpdateFileIDs
	}

	// we're copying from a global template, so we need to set the
	// `isTemplate` flag to false on the board
	var welcomeBoardID string
	for i := range blocks {
		if blocks[i].Type == model.TypeBoard {
			blocks[i].Fields["isTemplate"] = false

			if blocks[i].Title == WelcomeBoardTitle {
				welcomeBoardID = blocks[i].ID
				break
			}
		}
	}

	model.StampModificationMetadata(userID, blocks, nil)
	_, err = a.InsertBlocks(store.Container{WorkspaceID: workspaceID}, blocks, userID, false)
	if err != nil {
		return "", err
	}

	return welcomeBoardID, nil
}
