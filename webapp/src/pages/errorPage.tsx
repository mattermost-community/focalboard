// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useCallback} from 'react'
import {useHistory, useLocation} from 'react-router-dom'
import {FormattedMessage} from 'react-intl'

import ErrorIllustration from '../svg/error-illustration'

import Button from '../widgets/buttons/button'
import './errorPage.scss'

import {errorDefFromId, ErrorId} from '../errors'
import {UserSettings} from '../userSettings'

const ErrorPage = () => {
    const history = useHistory()
    const queryString = new URLSearchParams(useLocation().search)
    const errid = queryString.get('id')
    const errorDef = errorDefFromId(errid as ErrorId)

    const handleButtonClick = useCallback((path: string | (()=>string), clearHistory: boolean) => {
        let url = '/'
        if (typeof path === 'function') {
            url = path()
        } else if (path) {
            url = path as string
        }
        if (clearHistory) {
            UserSettings.lastBoardId = ''
            UserSettings.lastViewId = ''
        }
        if (url === window.location.origin) {
            window.location.href = url
        } else {
            history.push(url)
        }
    }, [history])

    const makeButton = ((path: string | (()=>string), txt: string, fill: boolean, clearHistory: boolean) => {
        return (
            <Button
                filled={fill}
                size='large'
                onClick={async () => {
                    handleButtonClick(path, clearHistory)
                }}
            >
                {txt}
            </Button>
        )
    })

    return (
        <div className='ErrorPage'>
            <div>
                <div className='title'>
                    <FormattedMessage
                        id='error.page.title'
                        defaultMessage={'Sorry, something went wrong'}
                    />
                </div>
                <div className='subtitle'>
                    {errorDef.title}
                </div>
                <ErrorIllustration/>
                <br/>
                {
                    (errorDef.button1Enabled ? makeButton(errorDef.button1Redirect, errorDef.button1Text, errorDef.button1Fill, errorDef.button1ClearHistory) : null)
                }
                {
                    (errorDef.button2Enabled ? makeButton(errorDef.button2Redirect, errorDef.button2Text, errorDef.button2Fill, errorDef.button2ClearHistory) : null)
                }
            </div>
        </div>
    )
}

export default React.memo(ErrorPage)
