// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'

import './topBar.scss'
import HelpIcon from '../widgets/icons/help'
import {Utils} from '../utils'
import {Constants} from '../constants'

const TopBar = React.memo((): JSX.Element => {
    if (Utils.isFocalboardPlugin()) {
        return (
            <div
                className='TopBar'
            >
                <div className='versionFrame'>
                    <div className='version'>
                        {`v${Constants.versionString}`}
                    </div>
                    <div className='versionBadge'>{'BETA'}</div>
                </div>
            </div>
        )
    }

    return (
        <div
            className='TopBar'
        >
            <a
                href='https://www.focalboard.com/guide/user?utm_source=webapp'
                target='_blank'
                rel='noreferrer'
            >
                <HelpIcon/>
            </a>
        </div>
    )
})

export default TopBar
