// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
export const TourSteps = {
    OPEN_A_CARD: 0,
    ADD_PROPERTIES: 1,
    ADD_COMMENTS: 2,
    ADD_DESCRIPTION: 3,
    ADD_VIEW: 4,
    COPY_LINK: 5,
    SHARE_BOARD: 6,
    FINISHED: 999,
}

export const TOUR_ONBOARDING = 'onboarding'

export const TutorialSteps: {[key: string]: {[key: string]: number}} = {
    [TOUR_ONBOARDING]: TourSteps,
}
