// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {IntlProvider} from 'react-intl'
import {
    BrowserRouter as Router,
    Redirect,
    Route,
    Switch,
} from 'react-router-dom'

import {FlashMessages} from './components/flashMessages'
import {getCurrentLanguage, getMessages, storeLanguage} from './i18n'
import {default as client} from './octoClient'
import BoardPage from './pages/boardPage'
import ChangePasswordPage from './pages/changePasswordPage'
import ErrorPage from './pages/errorPage'
import LoginPage from './pages/loginPage'
import RegisterPage from './pages/registerPage'
import {IUser, UserContext} from './user'

type State = {
    language: string,
    user?: IUser
    initialLoad: boolean,
}

export default class App extends React.PureComponent<unknown, State> {
    constructor(props: unknown) {
        super(props)
        this.state = {
            language: getCurrentLanguage(),
            initialLoad: false,
        }
    }

    public componentDidMount(): void {
        client.getMe().then((user?: IUser) => {
            this.setState({user, initialLoad: true})
        })
    }

    setAndStoreLanguage = (lang: string): void => {
        storeLanguage(lang)
        this.setState({language: lang})
    }

    public render(): JSX.Element {
        return (
            <IntlProvider
                locale={this.state.language}
                messages={getMessages(this.state.language)}
            >
                <UserContext.Provider value={this.state.user}>
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
                                            setLanguage={this.setAndStoreLanguage}
                                        />
                                    </Route>
                                    <Route path='/board'>
                                        {this.state.initialLoad && !this.state.user && <Redirect to='/login'/>}
                                        <BoardPage
                                            workspaceId='0'
                                            setLanguage={this.setAndStoreLanguage}
                                        />
                                    </Route>
                                    <Route
                                        path='/workspace/:workspaceId/shared'
                                        render={({match}) => {
                                            return (
                                                <BoardPage
                                                    workspaceId={match.params.workspaceId}
                                                    readonly={true}
                                                    setLanguage={this.setAndStoreLanguage}
                                                />
                                            )
                                        }}
                                    />
                                    <Route
                                        path='/workspace/:workspaceId/'
                                        render={({match}) => {
                                            if (this.state.initialLoad && !this.state.user) {
                                                const redirectUrl = `/workspace/${match.params.workspaceId}/`
                                                const loginUrl = `/login?r=${encodeURIComponent(redirectUrl)}`
                                                return <Redirect to={loginUrl}/>
                                            }
                                            return (
                                                <BoardPage
                                                    workspaceId={match.params.workspaceId}
                                                    setLanguage={this.setAndStoreLanguage}
                                                />
                                            )
                                        }}
                                    />
                                    <Route path='/'>
                                        {this.state.initialLoad && !this.state.user && <Redirect to='/login'/>}
                                        <BoardPage
                                            workspaceId='0'
                                            setLanguage={this.setAndStoreLanguage}
                                        />
                                    </Route>
                                </Switch>
                            </div>
                        </div>
                    </Router>
                </UserContext.Provider>
            </IntlProvider>
        )
    }
}
