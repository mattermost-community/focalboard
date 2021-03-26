// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import {
    withRouter,
    RouteComponentProps,
} from 'react-router-dom'

import './errorPage.scss'

type Props = RouteComponentProps

class ErrorPage extends React.PureComponent<Props> {
    render(): React.ReactNode {
        return (
            <div className='ErrorPage'>
                <div className='title'>{'Error'}</div>
            </div>
        )
    }
}

export default withRouter(ErrorPage)
