// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useState, useEffect} from 'react'
import {IntlProvider} from 'react-intl'
import {
    BrowserRouter as Router,
    Redirect,
    Route,
    Switch,
} from 'react-router-dom'
import {DndProvider} from 'react-dnd'
import {HTML5Backend} from 'react-dnd-html5-backend'
import {TouchBackend} from 'react-dnd-touch-backend'

import {FlashMessages} from './components/flashMessages'
import {getCurrentLanguage, getMessages, storeLanguage} from './i18n'
import {default as client} from './octoClient'
import BoardPage from './pages/boardPage'
import ChangePasswordPage from './pages/changePasswordPage'
import ErrorPage from './pages/errorPage'
import LoginPage from './pages/loginPage'
import RegisterPage from './pages/registerPage'
import {IUser, UserContext} from './user'
import {Utils} from './utils'

const App = React.memo((): JSX.Element => {
    const [language, setLanguage] = useState(getCurrentLanguage())
    const [user, setUser] = useState<IUser|undefined>(undefined)
    const [initialLoad, setInitialLoad] = useState(false)

    useEffect(() => {
        client.getMe().then((loadedUser?: IUser) => {
            setUser(loadedUser)
            setInitialLoad(true)
        })
    }, [])

    const setAndStoreLanguage = (lang: string): void => {
        storeLanguage(lang)
        setLanguage(lang)
    }

    return (
        <IntlProvider
            locale={language}
            messages={getMessages(language)}
        >
            <DndProvider backend={Utils.isMobile() ? TouchBackend : HTML5Backend}>
                <UserContext.Provider value={user}>
                    <FlashMessages milliseconds={2000}/>
                    <Router forceRefresh={true}>
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
                                    <Route path='/shared'>
                                        <BoardPage
                                            workspaceId='0'
                                            readonly={true}
                                            setLanguage={setAndStoreLanguage}
                                        />
                                    </Route>
                                    <Route path='/board'>
                                        {initialLoad && !user && <Redirect to='/login'/>}
                                        <BoardPage
                                            workspaceId='0'
                                            setLanguage={setAndStoreLanguage}
                                        />
                                    </Route>
                                    <Route
                                        path='/workspace/:workspaceId/shared'
                                        render={({match}) => {
                                            return (
                                                <BoardPage
                                                    workspaceId={match.params.workspaceId}
                                                    readonly={true}
                                                    setLanguage={setAndStoreLanguage}
                                                />
                                            )
                                        }}
                                    />
                                    <Route
                                        path='/workspace/:workspaceId/'
                                        render={({match}) => {
                                            if (initialLoad && !user) {
                                                const redirectUrl = `/workspace/${match.params.workspaceId}/`
                                                const loginUrl = `/login?r=${encodeURIComponent(redirectUrl)}`
                                                return <Redirect to={loginUrl}/>
                                            }
                                            return (
                                                <BoardPage
                                                    workspaceId={match.params.workspaceId}
                                                    setLanguage={setAndStoreLanguage}
                                                />
                                            )
                                        }}
                                    />
                                    <Route path='/'>
                                        {initialLoad && !user && <Redirect to='/login'/>}
                                        <BoardPage
                                            workspaceId='0'
                                            setLanguage={setAndStoreLanguage}
                                        />
                                    </Route>
                                </Switch>
                            </div>
                        </div>
                    </Router>
                </UserContext.Provider>
            </DndProvider>
        </IntlProvider>
    )
})

export default App
