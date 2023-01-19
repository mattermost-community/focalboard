// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {
    Router,
    Switch,
} from 'react-router-dom'

import {IntlProvider} from 'react-intl'
import {DndProvider} from 'react-dnd'
import {HTML5Backend} from 'react-dnd-html5-backend'
import {TouchBackend} from 'react-dnd-touch-backend'
import {createBrowserHistory} from 'history'

import BoardPage from '../pages/boardPage/boardPage'
import FBRoute from '../route'

import {getMessages} from '../i18n'
import {FlashMessages} from '../components/flashMessages'
import NewVersionBanner from '../components/newVersionBanner'
import {Utils} from '../utils'
import {getLanguage} from '../store/language'
import {useAppSelector} from '../store/hooks'

const PublicRouter = () => {
    const publicBaseURL = Utils.getFrontendBaseURL() + '/public'
    const history = createBrowserHistory({basename: publicBaseURL})

    return (
        <Router history={history}>
            <Switch>
                <FBRoute path={['/team/:teamId/shared/:boardId?/:viewId?/:cardId?', '/shared/:boardId?/:viewId?/:cardId?']}>
                    <BoardPage readonly={true}/>
                </FBRoute>
            </Switch>
        </Router>
    )
}

const PublicApp = (): JSX.Element => {
    const language = useAppSelector<string>(getLanguage)

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
                        <PublicRouter/>
                    </div>
                </div>
            </DndProvider>
        </IntlProvider>
    )
}

export default React.memo(PublicApp)
