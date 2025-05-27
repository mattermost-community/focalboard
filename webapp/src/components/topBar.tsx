// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'

import './topBar.scss'
import {FormattedMessage} from 'react-intl'

import HelpIcon from '../widgets/icons/help'
import {Constants} from '../constants'

const TopBar = (): JSX.Element => {
    const karmaboardFeedbackUrl = 'https://www.karmaboard.com/fwlink/feedback-karmaboard.html?v=' + Constants.versionString
    return (
        <div
            className='TopBar'
        >
            <a
                className='link'
                href={karmaboardFeedbackUrl}
                target='_blank'
                rel='noreferrer'
            >
                <FormattedMessage
                    id='TopBar.give-feedback'
                    defaultMessage='Give feedback'
                />
            </a>
            <a
                href='https://www.karmaboard.com/guide/user?utm_source=webapp'
                target='_blank'
                rel='noreferrer'
            >
                <HelpIcon/>
            </a>
        </div>
    )
}

export default React.memo(TopBar)
