// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import {bottom} from '@popperjs/core'

import {FormattedMessage} from 'react-intl'

import TourTip from '../../tutorial_tour_tip/tutorial_tour_tip'
import {Utils} from '../../../utils'
import BoardWelcomePNG from '../../../../static/boards-welcome.png'
import {useMeasurePunchouts} from '../../tutorial_tour_tip/hooks'
import {useAppSelector} from '../../../store/hooks'
import {getOnboardingTourStep} from '../../../store/users'

import {TOUR_ONBOARDING} from '../index'

import './open_card.scss'

const OpenCardTourStep = (): JSX.Element => {
    const title = (
        <FormattedMessage
            id='OnboardingTour.OpenACard.Title'
            defaultMessage='Open a card'
        />
    )
    const screen = (
        <FormattedMessage
            id='OnboardingTour.OpenACard.Body'
            defaultMessage='The explore the powers of boards, open a card to view the various features we have!'
        />
    )

    const punchout = useMeasurePunchouts(['.KanbanCard'], [])

    const currentStep = parseInt(useAppSelector(getOnboardingTourStep), 10)

    return (
        <TourTip
            screen={screen}
            title={title}
            punchOut={punchout}
            step={currentStep}
            tutorialCategory={TOUR_ONBOARDING}
            autoTour={true}
            placement={bottom}
            className='OpenCardTourStep'
            hideBackdrop={false}
            clickThroughPunchhole={true}
            hideNavButtons={true}

            // stopPropagation={false}
        />
    )
}

export default OpenCardTourStep
