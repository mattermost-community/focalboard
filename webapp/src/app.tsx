// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useEffect, useMemo} from 'react'
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
import {createBrowserHistory, History} from 'history'

import TelemetryClient from './telemetry/telemetryClient'

import {IAppWindow} from './types'
import {getMessages} from './i18n'
import {FlashMessages} from './components/flashMessages'
import NewVersionBanner from './components/newVersionBanner'
import BoardPage from './pages/boardPage'
import ChangePasswordPage from './pages/changePasswordPage'
import DashboardPage from './pages/dashboard/dashboardPage'
import WelcomePage from './pages/welcome/welcomePage'
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

import {IUser, UserPropPrefix} from './user'
import {UserSettingKey, UserSettings} from './userSettings'

declare let window: IAppWindow

const UUID_REGEX = new RegExp(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/)

type Props = {
    history?: History<unknown>
}

const App = (props: Props): JSX.Element => {
    const language = useAppSelector<string>(getLanguage)
    const loggedIn = useAppSelector<boolean|null>(getLoggedIn)
    const globalError = useAppSelector<string>(getGlobalError)
    const me = useAppSelector<IUser|null>(getMe)
    const dispatch = useAppDispatch()

    let browserHistory: History<unknown>
    if (props.history) {
        browserHistory = props.history
    } else {
        browserHistory = useMemo(() => {
            return createBrowserHistory({basename: Utils.getFrontendBaseURL()})
        }, [])
    }

    useEffect(() => {
        dispatch(fetchLanguage())
        dispatch(fetchMe())
        dispatch(fetchClientConfig())
    }, [])

    if (Utils.isFocalboardPlugin()) {
        useEffect(() => {
            if (window.frontendBaseURL) {
                browserHistory.replace(window.location.pathname.replace(window.frontendBaseURL, ''))
            }
        }, [])
    }

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

    let globalErrorRedirect = null
    if (globalError) {
        globalErrorRedirect = <Route path='/*'><Redirect to={`/error?id=${globalError}`}/></Route>
        setTimeout(() => dispatch(setGlobalError('')), 0)
    }

    const continueToWelcomeScreen = () => {
        return (me?.id !== 'single-user') && loggedIn === true && !(me?.props && me?.props[UserPropPrefix + UserSettingKey.WelcomePageViewed])
    }

    return (
        <IntlProvider
            locale={language.split(/[_]/)[0]}
            messages={getMessages(language)}
        >
            <DndProvider backend={Utils.isMobile() ? TouchBackend : HTML5Backend}>
                <FlashMessages milliseconds={2000}/>
                <Router history={browserHistory}>
                    <div id='frame'>
                        <div id='main'>
                            <NewVersionBanner/>
                            <Switch>
                                {globalErrorRedirect}
                                {
                                    Utils.isFocalboardPlugin() &&
                                    <Route
                                        path='/'
                                        exact={true}
                                        render={() => {
                                            if (loggedIn === false) {
                                                return <Redirect to='/error?id=not-logged-in'/>
                                            }

                                            if (continueToWelcomeScreen()) {
                                                return <Redirect to={'/welcome'}/>
                                            }

                                            if (Utils.isFocalboardPlugin() && UserSettings.lastWorkspaceId) {
                                                return <Redirect to={`/workspace/${UserSettings.lastWorkspaceId}/${UserSettings.lastBoardId}/${UserSettings.lastViewId}`}/>
                                            }

                                            if (loggedIn === true) {
                                                return <BoardPage/>
                                            }

                                            return null
                                        }}
                                    />
                                }

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
                                <Route path='/shared/:boardId?/:viewId?/:cardId?'>
                                    <BoardPage readonly={true}/>
                                </Route>
                                <Route
                                    path='/board/:boardId?/:viewId?/:cardId?'
                                    render={({match: {params: {boardId, viewId, cardId}}}) => {
                                        if (loggedIn === false) {
                                            return <Redirect to='/error?id=not-logged-in'/>
                                        }

                                        if (continueToWelcomeScreen()) {
                                            const originalPath = `/board/${Utils.buildOriginalPath('', boardId, viewId, cardId)}`
                                            return <Redirect to={`/welcome?r=${originalPath}`}/>
                                        }

                                        if (loggedIn === true) {
                                            return <BoardPage/>
                                        }

                                        return null
                                    }}
                                />
                                <Route path='/workspace/:workspaceId/shared/:boardId?/:viewId?/:cardId?'>
                                    <BoardPage readonly={true}/>
                                </Route>
                                <Route
                                    path='/workspace/:workspaceId/:boardId?/:viewId?/:cardId?'
                                    render={({match: {params: {workspaceId, boardId, viewId, cardId}}}) => {
                                        const originalPath = `/workspace/${Utils.buildOriginalPath(workspaceId, boardId, viewId, cardId)}`
                                        if (loggedIn === false) {
                                            let redirectUrl = '/' + Utils.buildURL(originalPath)
                                            if (redirectUrl.indexOf('//') === 0) {
                                                redirectUrl = redirectUrl.slice(1)
                                            }
                                            const loginUrl = `/login?r=${encodeURIComponent(redirectUrl)}`
                                            return <Redirect to={loginUrl}/>
                                        } else if (loggedIn === true) {
                                            if (continueToWelcomeScreen()) {
                                                return <Redirect to={`/welcome?r=${originalPath}`}/>
                                            }

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
                                <Route
                                    exact={true}
                                    path='/welcome'
                                >
                                    <WelcomePage/>
                                </Route>

                                {!Utils.isFocalboardPlugin() &&
                                    <Route
                                        path='/:boardId?/:viewId?/:cardId?'
                                        render={({match: {params: {boardId, viewId, cardId}}}) => {
                                            // Since these 3 path values are optional and they can be anything, we can pass /x/y/z and it will
                                            // match this route however these values may not be valid so we should at the very least check
                                            // board id for descisions made below
                                            const boardIdIsValidUUIDV4 = UUID_REGEX.test(boardId || '')

                                            if (loggedIn === false) {
                                                return <Redirect to='/error?id=not-logged-in'/>
                                            }

                                            if (continueToWelcomeScreen()) {
                                                const originalPath = `/${Utils.buildOriginalPath('', boardId, viewId, cardId)}`
                                                const queryString = boardIdIsValidUUIDV4 ? `r=${originalPath}` : ''
                                                return <Redirect to={`/welcome?${queryString}`}/>
                                            }

                                            if (loggedIn === true) {
                                                return <BoardPage/>
                                            }

                                            return null
                                        }}
                                    />}
                            </Switch>
                        </div>
                    </div>
                </Router>
            </DndProvider>
        </IntlProvider>
    )
}

export default React.memo(App)
