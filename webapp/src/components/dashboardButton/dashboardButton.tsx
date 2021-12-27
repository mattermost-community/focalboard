// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import {useIntl} from 'react-intl'

import Apps from '../../widgets/icons/apps'

import './dashboardButton.scss'

const DashboardButton = (): JSX.Element => {
    const intl = useIntl()

    return (
        <div className='DashboardButton'>
            <Apps/>
            <span>
                {intl.formatMessage({id: 'DashboardPage.title', defaultMessage: 'Dashboard'})}
            </span>
        </div>
    )
}

export default DashboardButton
