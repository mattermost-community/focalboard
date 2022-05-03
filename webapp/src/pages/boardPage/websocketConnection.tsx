// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useEffect, useState, useMemo} from 'react'
import {batch} from 'react-redux'
import {useLocation} from 'react-router-dom'
import {FormattedMessage} from 'react-intl'

import {Block} from '../../blocks/block'
import {ContentBlock} from '../../blocks/contentBlock'
import {CommentBlock} from '../../blocks/commentBlock'
import {Board, BoardMember} from '../../blocks/board'
import {Card} from '../../blocks/card'
import {BoardView} from '../../blocks/boardView'
import wsClient, {Subscription, WSClient} from '../../wsclient'
import './boardPage.scss'
import {updateBoards, updateMembersEnsuringBoardsAndUsers} from '../../store/boards'
import {updateViews} from '../../store/views'
import {updateCards} from '../../store/cards'
import {updateContents} from '../../store/contents'
import {updateComments} from '../../store/comments'
import {useAppSelector, useAppDispatch} from '../../store/hooks'

import {followBlock, getMe, unfollowBlock} from '../../store/users'
import {IUser} from '../../user'
import {Constants} from "../../constants"

const websocketTimeoutForBanner = 5000

type Props = {
    readonly: boolean
    teamId: string
    boardId: string
    loadAction: (boardID: string) => any
}

const WebsocketConnection = (props: Props) => {
    const dispatch = useAppDispatch()
    const [websocketClosed, setWebsocketClosed] = useState(false)
    const queryString = new URLSearchParams(useLocation().search)
    const me = useAppSelector<IUser|null>(getMe)

    const token = useMemo(() => {
        const storedToken = localStorage.getItem('focalboardSessionId') || ''
        if (props.readonly) {
            return storedToken || queryString.get('r') || ''
        }
        return storedToken
    }, [props.readonly])

    useEffect(() => {
        let subscribedToTeam = false
        if (wsClient.state === 'open') {
            wsClient.authenticate(props.teamId || Constants.globalTeamId, token)
            wsClient.subscribeToTeam(props.teamId || Constants.globalTeamId)
            subscribedToTeam = true
        }

        const incrementalBlockUpdate = (_: WSClient, blocks: Block[]) => {
            // ToDo: update this
            // - create a selector to get user boards
            // - replace the teamId check of blocks by a "is in my boards" check
            /* const teamBlocks = blocks.filter((b: Block) => b.teamId === '0' || b.boardId in userBoardIds) */
            const teamBlocks = blocks

            batch(() => {
                dispatch(updateViews(teamBlocks.filter((b: Block) => b.type === 'view' || b.deleteAt !== 0) as BoardView[]))
                dispatch(updateCards(teamBlocks.filter((b: Block) => b.type === 'card' || b.deleteAt !== 0) as Card[]))
                dispatch(updateComments(teamBlocks.filter((b: Block) => b.type === 'comment' || b.deleteAt !== 0) as CommentBlock[]))
                dispatch(updateContents(teamBlocks.filter((b: Block) => b.type !== 'card' && b.type !== 'view' && b.type !== 'board' && b.type !== 'comment') as ContentBlock[]))
            })
        }

        const incrementalBoardUpdate = (_: WSClient, boards: Board[]) => {
            // only takes into account the entities that belong to the team or the user boards
            const teamBoards = boards.filter((b: Board) => b.teamId === Constants.globalTeamId || b.teamId === props.teamId)
            dispatch(updateBoards(teamBoards))
        }

        const incrementalBoardMemberUpdate = (_: WSClient, members: BoardMember[]) => {
            dispatch(updateMembersEnsuringBoardsAndUsers(members))
        }

        let timeout: ReturnType<typeof setTimeout>
        const updateWebsocketState = (_: WSClient, newState: 'init'|'open'|'close'): void => {
            if (newState === 'open') {
                const newToken = localStorage.getItem('focalboardSessionId') || ''
                wsClient.authenticate(props.teamId || Constants.globalTeamId, newToken)
                wsClient.subscribeToTeam(props.teamId || Constants.globalTeamId)
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

        wsClient.addOnChange(incrementalBlockUpdate, 'block')
        wsClient.addOnChange(incrementalBoardUpdate, 'board')
        wsClient.addOnChange(incrementalBoardMemberUpdate, 'boardMembers')
        wsClient.addOnReconnect(() => dispatch(props.loadAction(props.boardId)))
        wsClient.addOnStateChange(updateWebsocketState)
        wsClient.setOnFollowBlock((_: WSClient, subscription: Subscription): void => {
            if (subscription.subscriberId === me?.id) {
                dispatch(followBlock(subscription))
            }
        })
        wsClient.setOnUnfollowBlock((_: WSClient, subscription: Subscription): void => {
            if (subscription.subscriberId === me?.id) {
                dispatch(unfollowBlock(subscription))
            }
        })
        return () => {
            if (timeout) {
                clearTimeout(timeout)
            }
            if (subscribedToTeam) {
                // wsClient.unsubscribeToTeam(props.teamId || '0')
            }
            wsClient.removeOnChange(incrementalBlockUpdate, 'block')
            wsClient.removeOnChange(incrementalBoardUpdate, 'board')
            wsClient.removeOnChange(incrementalBoardMemberUpdate, 'boardMembers')
            wsClient.removeOnReconnect(() => dispatch(props.loadAction(props.boardId)))
            wsClient.removeOnStateChange(updateWebsocketState)
        }
    }, [me?.id, props.teamId, props.readonly, props.boardId, props.loadAction])

    if (websocketClosed) {
        return (
            <div className='WSConnection error'>
                <a
                    href='https://www.focalboard.com/fwlink/websocket-connect-error.html'
                    target='_blank'
                    rel='noreferrer'
                >
                    <FormattedMessage
                        id='Error.websocket-closed'
                        defaultMessage='Websocket connection closed, connection interrupted. If this persists, check your server or web proxy configuration.'
                    />
                </a>
            </div>
        )
    }

    return null
}

export default WebsocketConnection
