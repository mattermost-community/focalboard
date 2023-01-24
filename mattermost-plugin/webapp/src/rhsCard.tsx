// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useEffect} from 'react'
import {Provider as ReduxProvider} from 'react-redux'
import {IntlProvider} from 'react-intl'
import {DndProvider} from 'react-dnd'
import {HTML5Backend} from 'react-dnd-html5-backend'
import {TouchBackend} from 'react-dnd-touch-backend'

import store from '../../../webapp/src/store'
import {updateCards, getRHSCardID, getRHSCard, getRHSBoardID} from '../../../webapp/src/store/cards'
import {getBoard} from '../../../webapp/src/store/boards'
import {Block} from '../../../webapp/src/blocks/block'
import {fetchMe, getMe} from '../../../webapp/src/store/users'
import {getViewsByBoard} from '../../../webapp/src/store/views'
import {getCardComments} from '../../../webapp/src/store/comments'
import {getCardContents} from '../../../webapp/src/store/contents'
import {getLanguage, fetchLanguage} from '../../../webapp/src/store/language'
import {loadBoardData} from '../../../webapp/src/store/initialLoad'
import {useAppSelector} from '../../../webapp/src/store/hooks'
import {getMessages} from '../../../webapp/src/i18n'
import CardDetail from '../../../webapp/src/components/cardDetail/cardDetail'
import useConnectToBoard from '../../../webapp/src/hooks/connectToBoard'
import {Utils} from '../../../webapp/src/utils'

import octoClient from '../../../webapp/src/octoClient'

import '../../../webapp/src/styles/variables.scss'
import '../../../webapp/src/styles/main.scss'
import '../../../webapp/src/styles/labels.scss'
import '../../../webapp/src/styles/_markdown.scss'

import './rhsCard.scss'

const RHSCardContent = () => {
    const boardID = useAppSelector(getRHSBoardID)
    const card = useAppSelector(getRHSCard)
    const me = useAppSelector(getMe)
    const board = useAppSelector(getBoard(boardID))
    const views = useAppSelector(getViewsByBoard)
    const comments = useAppSelector(getCardComments(card?.id))
    const contents = useAppSelector(getCardContents(card?.id))
    const language = useAppSelector<string>(getLanguage)
    const activeView = views[boardID] && views[boardID][0]

    useEffect(() => {
        if (boardID) {
            store.dispatch(loadBoardData(boardID))
            store.dispatch(fetchMe())
            store.dispatch(fetchLanguage())
        }
    }, [boardID])

    // TODO: Check the permissions here
    const readonly = false

    useConnectToBoard(store.dispatch, '', me?.id || '', boardID || '', Boolean(readonly), boardID || '')

    if (!board || !card || !activeView) {
        return null
    }

    return (
        <IntlProvider
            locale={language.split(/[_]/)[0]}
            messages={getMessages(language)}
        >
            <CardDetail
                board={board}
                activeView={activeView}
                views={views[boardID]}
                cards={[]}
                card={card}
                comments={comments}
                contents={contents}
                readonly={readonly}
                attachments={[]}
                onDelete={() => {}}
                onClose={() => {}}
                addAttachment={() => {}}
            />
        </IntlProvider>
    )
}

const RHSCard = () => {
    return (
        <ReduxProvider store={store}>
            <DndProvider backend={Utils.isMobile() ? TouchBackend : HTML5Backend}>
                <div
                    className='focalboard-body RHSCard'
                    onKeyDown={(e: React.KeyboardEvent) => e.stopPropagation()}
                    onKeyPress={(e: React.KeyboardEvent) => e.stopPropagation()}
                    onKeyUp={(e: React.KeyboardEvent) => e.stopPropagation()}
                >
                    {/* TODO: Remove this hack to avoid the capture of the cursor by the create post component */}
                    <div
                        className='channel-switch-modal'
                        style={{display: 'none'}}
                    />
                    <RHSCardContent/>
                </div>
            </DndProvider>
        </ReduxProvider>
    )
}

export default RHSCard
