// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import './dashboardPage.scss'
import Sidebar from '../../components/sidebar/sidebar'

import DashboardCenterContent from './centerContent'

const DashboardPage = () => (
    <div className='DashboardPage'>
        <Sidebar
            isDashboard={true}
        />
        <DashboardCenterContent/>
    </div>
)

export default React.memo(DashboardPage)
