// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useState} from 'react'
import {IntlProvider} from 'react-intl'

import {
    BrowserRouter as Router,
    Switch,
    Route,
} from 'react-router-dom'

import {getCurrentLanguage, getMessages, storeLanguage} from './i18n'

import {FlashMessages} from './components/flashMessages'

import LoginPage from './pages/loginPage'
import BoardPage from './pages/boardPage'

export default function App(): JSX.Element {
    const [language, setLanguage] = useState(getCurrentLanguage())
    const setAndStoreLanguage = (lang: string) => {
        storeLanguage(lang)
        setLanguage(lang)
    }
    return (
        <IntlProvider
            locale={language}
            messages={getMessages(language)}
        >
            <FlashMessages milliseconds={2000}/>
            <Router>
                <div id='frame'>
                    <div id='main'>
                        <Switch>
                            <Route path='/login'>
                                <LoginPage/>
                            </Route>
                            <Route path='/'>
                                <BoardPage setLanguage={setAndStoreLanguage}/>
                            </Route>
                            <Route path='/board'>
                                <BoardPage setLanguage={setAndStoreLanguage}/>
                            </Route>
                        </Switch>
                    </div>
                </div>
            </Router>
        </IntlProvider>
    )
}
