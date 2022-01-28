// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import {top} from '@popperjs/core'

import {FormattedMessage} from 'react-intl'

import TourTip from '../../tutorial_tour_tip/tutorial_tour_tip'
import {useMeasurePunchouts} from '../../tutorial_tour_tip/hooks'
import {useAppSelector} from '../../../store/hooks'
import {getOnboardingTourStep} from '../../../store/users'

import './add_description.scss'
import {Utils} from '../../../utils'
import addProperty from '../../../../static/dummy.png'

import {TOUR_CARD} from '../index'

const AddDescriptionTourStep = (): JSX.Element => {
    const title = (
        <FormattedMessage
            id='OnboardingTour.AddDescription.Title'
            defaultMessage='Add description'
        />
    )
    const screen = (
        <FormattedMessage
            id='OnboardingTour.AddDescription.Body'
            defaultMessage='Add a description to your card so people know what the card is about.'
        />
    )

    const punchout = useMeasurePunchouts(['.octo-content div:nth-child(1)'], [])

    const currentStep = parseInt(useAppSelector(getOnboardingTourStep), 10)

    return (
        <TourTip
            screen={screen}
            title={title}
            punchOut={punchout}
            step={currentStep}
            tutorialCategory={TOUR_CARD}
            autoTour={true}
            placement={'top-start'}
            className='AddDescriptionTourStep'
            hideNavButtons={true}
            hideBackdrop={true}
            imageURL={Utils.buildURL(addProperty, true)}
        />
    )
}

export default AddDescriptionTourStep
