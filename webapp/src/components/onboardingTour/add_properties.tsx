// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import {bottom} from '@popperjs/core'

import {FormattedMessage} from 'react-intl'

import TourTip from '../tutorial_tour_tip/tutorial_tour_tip'
import {useMeasurePunchouts} from '../tutorial_tour_tip/hooks'
import {useAppSelector} from '../../store/hooks'
import {getOnboardingTourStep} from '../../store/users'

import {TOUR_ONBOARDING} from './index'

import './add_properties.scss'

const AddProperties = (): JSX.Element => {
    const title = (
        <FormattedMessage
            id='OnboardingTour.AddProperties.Title'
            defaultMessage='Add Properties'
        />
    )
    const screen = (
        <FormattedMessage
            id='OnboardingTour.AddProperties.Body'
            defaultMessage='Add various properties to cards to make them more powerful!'
        />
    )

    const punchout = useMeasurePunchouts(['.octo-propertyname.add-property'], [])

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
            className='AddProperties'
            hideNavButtons={true}
            hideBackdrop={true}
        />
    )
}

export default AddProperties
