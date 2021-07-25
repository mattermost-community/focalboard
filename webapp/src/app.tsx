// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useState, useEffect} from 'react'
import {
    BrowserRouter as Router,
    Redirect,
    Route,
    Switch,
} from 'react-router-dom'
import {IntlProvider} from 'react-intl'
import {DndProvider} from 'react-dnd'
import {HTML5Backend} from 'react-dnd-html5-backend'
import {TouchBackend} from 'react-dnd-touch-backend'

import {getMessages} from './i18n'
import {FlashMessages} from './components/flashMessages'
import BoardPage from './pages/boardPage'
import ChangePasswordPage from './pages/changePasswordPage'
import ErrorPage from './pages/errorPage'
import LoginPage from './pages/loginPage'
import RegisterPage from './pages/registerPage'
import {Utils} from './utils'
import wsClient from './wsclient'
import {importNativeAppSettings} from './nativeApp'
import {fetchMe, getLoggedIn} from './store/users'
import {getLanguage, fetchLanguage} from './store/language'
import {useAppSelector, useAppDispatch} from './store/hooks'

const App = React.memo((): JSX.Element => {
    importNativeAppSettings()

    const language = useAppSelector<string>(getLanguage)
    const loggedIn = useAppSelector<boolean|null>(getLoggedIn)
    const dispatch = useAppDispatch()

    useEffect(() => {
        dispatch(fetchLanguage())
        dispatch(fetchMe())
    }, [])

    useEffect(() => {
        wsClient.open()
        return () => {
            wsClient.close()
        }
    }, [])

    return (
        <IntlProvider
            locale={language.split(/[_]/)[0]}
            messages={getMessages(language)}
        >
            <DndProvider backend={Utils.isMobile() ? TouchBackend : HTML5Backend}>
                <FlashMessages milliseconds={2000}/>
                <Router basename={Utils.getBaseURL()}>
                    <div id='frame'>
                        <div id='main'>
                            <Switch>
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
                                <Route path='/board/:boardId?/:viewId?'>
                                    {loggedIn === false && <Redirect to='/login'/>}
                                    {loggedIn === true && <BoardPage/>}
                                </Route>
                                <Route path='/workspace/:workspaceId/shared/:boardId?/:viewId?'>
                                    <BoardPage readonly={true}/>
                                </Route>
                                <Route
                                    path='/workspace/:workspaceId/:boardId?/:viewId?'
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
                                <Route path='/:boardId?/:viewId?'>
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
