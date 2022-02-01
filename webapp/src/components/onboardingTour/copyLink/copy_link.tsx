// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import {FormattedMessage} from 'react-intl'

import TourTip from '../../tutorial_tour_tip/tutorial_tour_tip'
import {useMeasurePunchouts} from '../../tutorial_tour_tip/hooks'
import {useAppSelector} from '../../../store/hooks'
import {getOnboardingTourStep} from '../../../store/users'

import './copy_link.scss'
import {Utils} from '../../../utils'
import copyLink from '../../../../static/copyLink.gif'

import {TOUR_CARD} from '../index'
import {OnboardingCardClassName} from '../../kanban/kanbanCard'

const CopyLinkTourStep = (): JSX.Element => {
    const title = (
        <FormattedMessage
            id='OnboardingTour.CopyLink.Title'
            defaultMessage='Cpy link'
        />
    )
    const screen = (
        <FormattedMessage
            id='OnboardingTour.CopyLink.Body'
            defaultMessage='You can share your cards with teammates by copying the link and pasting it in a channel, Direct Message, or Group Message.'
        />
    )

    const punchout = useMeasurePunchouts([`.${OnboardingCardClassName} .optionsMenu`], [])

    const currentStep = parseInt(useAppSelector(getOnboardingTourStep), 10)

    return (
        <TourTip
            screen={screen}
            title={title}
            punchOut={punchout}
            step={currentStep}
            tutorialCategory={TOUR_CARD}
            autoTour={true}
            placement={'right-end'}
            className='CopyLinkTourStep'
            hideBackdrop={true}
            imageURL={Utils.buildURL(copyLink, true)}
            stopPropagation={true}
            skipCategoryFromBackdrop={true}
        />
    )
}

export default CopyLinkTourStep
