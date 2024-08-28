// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'

import './topBar.scss'
import {FormattedMessage} from 'react-intl'

import HelpIcon from '../widgets/icons/help'
import {Constants} from '../constants'

const TopBar = (): JSX.Element => {
    const focalboardFeedbackUrl = 'https://www.focalboard.com/fwlink/feedback-focalboard.html?v=' + Constants.versionString
    return (
        <div></div>
    )
}

export default React.memo(TopBar)
