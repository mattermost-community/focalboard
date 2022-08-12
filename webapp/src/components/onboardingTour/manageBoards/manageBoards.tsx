// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import { FormattedMessage } from 'react-intl'

import {right} from '@popperjs/core'

import { SidebarTourSteps, TOUR_SIDEBAR } from '..'

import {useMeasurePunchouts} from '../../tutorial_tour_tip/hooks'
import TourTipRenderer from '../tourTipRenderer/tourTipRenderer'
import {ClassForManageBoardsTourStep} from '../../../components/sidebar/sidebarBoardItem'

import './manageBoards.scss'

const ManageBoardsTourStep = (): JSX.Element | null => {
    const title = (
        <FormattedMessage
            id='SidebarTour.ManageBoards.Title'
            defaultMessage='Manage boards'
        />
    )

    const screen = (
        <FormattedMessage
            id='SidebarTour.ManageBoards.Body'
            defaultMessage='Move boards to another category or hide the board from the sidebar.'
        />
    )

    const punchout = useMeasurePunchouts([`.${ClassForManageBoardsTourStep}`], [])

    return (
        <TourTipRenderer
            key='ManageBoardTourStep'
            requireCard={false}
            category={TOUR_SIDEBAR}
            step={SidebarTourSteps.MANAGE_BOARDS}
            screen={screen}
            title={title}
            punchout={punchout}
            classname='ManageBoards'
            telemetryTag='tourPoint4c'
            placement={right}
            hideBackdrop={false}
            showForce={true}
        />
    )

}

export default ManageBoardsTourStep
