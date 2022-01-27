// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
export const TourSteps = {
    OPEN_A_CARD: 0,
}

export const CardTourSteps = {
    ADD_PROPERTIES: 0,
    ADD_COMMENTS: 1,
    ADD_DESCRIPTION: 2,
}

export const LOL = {
    ADD_VIEW: 4,
    COPY_LINK: 5,
    SHARE_BOARD: 6,
}

export const FINISHED = 999

export const TOUR_ONBOARDING = 'onboarding'
export const TOUR_CARD = 'card'

export const TTCategoriesMapToSteps: Record<string, Record<string, number>> = {
    [TOUR_ONBOARDING]: TourSteps,
    [TOUR_CARD]: CardTourSteps,
}
