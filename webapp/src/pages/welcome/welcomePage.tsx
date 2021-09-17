// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {useIntl} from 'react-intl'

import {useHistory} from 'react-router-dom'

import CompassIcon from '../../widgets/icons/compassIcon'

import './welcomePage.scss'

type Props = {
    workspaceID?: string,
    userID?: string,
}

const WelcomePage = React.memo((props: Props) => {
    const history = useHistory()
    const intl = useIntl()

    const goForward = () => {
        localStorage.setItem('welcomePageViewed', 'true')
        if (props.workspaceID) {
            history.push(`/workspace/${props.workspaceID}`)
            return
        }

        history.push('/dashboard')
    }

    if (localStorage.getItem('welcomePageViewed')) {
        history.push('/dashboard')
        return null
    }

    return (
        <div className='WelcomePage'>
            <div>
                <h1 className='text-heading6'> {intl.formatMessage({id: 'WelcomePage.Heading', defaultMessage: 'Welcome To Boards'})} </h1>
                <div className='text-base'> {intl.formatMessage({id: 'WelcomePage.Description', defaultMessage: 'Boards is a project management tool that helps define, organize, track and manage work across teams, using a familiar kanban board view'})} </div>

                <div className='WelcomePage__image'>
                    <img
                        src='../../../../boards-welcome.png'
                        alt='Boards Welcome Image'
                    />
                </div>

                <button
                    onClick={goForward}
                    className='Button filled size--large'
                >
                    {intl.formatMessage({id: 'WelcomePage.Explore.Button', defaultMessage: 'Explore'})}
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
