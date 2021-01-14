// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {IntlProvider} from 'react-intl'

import {
    BrowserRouter as Router,
    Switch,
    Route,
    Redirect,
} from 'react-router-dom'

import client from './octoClient'
import {IUser, UserContext} from './user'

import {getCurrentLanguage, getMessages, storeLanguage} from './i18n'

import {FlashMessages} from './components/flashMessages'

import LoginPage from './pages/loginPage'
import RegisterPage from './pages/registerPage'
import BoardPage from './pages/boardPage'

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
                    <Router>
                        <div id='frame'>
                            <div id='main'>
                                <Switch>
                                    <Route path='/login'>
                                        <LoginPage/>
                                    </Route>
                                    <Route path='/register'>
                                        <RegisterPage/>
                                    </Route>
                                    <Route path='/'>
                                        {this.state.initialLoad && !this.state.user && <Redirect to='login'/>}
                                        <BoardPage setLanguage={this.setAndStoreLanguage}/>
                                    </Route>
                                    <Route path='/board'>
                                        {this.state.initialLoad && !this.state.user && <Redirect to='login'/>}
                                        <BoardPage setLanguage={this.setAndStoreLanguage}/>
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
