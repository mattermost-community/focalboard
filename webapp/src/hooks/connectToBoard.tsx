// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {useMemo} from 'react'
import {batch} from 'react-redux'

import {Block} from '../blocks/block'
import {ContentBlock} from '../blocks/contentBlock'
import {AttachmentBlock} from '../blocks/attachmentBlock'
import {Utils} from '../utils'
import {CommentBlock} from '../blocks/commentBlock'
import {Board, BoardMember} from '../blocks/board'
import {Card} from '../blocks/card'
import {BoardView} from '../blocks/boardView'

import {Subscription, WSClient} from '../wsclient'
import {
    updateBoards,
    updateMembersEnsuringBoardsAndUsers,
    fetchBoardMembers,
    addMyBoardMemberships,
} from '../store/boards'
import {updateViews} from '../store/views'
import {updateCards} from '../store/cards'
import {updateContents} from '../store/contents'
import {updateComments} from '../store/comments'
import {updateAttachments} from '../store/attachments'
import {followBlock, unfollowBlock} from '../store/users'
import {initialLoad, initialReadOnlyLoad} from '../store/initialLoad'
import {Constants} from '../constants'

import {useWebsockets} from './websockets'

export default function useConnectToBoard(dispatch: any, myID: string, teamId: string, readonly: boolean, boardId: string): void {
    const loadAction: (boardId: string) => any = useMemo(() => {
        if (readonly) {
            return initialReadOnlyLoad
        }
        return initialLoad
    }, [readonly])

    useWebsockets(teamId, (wsClient: WSClient) =>{
        const incrementalBlockUpdate = (_: WSClient, blocks: Block[]) => {
            const teamBlocks = blocks

            batch(() => {
                dispatch(updateViews(teamBlocks.filter((b: Block) => b.type === 'view' || b.deleteAt !== 0) as BoardView[]))
                dispatch(updateCards(teamBlocks.filter((b: Block) => b.type === 'card' || b.deleteAt !== 0) as Card[]))
                dispatch(updateComments(teamBlocks.filter((b: Block) => b.type === 'comment' || b.deleteAt !== 0) as CommentBlock[]))
                dispatch(updateAttachments(teamBlocks.filter((b: Block) => b.type === 'attachment' || b.deleteAt !== 0) as AttachmentBlock[]))
                dispatch(updateContents(teamBlocks.filter((b: Block) => b.type !== 'card' && b.type !== 'view' && b.type !== 'board' && b.type !== 'comment' && b.type !== 'attachment') as ContentBlock[]))
            })
        }

        const incrementalBoardUpdate = (_: WSClient, boards: Board[]) => {
            // only takes into account the entities that belong to the team or the user boards
            const teamBoards = boards.filter((b: Board) => b.teamId === Constants.globalTeamId || b.teamId === teamId)
            const activeBoard = teamBoards.find((b: Board) => b.id === boardId)
            dispatch(updateBoards(teamBoards))

            if (activeBoard) {
                dispatch(fetchBoardMembers({
                    teamId,
                    boardId: boardId,
                }))
            }
        }

        const incrementalBoardMemberUpdate = (_: WSClient, members: BoardMember[]) => {
            dispatch(updateMembersEnsuringBoardsAndUsers(members))

            if (myID) {
                const myBoardMemberships = members.filter((boardMember) => boardMember.userId === myID)
                dispatch(addMyBoardMemberships(myBoardMemberships))
            }
        }

        const dispatchLoadAction = () => {
            dispatch(loadAction(boardId))
        }

        Utils.log('useWEbsocket adding onChange handler')
        wsClient.addOnChange(incrementalBlockUpdate, 'block')
        wsClient.addOnChange(incrementalBoardUpdate, 'board')
        wsClient.addOnChange(incrementalBoardMemberUpdate, 'boardMembers')
        wsClient.addOnReconnect(dispatchLoadAction)

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
            Utils.log('useWebsocket cleanup')
            wsClient.removeOnChange(incrementalBlockUpdate, 'block')
            wsClient.removeOnChange(incrementalBoardUpdate, 'board')
            wsClient.removeOnChange(incrementalBoardMemberUpdate, 'boardMembers')
            wsClient.removeOnReconnect(dispatchLoadAction)
        }
    }, [teamId, readonly, boardId, myID])
}
