// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useEffect} from 'react'
import {IntlProvider} from 'react-intl'
import {DndProvider} from 'react-dnd'
import {HTML5Backend} from 'react-dnd-html5-backend'
import {TouchBackend} from 'react-dnd-touch-backend'
import {History} from 'history'

import TelemetryClient from './telemetry/telemetryClient'

import {getMessages} from './i18n'
import {FlashMessages} from './components/flashMessages'
import NewVersionBanner from './components/newVersionBanner'
import {Utils} from './utils'
import wsClient from './wsclient'
import {fetchMe, getMe} from './store/users'
import {getLanguage, fetchLanguage} from './store/language'
import {useAppSelector, useAppDispatch} from './store/hooks'
import {fetchClientConfig} from './store/clientConfig'
import FocalboardRouter from './router'

import {IUser} from './user'

type Props = {
    history?: History<unknown>
}

const App = (props: Props): JSX.Element => {
    const language = useAppSelector<string>(getLanguage)
    const me = useAppSelector<IUser|null>(getMe)
    const dispatch = useAppDispatch()

    useEffect(() => {
        dispatch(fetchLanguage())
        dispatch(fetchMe())
        dispatch(fetchClientConfig())
    }, [])

    // this is a temporary solution while we're using legacy routes
    // for shared boards as a way to disable websockets, and should be
    // removed when anonymous plugin routes are implemented. This
    // check is used to detect if we're running inside the plugin but
    // in a legacy route
    if (!Utils.isFocalboardLegacy()) {
        useEffect(() => {
            wsClient.open()
            return () => {
                wsClient.close()
            }
        }, [])
    }

    useEffect(() => {
        if (me) {
            TelemetryClient.setUser(me)
        }
    }, [me])

    return (
        <IntlProvider
            locale={language.split(/[_]/)[0]}
            messages={getMessages(language)}
        >
            <DndProvider backend={Utils.isMobile() ? TouchBackend : HTML5Backend}>
                <FlashMessages milliseconds={2000}/>
                <div id='frame'>
                    <div id='main'>
                        <NewVersionBanner/>
                        <FocalboardRouter history={props.history}/>
                    </div>
                </div>
            </DndProvider>
        </IntlProvider>
    )
}

export default React.memo(App)
