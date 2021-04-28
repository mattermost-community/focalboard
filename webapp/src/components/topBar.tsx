// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'

import './topBar.scss'
import HelpIcon from '../widgets/icons/help'

const TopBar = React.memo((): JSX.Element => {
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
