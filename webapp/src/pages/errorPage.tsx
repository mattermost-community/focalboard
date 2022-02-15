// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useCallback} from 'react'
import {FormattedMessage} from 'react-intl'
import {useHistory, useLocation} from 'react-router-dom'

import Button from '../widgets/buttons/button'
import './errorPage.scss'

import {errorDefFromId, ErrorId} from '../errors'

const ErrorPage = () => {
    const history = useHistory()
    const queryString = new URLSearchParams(useLocation().search)
    const errid = queryString.get('id')
    const errorDef = errorDefFromId(errid as ErrorId)

    const handleButtonClick = useCallback((path: string | (()=>string)) => {
        let url = '/dashboard'
        if (typeof path === 'function') {
            url = path()
        } else if (path) {
            url = path as string
        }
        history.push(url)
    }, [history])

    const makeButton = ((path: string | (()=>string), id: string, fill: boolean) => {
        return (
            <Button
                filled={fill}
                onClick={async () => {
                    handleButtonClick(path)
                }}
            >
                <FormattedMessage
                    id={id}
                    defaultMessage='OK'
                />
            </Button>
        )
    })

    return (
        <div className='ErrorPage'>
            <div className='title'>{'Error'}</div>
            <div>
                <FormattedMessage
                    id={errorDef.titleId}
                    defaultMessage='Unknown error.'
                />
            </div>
            <br/>
            {
                (errorDef.button1Enabled ? makeButton(errorDef.button1Redirect, errorDef.button1Id, errorDef.button1Fill) : null)
            }
            {
                (errorDef.button2Enabled ? makeButton(errorDef.button2Redirect, errorDef.button2Id, errorDef.button2Fill) : null)
            }
        </div>
    )
}

export default React.memo(ErrorPage)
