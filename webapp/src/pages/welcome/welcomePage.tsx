// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {FormattedMessage} from 'react-intl'

import {useLocation, useHistory} from 'react-router-dom'

import BoardWelcomePNG from '../../../static/boards-welcome.png'
import BoardWelcomeSmallPNG from '../../../static/boards-welcome-small.png'

import Button from '../../widgets/buttons/button'
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
                <h1 className='text-heading9'>
                    <FormattedMessage
                        id='WelcomePage.Heading'
                        defaultMessage='Welcome To Boards'
                    />
                </h1>
                <div className='WelcomePage__subtitle'>
                    <FormattedMessage
                        id='WelcomePage.Description'
                        defaultMessage='Boards is a project management tool that helps define, organize, track and manage work across teams, using a familiar kanban board view'
                    />
                </div>

                {/* This image will be rendered on large screens over 2000px */}
                <img
                    src={BoardWelcomePNG}
                    className='WelcomePage__image WelcomePage__image--large'
                    alt='Boards Welcome Image'
                />

                {/* This image will be rendered on small screens below 2000px */}
                <img
                    src={BoardWelcomeSmallPNG}
                    className='WelcomePage__image WelcomePage__image--small'
                    alt='Boards Welcome Image'
                />

                <Button
                    onClick={goForward}
                    filled={true}
                    size='large'
                    icon={
                        <CompassIcon
                            icon='chevron-right'
                            className='Icon Icon--right'
                        />}
                    rightIcon={true}
                >
                    <FormattedMessage
                        id='WelcomePage.Explore.Button'
                        defaultMessage='Explore'
                    />
                </Button>
            </div>
        </div>
    )
})

export default WelcomePage
