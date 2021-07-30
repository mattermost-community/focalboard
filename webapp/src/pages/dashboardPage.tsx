// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {FormattedMessage} from 'react-intl'

import './dashboardPage.scss'

const DashboardPage = React.memo(() => (
    <div className='DashboardPage'>
        <div className='dashboard-title'>
            <FormattedMessage
                id='DashboardPage.title'
                defaultMessage='Welcome to Focalboard (Beta)!'
            />
        </div>

        <div>
            <FormattedMessage
                id='DashboardPage.message'
                defaultMessage='Use Focalboard to create and track tasks for projects big and small using familiar kanban-boards, tables, and other views.'
            />
        </div>
    </div>
))

export default DashboardPage
