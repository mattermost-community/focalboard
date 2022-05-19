// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useEffect} from 'react'
import {Provider as ReduxProvider} from 'react-redux'
import {IntlProvider} from 'react-intl'
import {DndProvider} from 'react-dnd'
import {HTML5Backend} from 'react-dnd-html5-backend'
import {TouchBackend} from 'react-dnd-touch-backend'

import store from '../../../webapp/src/store'
import {updateCards, getRHSCardID, getRHSCard} from '../../../webapp/src/store/cards'
import {updateBoards, getBoard} from '../../../webapp/src/store/boards'
import {fetchMe, getMe} from '../../../webapp/src/store/users'
import {updateViews, getViewsByBoard} from '../../../webapp/src/store/views'
import {updateComments, getCardComments} from '../../../webapp/src/store/comments'
import {updateContents, getCardContents} from '../../../webapp/src/store/contents'
import {getLanguage, fetchLanguage} from '../../../webapp/src/store/language'
import {useAppSelector} from '../../../webapp/src/store/hooks'
import {getMessages} from '../../../webapp/src/i18n'
import {Card} from '../../../webapp/src/blocks/card'
import {Block} from '../../../webapp/src/blocks/block'
import {Board} from '../../../webapp/src/blocks/board'
import {BoardView} from '../../../webapp/src/blocks/boardView'
import {ContentBlock} from '../../../webapp/src/blocks/contentBlock'
import {CommentBlock} from '../../../webapp/src/blocks/commentBlock'
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
    const cardID = useAppSelector(getRHSCardID)
    const card = useAppSelector(getRHSCard)
    const me = useAppSelector(getMe)
    const board = useAppSelector(getBoard(card?.parentId))
    const views = useAppSelector(getViewsByBoard)
    const comments = useAppSelector(getCardComments(card?.id))
    const contents = useAppSelector(getCardContents(card?.id))
    const language = useAppSelector<string>(getLanguage)
    const activeView = views[card?.parentId] && views[card?.parentId][0]

    useEffect(() => {
        if (cardID) {
            octoClient.getSubtree(cardID, 2).then((blocks) => {
                store.dispatch(updateBoards(blocks.filter((b: Block) => b.type === 'board' || b.deleteAt !== 0) as Board[]))
                store.dispatch(updateViews(blocks.filter((b: Block) => b.type === 'view' || b.deleteAt !== 0) as BoardView[]))
                store.dispatch(updateCards(blocks.filter((b: Block) => b.type === 'card' || b.deleteAt !== 0) as Card[]))
                store.dispatch(updateComments(blocks.filter((b: Block) => b.type === 'comment' || b.deleteAt !== 0) as CommentBlock[]))
                store.dispatch(updateContents(blocks.filter((b: Block) => b.type !== 'card' && b.type !== 'view' && b.type !== 'board' && b.type !== 'comment') as ContentBlock[]))
            })
            store.dispatch(fetchMe())
            store.dispatch(fetchLanguage())
        }
    }, [cardID])

    // TODO: Check the permissions here
    const readonly = false

    useConnectToBoard(store.dispatch, '', me?.id || '', card?.workspaceId || '', Boolean(readonly), card?.parentId || '')

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
                views={views[card.parentId]}
                cards={[]}
                card={card}
                comments={comments}
                contents={contents}
                readonly={readonly}
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
