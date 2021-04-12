// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useState, useEffect} from 'react'
import {
    BrowserRouter as Router,
    Redirect,
    Route,
    Switch,
} from 'react-router-dom'

import {FlashMessages} from './components/flashMessages'
import {getCurrentLanguage, storeLanguage} from './i18n'
import {default as client} from './octoClient'
import BoardPage from './pages/boardPage'
import ChangePasswordPage from './pages/changePasswordPage'
import ErrorPage from './pages/errorPage'
import LoginPage from './pages/loginPage'
import RegisterPage from './pages/registerPage'
import {IUser} from './user'
import CombinedProviders from './combinedProviders'

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
        <CombinedProviders
            language={language}
            user={user}
            setLanguage={setAndStoreLanguage}
        >
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
                                />
                            </Route>
                            <Route path='/board'>
                                {initialLoad && !user && <Redirect to='/login'/>}
                                <BoardPage workspaceId='0'/>
                            </Route>
                            <Route
                                path='/workspace/:workspaceId/shared'
                                render={({match}) => {
                                    return (
                                        <BoardPage
                                            workspaceId={match.params.workspaceId}
                                            readonly={true}
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
                                        <BoardPage workspaceId={match.params.workspaceId}/>
                                    )
                                }}
                            />
                            <Route path='/'>
                                {initialLoad && !user && <Redirect to='/login'/>}
                                <BoardPage workspaceId='0'/>
                            </Route>
                        </Switch>
                    </div>
                </div>
            </Router>
        </CombinedProviders>
    )
})

export default App
