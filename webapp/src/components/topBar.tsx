// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'
import {injectIntl, IntlShape} from 'react-intl'

import './topBar.scss'
import HelpIcon from '../widgets/icons/help'

// See LICENSE.txt for license information.
type Props = {
    intl: IntlShape
}

class TopBar extends React.PureComponent<Props> {
    render(): JSX.Element {
        return (
            <div
                className='TopBar'
            >
                <a
                    href='https://docs.mattermost.com/?utm_source=tasks'
                    target='_blank'
                    rel='noreferrer'
                >
                    <HelpIcon/>
                </a>
            </div>
        )
    }
}

export default injectIntl(TopBar)
