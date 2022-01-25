// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import {bottom} from '@popperjs/core'

import TourTip from '../tutorial_tour_tip/tutorial_tour_tip'
import {Utils} from '../../utils'
import BoardWelcomePNG from '../../../static/boards-welcome.png'
import {useMeasurePunchouts} from '../tutorial_tour_tip/hooks'
import {useAppSelector} from '../../store/hooks'
import {getOnboardingTourStep} from '../../store/users'

import {TOUR_ONBOARDING} from './index'

type Props = {

}

const OnboardingOpenACardTip = (props: Props): JSX.Element => {
    const title = (<span>{'Welcome to Boards!'}</span>)
    const screen = (<span>{'All the conversations that you’re participating in or following will show here. If you have unread messages or mentions within your threads, you’ll see that here too.'}</span>)

    const punchout = useMeasurePunchouts(['.KanbanCard'], [])

    const currentStep = parseInt(useAppSelector(getOnboardingTourStep), 10)

    return (
        <TourTip
            screen={screen}
            title={title}
            imageURL={Utils.buildURL(BoardWelcomePNG, true)}
            punchOut={punchout}
            step={currentStep}
            tutorialCategory={TOUR_ONBOARDING}
            autoTour={true}
            placement={bottom}
        />
    )
}

export default OnboardingOpenACardTip
