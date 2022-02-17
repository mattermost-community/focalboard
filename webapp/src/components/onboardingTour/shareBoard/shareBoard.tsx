// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import {FormattedMessage} from 'react-intl'

import {useMeasurePunchouts} from '../../tutorial_tour_tip/hooks'

import './shareBoard.scss'
import {Utils} from '../../../utils'
import shareBoard from '../../../../static/share.gif'

import {BoardTourSteps, TOUR_BOARD} from '../index'
import TourTipRenderer from '../tourTipRenderer/tourTipRenderer'

const ShareBoardTourStep = (): JSX.Element | null => {
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

    if (!BoardTourSteps.SHARE_BOARD) {
        return null
    }

    return (
        <TourTipRenderer
            key='ShareBoardTourStep'
            requireCard={false}
            category={TOUR_BOARD}
            step={BoardTourSteps.SHARE_BOARD}
            screen={screen}
            title={title}
            punchout={punchout}
            classname='ShareBoardTourStep'
            telemetryTag='tourPoint2b'
            placement={'bottom-end'}
            imageURL={Utils.buildURL(shareBoard, true)}
            hideBackdrop={true}
        />
    )
}

export default ShareBoardTourStep
