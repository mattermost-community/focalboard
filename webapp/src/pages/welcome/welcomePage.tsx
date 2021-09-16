// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {useHistory} from 'react-router-dom'

import './welcomePage.scss'

type Props = {
    workspaceID?: string,
    userID?: string,
}

const WelcomePage = React.memo((props: Props) => {
    const history = useHistory()

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
            <h1> Welcome To Boards </h1>
            <h3> Boards is a project management tool that helps define, organize, track and manage work across teams, using a familiar kanban board view</h3>

            {/*Picture */}

            <button onClick={goForward}>
                Explore
            </button>
        </div>
    )
})

export default WelcomePage
