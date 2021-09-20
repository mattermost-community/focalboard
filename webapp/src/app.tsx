// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useEffect} from 'react'
import {
    Router,
    Redirect,
    Route,
    Switch,
} from 'react-router-dom'
import {IntlProvider} from 'react-intl'
import {DndProvider} from 'react-dnd'
import {HTML5Backend} from 'react-dnd-html5-backend'
import {TouchBackend} from 'react-dnd-touch-backend'

import {createBrowserHistory} from 'history'

import TelemetryClient from './telemetry/telemetryClient'

import {getMessages} from './i18n'
import {FlashMessages} from './components/flashMessages'
import BoardPage from './pages/boardPage'
import ChangePasswordPage from './pages/changePasswordPage'
import DashboardPage from './pages/dashboard/dashboardPage'
import ErrorPage from './pages/errorPage'
import LoginPage from './pages/loginPage'
import RegisterPage from './pages/registerPage'
import {Utils} from './utils'
import wsClient from './wsclient'
import {fetchMe, getLoggedIn, getMe} from './store/users'
import {getLanguage, fetchLanguage} from './store/language'
import {setGlobalError, getGlobalError} from './store/globalError'
import {useAppSelector, useAppDispatch} from './store/hooks'
import {fetchClientConfig} from './store/clientConfig'

import {IUser} from './user'

export const history = createBrowserHistory({basename: Utils.getFrontendBaseURL()})

if (Utils.isDesktop() && Utils.isFocalboardPlugin()) {
    window.addEventListener('message', (event: MessageEvent) => {
        if (event.origin !== window.location.origin) {
            return
        }

        const pathName = event.data.message.pathName
        if (!pathName) {
            return
        }

        history.replace(pathName.replace((window as any).frontendBaseURL, ''))
    })
}

const browserHistory = {
    ...history,
    push: (path: string, ...args: any[]) => {
        if (Utils.isDesktop() && Utils.isFocalboardPlugin()) {
            window.postMessage(
                {
                    type: 'browser-history-push',
                    message: {
                        path: `${(window as any).frontendBaseURL}${path}`,
                    },
                },
                window.location.origin,
            )
        } else {
            history.push(path, ...args)
        }
    },
}

const App = React.memo((): JSX.Element => {
    const language = useAppSelector<string>(getLanguage)
    const loggedIn = useAppSelector<boolean|null>(getLoggedIn)
    const globalError = useAppSelector<string>(getGlobalError)
    const me = useAppSelector<IUser|null>(getMe)
    const dispatch = useAppDispatch()

    useEffect(() => {
        dispatch(fetchLanguage())
        dispatch(fetchMe())
        dispatch(fetchClientConfig())
    }, [])

    useEffect(() => {
        wsClient.open()
        return () => {
            wsClient.close()
        }
    }, [])

    useEffect(() => {
        if (me) {
            TelemetryClient.setUser(me)
        }
    }, [me])

    let globalErrorRedirect = null
    if (globalError) {
        globalErrorRedirect = <Route path='/*'><Redirect to={`/error?id=${globalError}`}/></Route>
        setTimeout(() => dispatch(setGlobalError('')), 0)
    }

    return (
        <IntlProvider
            locale={language.split(/[_]/)[0]}
            messages={getMessages(language)}
        >
            <DndProvider backend={Utils.isMobile() ? TouchBackend : HTML5Backend}>
                <FlashMessages milliseconds={2000}/>
                <Router
                    history={browserHistory}
                >
                    <div id='frame'>
                        <div id='main'>
                            <Switch>
                                {globalErrorRedirect}
                                <Route path='/error'>
                                    <ErrorPage/>
                                </Route>
                                <Route path='/login'>
                                    <LoginPage/>
                                </Route>
                                <Route path='/register'>
                                    <RegisterPage/>
                                </Route>
                                <Route path='/change_password'>
                                    <ChangePasswordPage/>
                                </Route>
                                <Route path='/shared/:boardId?/:viewId?'>
                                    <BoardPage readonly={true}/>
                                </Route>
                                <Route path='/board/:boardId?/:viewId?/:cardId?'>
                                    {loggedIn === false && <Redirect to='/login'/>}
                                    {loggedIn === true && <BoardPage/>}
                                </Route>
                                <Route path='/workspace/:workspaceId/shared/:boardId?/:viewId?'>
                                    <BoardPage readonly={true}/>
                                </Route>
                                <Route
                                    path='/workspace/:workspaceId/:boardId?/:viewId?/:cardId?'
                                    render={({match}) => {
                                        if (loggedIn === false) {
                                            let redirectUrl = '/' + Utils.buildURL(`/workspace/${match.params.workspaceId}/`)
                                            if (redirectUrl.indexOf('//') === 0) {
                                                redirectUrl = redirectUrl.slice(1)
                                            }
                                            const loginUrl = `/login?r=${encodeURIComponent(redirectUrl)}`
                                            return <Redirect to={loginUrl}/>
                                        } else if (loggedIn === true) {
                                            return (
                                                <BoardPage/>
                                            )
                                        }
                                        return null
                                    }}
                                />
                                <Route
                                    exact={true}
                                    path='/dashboard'
                                >
                                    <DashboardPage/>
                                </Route>
                                <Route path='/:boardId?/:viewId?/:cardId?'>
                                    {loggedIn === false && <Redirect to='/login'/>}
                                    {loggedIn === true && <BoardPage/>}
                                </Route>
                            </Switch>
                        </div>
                    </div>
                </Router>
            </DndProvider>
        </IntlProvider>
    )
})

export default App
