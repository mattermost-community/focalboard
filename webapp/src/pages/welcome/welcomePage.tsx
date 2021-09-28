// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {FormattedMessage} from 'react-intl'

import {useLocation, useHistory} from 'react-router-dom'

import BoardWelcomePNG from '../../../static/boards-welcome.png'

import CompassIcon from '../../widgets/icons/compassIcon'
import {UserSettings} from '../../userSettings'

import './welcomePage.scss'

const WelcomePage = React.memo(() => {
    const history = useHistory()
    const queryString = new URLSearchParams(useLocation().search)

    const goForward = () => {
        UserSettings.welcomePageViewed = 'true'

        if (queryString.get('r')) {
            history.replace(queryString.get('r')!)
            return
        }

        history.replace('/dashboard')
    }

    if (UserSettings.welcomePageViewed) {
        goForward()
        return null
    }

    return (
        <div className='WelcomePage'>
            <div>
                <h1 className='text-heading6'>
                    <FormattedMessage
                        id='WelcomePage.Heading'
                        defaultMessage='Welcome To Boards'
                    />
                </h1>
                <div className='text-base'>
                    <FormattedMessage
                        id='WelcomePage.Description'
                        defaultMessage='Boards is a project management tool that helps define, organize, track and manage work across teams, using a familiar kanban board view'
                    />
                </div>

                <div className='WelcomePage__image'>
                    <img
                        src={BoardWelcomePNG}
                        alt='Boards Welcome Image'
                    />
                </div>

                <button
                    onClick={goForward}
                    className='Button filled size--large'
                >
                    <FormattedMessage
                        id='WelcomePage.Explore.Button'
                        defaultMessage='Explore'
                    />
                    <CompassIcon
                        icon='chevron-right'
                        className='Icon Icon--right'
                    />
                </button>
            </div>
        </div>
    )
})

export default WelcomePage
