// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {useEffect, useState} from 'react'
import {batch} from 'react-redux'

import {Block} from '../blocks/block'
import {ContentBlock} from '../blocks/contentBlock'
import {CommentBlock} from '../blocks/commentBlock'
import {Board} from '../blocks/board'
import {Card} from '../blocks/card'
import {BoardView} from '../blocks/boardView'

import wsClient, {Subscription, WSClient} from '../wsclient'
import {updateBoards} from '../store/boards'
import {updateViews} from '../store/views'
import {updateCards} from '../store/cards'
import {updateContents} from '../store/contents'
import {updateComments} from '../store/comments'
import {followBlock, unfollowBlock} from '../store/users'
import {initialLoad, initialReadOnlyLoad} from '../store/initialLoad'

const websocketTimeoutForBanner = 5000

export default function useConnectToBoard(dispatch: any, readToken: string, myID: string, workspaceId: string|undefined, readonly: boolean, boardId: string): void {
    const [websocketClosed, setWebsocketClosed] = useState(false)
    useEffect(() => {
        let loadAction: any = initialLoad /* eslint-disable-line @typescript-eslint/no-explicit-any */
        let token = localStorage.getItem('focalboardSessionId') || ''
        if (readonly) {
            loadAction = initialReadOnlyLoad
            token = token || readToken || ''
        }

        dispatch(loadAction(boardId))

        let subscribedToWorkspace = false
        if (wsClient.state === 'open') {
            wsClient.authenticate(workspaceId || '0', token)
            wsClient.subscribeToWorkspace(workspaceId || '0')
            subscribedToWorkspace = true
        }

        const incrementalUpdate = (_: WSClient, blocks: Block[]) => {
            // only takes into account the blocks that belong to the workspace
            const workspaceBlocks = blocks.filter((b: Block) => b.workspaceId === '0' || b.workspaceId === workspaceId)

            batch(() => {
                dispatch(updateBoards(workspaceBlocks.filter((b: Block) => b.type === 'board' || b.deleteAt !== 0) as Board[]))
                dispatch(updateViews(workspaceBlocks.filter((b: Block) => b.type === 'view' || b.deleteAt !== 0) as BoardView[]))
                dispatch(updateCards(workspaceBlocks.filter((b: Block) => b.type === 'card' || b.deleteAt !== 0) as Card[]))
                dispatch(updateComments(workspaceBlocks.filter((b: Block) => b.type === 'comment' || b.deleteAt !== 0) as CommentBlock[]))
                dispatch(updateContents(workspaceBlocks.filter((b: Block) => b.type !== 'card' && b.type !== 'view' && b.type !== 'board' && b.type !== 'comment') as ContentBlock[]))
            })
        }

        let timeout: ReturnType<typeof setTimeout>
        const updateWebsocketState = (_: WSClient, newState: 'init'|'open'|'close'): void => {
            if (newState === 'open') {
                const newToken = localStorage.getItem('focalboardSessionId') || ''
                wsClient.authenticate(workspaceId || '0', newToken)
                wsClient.subscribeToWorkspace(workspaceId || '0')
                subscribedToWorkspace = true
            }

            if (timeout) {
                clearTimeout(timeout)
            }

            if (newState === 'close') {
                timeout = setTimeout(() => {
                    setWebsocketClosed(true)
                    subscribedToWorkspace = false
                }, websocketTimeoutForBanner)
            } else {
                setWebsocketClosed(false)
            }
        }

        wsClient.addOnChange(incrementalUpdate)
        wsClient.addOnReconnect(() => dispatch(loadAction(boardId)))
        wsClient.addOnStateChange(updateWebsocketState)
        wsClient.setOnFollowBlock((_: WSClient, subscription: Subscription): void => {
            if (subscription.subscriberId === myID && subscription.workspaceId === workspaceId) {
                dispatch(followBlock(subscription))
            }
        })
        wsClient.setOnUnfollowBlock((_: WSClient, subscription: Subscription): void => {
            if (subscription.subscriberId === myID && subscription.workspaceId === workspaceId) {
                dispatch(unfollowBlock(subscription))
            }
        })
        return () => {
            if (timeout) {
                clearTimeout(timeout)
            }
            if (subscribedToWorkspace) {
                wsClient.unsubscribeToWorkspace(workspaceId || '0')
            }
            wsClient.removeOnChange(incrementalUpdate)
            wsClient.removeOnReconnect(() => dispatch(loadAction(boardId)))
            wsClient.removeOnStateChange(updateWebsocketState)
        }
    }, [workspaceId, readonly, boardId, myID])

    return websocketClosed
}
