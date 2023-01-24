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

export default function useConnectToBoard(dispatch: any, readToken: string, myID: string, teamId: string|undefined, readonly: boolean, boardId: string): void {
    const [websocketClosed, setWebsocketClosed] = useState(false)
    useEffect(() => {
        let loadAction: any = initialLoad /* eslint-disable-line @typescript-eslint/no-explicit-any */
        let token = localStorage.getItem('focalboardSessionId') || ''
        if (readonly) {
            loadAction = initialReadOnlyLoad
            token = token || readToken || ''
        }

        dispatch(loadAction(boardId))

        let subscribedToTeam = false
        if (wsClient.state === 'open') {
            wsClient.authenticate(token)
            wsClient.subscribeToTeam(teamId || '0')
            subscribedToTeam = true
        }

        const incrementalUpdateBoard = (_: WSClient, boards: Board[]) => {
            // only takes into account the boards that belong to the team
            const teamBoards = boards.filter((b: Board) => b.teamId === '0' || b.teamId === teamId)
            dispatch(updateBoards(teamBoards.filter((b: Board) => b.deleteAt !== 0)))
        }

        const incrementalUpdateBlock = (_: WSClient, blocks: Block[]) => {
            batch(() => {
                dispatch(updateViews(blocks.filter((b: Block) => b.type === 'view' || b.deleteAt !== 0) as BoardView[]))
                dispatch(updateCards(blocks.filter((b: Block) => b.type === 'card' || b.deleteAt !== 0) as Card[]))
                dispatch(updateComments(blocks.filter((b: Block) => b.type === 'comment' || b.deleteAt !== 0) as CommentBlock[]))
                dispatch(updateContents(blocks.filter((b: Block) => b.type !== 'card' && b.type !== 'view' && b.type !== 'board' && b.type !== 'comment') as ContentBlock[]))
            })
        }

        let timeout: ReturnType<typeof setTimeout>
        const updateWebsocketState = (_: WSClient, newState: 'init'|'open'|'close'): void => {
            if (newState === 'open') {
                const newToken = localStorage.getItem('focalboardSessionId') || ''
                wsClient.authenticate(newToken)
                wsClient.subscribeToTeam(teamId || '0')
                subscribedToTeam = true
            }

            if (timeout) {
                clearTimeout(timeout)
            }

            if (newState === 'close') {
                timeout = setTimeout(() => {
                    setWebsocketClosed(true)
                    subscribedToTeam = false
                }, websocketTimeoutForBanner)
            } else {
                setWebsocketClosed(false)
            }
        }

        wsClient.addOnChange(incrementalUpdateBoard, 'board')
        wsClient.addOnChange(incrementalUpdateBlock, 'block')
        wsClient.addOnReconnect(() => dispatch(loadAction(boardId)))
        wsClient.addOnStateChange(updateWebsocketState)
        wsClient.setOnFollowBlock((_: WSClient, subscription: Subscription): void => {
            if (subscription.subscriberId === myID) {
                dispatch(followBlock(subscription))
            }
        })
        wsClient.setOnUnfollowBlock((_: WSClient, subscription: Subscription): void => {
            if (subscription.subscriberId === myID) {
                dispatch(unfollowBlock(subscription))
            }
        })
        return () => {
            if (timeout) {
                clearTimeout(timeout)
            }
            if (subscribedToTeam) {
                wsClient.unsubscribeToTeam(teamId || '0')
            }
            wsClient.removeOnChange(incrementalUpdateBlock, 'block')
            wsClient.removeOnChange(incrementalUpdateBoard, 'board')
            wsClient.removeOnReconnect(() => dispatch(loadAction(boardId)))
            wsClient.removeOnStateChange(updateWebsocketState)
        }
    }, [teamId, readonly, boardId, myID])
}
