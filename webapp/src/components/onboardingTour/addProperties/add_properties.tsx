// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import {FormattedMessage} from 'react-intl'

import TourTip from '../../tutorial_tour_tip/tutorial_tour_tip'
import {useMeasurePunchouts} from '../../tutorial_tour_tip/hooks'
import {useAppSelector} from '../../../store/hooks'
import {getOnboardingTourStep} from '../../../store/users'

import './add_properties.scss'
import {Utils} from '../../../utils'
import addProperty from '../../../../static/addProperty.gif'

import {TOUR_CARD} from '../index'

const AddPropertiesTourStep = (): JSX.Element => {
    const title = (
        <FormattedMessage
            id='OnboardingTour.AddProperties.Title'
            defaultMessage='Add properties'
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
            tutorialCategory={TOUR_CARD}
            autoTour={true}
            placement={'right-end'}
            className='AddPropertiesTourStep'
            hideBackdrop={true}
            imageURL={Utils.buildURL(addProperty, true)}
            stopPropagation={true}
            skipCategoryFromBackdrop={true}
        />
    )
}

export default AddPropertiesTourStep
