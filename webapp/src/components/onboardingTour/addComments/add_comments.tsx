// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import {FormattedMessage} from 'react-intl'

import TourTip from '../../tutorial_tour_tip/tutorial_tour_tip'
import {useMeasurePunchouts} from '../../tutorial_tour_tip/hooks'
import {useAppSelector} from '../../../store/hooks'
import {getOnboardingTourStep} from '../../../store/users'

import './add_comments.scss'
import {Utils} from '../../../utils'
import addProperty from '../../../../static/dummy.png'

import {TOUR_CARD} from '../index'

const AddCommentTourStep = (): JSX.Element => {
    const title = (
        <FormattedMessage
            id='OnboardingTour.AddComments.Title'
            defaultMessage='Add comments'
        />
    )
    const screen = (
        <FormattedMessage
            id='OnboardingTour.AddComments.Body'
            defaultMessage='You can comment on issues, and even @mention your fellow Mattermost users to get their attention.'
        />
    )

    const punchout = useMeasurePunchouts(['.CommentsList__new'], [])

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
            className='AddCommentTourStep'
            hideBackdrop={true}
            imageURL={Utils.buildURL(addProperty, true)}
        />
    )
}

export default AddCommentTourStep
