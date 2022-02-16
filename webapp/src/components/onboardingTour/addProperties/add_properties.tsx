// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import {FormattedMessage} from 'react-intl'

import {useMeasurePunchouts} from '../../tutorial_tour_tip/hooks'

import './add_properties.scss'
import {Utils} from '../../../utils'
import addProperty from '../../../../static/addProperty.gif'

import {CardTourSteps, TOUR_CARD} from '../index'
import TourTipRenderer from '../tourTipRenderer/tourTipRenderer'

const AddPropertiesTourStep = (): JSX.Element | null => {
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

    return (
        <TourTipRenderer
            key='AddPropertiesTourStep'
            requireCard={true}
            category={TOUR_CARD}
            step={CardTourSteps.ADD_PROPERTIES}
            screen={screen}
            title={title}
            punchout={punchout}
            classname='AddPropertiesTourStep'
            telemetryTag='tourPoint2a'
            placement={'right-end'}
            imageURL={Utils.buildURL(addProperty, true)}
            hideBackdrop={true}
        />
    )
}

export default AddPropertiesTourStep
