// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react'
import {FormattedMessage} from 'react-intl'
import {generatePath, useHistory, useRouteMatch, Redirect} from 'react-router-dom'

import Button from '../../widgets/buttons/button'
import TelemetryClient, {TelemetryActions, TelemetryCategory} from '../../telemetry/telemetryClient'
import {Utils} from '../../utils'

import './shareBoardLoginButton.scss'

const ShareBoardLoginButton = () => {
    const history = useHistory()
    const match = useRouteMatch<{teamId: string, boardId: string, viewId?: string, cardId?: string}>()

    let redirectQueryParam = 'r=' + encodeURIComponent(generatePath('/:boardId?/:viewId?/:cardId?', match.params))
    if (Utils.isFocalboardLegacy()) {
        redirectQueryParam = 'redirect_to=' + encodeURIComponent(generatePath('/boards/team/:teamId/:boardId?/:viewId?/:cardId?', match.params))
    }
    const loginPath = '/login?' + redirectQueryParam

    return (
        <div className='ShareBoardLoginButton'>
            <Button
                title='Login'
                size='medium'
                emphasis='primary'
                onClick={() => {
                    TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.ShareBoardLogin)
                    if (Utils.isFocalboardLegacy()) {
                        <Redirect to={Utils.getFrontendBaseURL(true).replace('/plugins/focalboard', '') + loginPath}/>
                        // window.location.href = Utils.getFrontendBaseURL(true).replace('/plugins/focalboard', '') + loginPath
                    } else {
                        // history.push(loginPath)
                        <Redirect to={loginPath}/>
                    }
                }}
            >
                <FormattedMessage
                    id='CenterPanel.Login'
                    defaultMessage='Login'
                />
            </Button>
        </div>
    )
}

export default React.memo(ShareBoardLoginButton)
