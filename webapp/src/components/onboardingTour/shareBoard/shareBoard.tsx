// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import {FormattedMessage} from 'react-intl'

import TourTip from '../../tutorial_tour_tip/tutorial_tour_tip'
import {useMeasurePunchouts} from '../../tutorial_tour_tip/hooks'
import {useAppSelector} from '../../../store/hooks'
import {getOnboardingTourStep} from '../../../store/users'

import './shareBoard.scss'
import {Utils} from '../../../utils'
import shareBoard from '../../../../static/share.gif'

import {TOUR_CARD} from '../index'

const ShareBoardTourStep = (): JSX.Element => {
    const title = (
        <FormattedMessage
            id='OnboardingTour.ShareBoard.Title'
            defaultMessage='Share board'
        />
    )
    const screen = (
        <FormattedMessage
            id='OnboardingTour.ShareBoard.Body'
            defaultMessage='You can share your board internally, within your team, or publish it publicly for visibility outside of your organization.'
        />
    )

    const punchout = useMeasurePunchouts(['.ShareBoardButton > button'], [])
    const currentStep = parseInt(useAppSelector(getOnboardingTourStep), 10)

    return (
        <TourTip
            screen={screen}
            title={title}
            punchOut={punchout}
            step={currentStep}
            tutorialCategory={TOUR_CARD}
            autoTour={true}
            placement={'bottom-end'}
            className='ShareBoardTourStep'
            hideBackdrop={true}
            imageURL={Utils.buildURL(shareBoard, true)}
            skipCategoryFromBackdrop={true}
            telemetryTag='tourPoint2b'
        />
    )
}

export default ShareBoardTourStep
