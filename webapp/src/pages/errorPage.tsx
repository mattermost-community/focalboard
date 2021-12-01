// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {FormattedMessage} from 'react-intl'

import octoClient from '../octoClient'
import Button from '../widgets/buttons/button'
import './errorPage.scss'

const ErrorPage = React.memo(() => {
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
                    window.location.href = '/login'
                }}
            >
                <FormattedMessage
                    id='error.relogin'
                    defaultMessage='Log in again'
                />
            </Button>
        </div>
    )
})

export default ErrorPage
