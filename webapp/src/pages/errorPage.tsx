// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {FormattedMessage} from 'react-intl'
import {useHistory} from 'react-router-dom'

import octoClient from '../octoClient'
import Button from '../widgets/buttons/button'
import './errorPage.scss'

const ErrorPage = () => {
    const history = useHistory()

    return (
        <div className='ErrorPage'>
            <div className='title'>{'Error'}</div>
            <div>
                <FormattedMessage
                    id='error.no-workspace'
                    defaultMessage='Your session may have expired or you may not have access to this workspace.'
                />
            </div>
            <br/>
            <Button
                filled={true}
                onClick={async () => {
                    await octoClient.logout()
                    history.push('/login')
                }}
            >
                <FormattedMessage
                    id='error.relogin'
                    defaultMessage='Log in again'
                />
            </Button>
        </div>
    )
}

export default React.memo(ErrorPage)
