// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import {FormattedMessage} from 'react-intl'

import TourTip from '../../tutorial_tour_tip/tutorial_tour_tip'
import {useMeasurePunchouts} from '../../tutorial_tour_tip/hooks'
import {useAppSelector} from '../../../store/hooks'
import {getOnboardingTourStep} from '../../../store/users'

import './add_view.scss'
import {Utils} from '../../../utils'
import addProperty from '../../../../static/dummy.png'

import {TOUR_BOARD} from '../index'

const AddViewTourStep = (): JSX.Element => {
    const title = (
        <FormattedMessage
            id='OnboardingTour.AddView.Title'
            defaultMessage='Add a new view'
        />
    )
    const screen = (
        <FormattedMessage
            id='OnboardingTour.AddView.Body'
            defaultMessage='Go here to create a new view to organise your board using different layouts.'
        />
    )

    const punchout = useMeasurePunchouts(['.viewSelector'], [])

    const currentStep = parseInt(useAppSelector(getOnboardingTourStep), 10)

    return (
        <TourTip
            screen={screen}
            title={title}
            punchOut={punchout}
            step={currentStep}
            tutorialCategory={TOUR_BOARD}
            autoTour={true}
            placement={'bottom-end'}
            className='AddViewTourStep'
            imageURL={Utils.buildURL(addProperty, true)}
            stopPropagation={true}
        />
    )
}

export default AddViewTourStep
