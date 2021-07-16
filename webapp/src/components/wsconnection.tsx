// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useState, useEffect, useCallback} from 'react'
import {FormattedMessage} from 'react-intl'
import {useRouteMatch} from 'react-router-dom'

import {IBlock} from '../blocks/block'
import {MutableBoard} from '../blocks/board'
import {MutableBoardView} from '../blocks/boardView'
import octoClient from '../octoClient'
import {OctoListener} from '../octoListener'
import {Utils} from '../utils'
import {fetchCurrentWorkspaceUsers} from '../store/currentWorkspaceUsers'
import {fetchBoards, getBoards, getTemplates, updateBoards} from '../store/boards'
import {fetchViews, updateViews} from '../store/views'
import {useAppDispatch, useAppSelector} from '../store/hooks'

type Props = {

    // TODO: Remove this when we finish the migration of BoardTree to redux
    onBlocksChange: (blocks: IBlock[]) => void
}

const WSConnection = (props: Props) => {
    const [closed, setClosed] = useState(false)
    const [closedTimeoutId, setClosedTimeoutId] = useState<ReturnType<typeof setTimeout>>()
    const dispatch = useAppDispatch()
    const boards = useAppSelector(getBoards)
    const templates = useAppSelector(getTemplates)
    const match = useRouteMatch<{boardId: string}>()

    const stateChange = useCallback((state) => {
        switch (state) {
        case 'close': {
            // Show error after a delay to ignore brief interruptions
            if (!closed && !closedTimeoutId) {
                const timeoutId = setTimeout(() => {
                    setClosed(true)
                    setClosedTimeoutId(undefined)
                }, 5000)
                setClosedTimeoutId(timeoutId)
            }
            break
        }
        case 'open': {
            if (closedTimeoutId) {
                clearTimeout(closedTimeoutId)
            }
            setClosed(false)
            setClosedTimeoutId(undefined)
            Utils.log('Connection established')
            break
        }
        }
    }, [closed, closedTimeoutId])

    const boardIds = [...boards.map((o) => o.id), ...templates.map((o) => o.id)]
    let boardIdsToListen: string[]
    if (boardIds.length > 0) {
        boardIdsToListen = ['', ...boardIds]
    } else {
        // Read-only view
        boardIdsToListen = [match.params.boardId || '']
    }

    useEffect(() => {
        const workspaceListener = new OctoListener()

        workspaceListener.open(
            octoClient.workspaceId,
            boardIdsToListen,
            async (blocks: IBlock[]) => {
                Utils.log(`workspaceListener.onChanged: ${blocks.length}`)
                dispatch(updateBoards(blocks.filter((b: IBlock) => b.type === 'board') as MutableBoard[]))
                dispatch(updateViews(blocks.filter((b: IBlock) => b.type === 'view') as MutableBoardView[]))
                props.onBlocksChange(blocks)
            },
            () => {
                Utils.log('workspaceListener.onReconnect')
                dispatch(fetchCurrentWorkspaceUsers())
                dispatch(fetchBoards())
                dispatch(fetchViews())
            },
            stateChange,
        )

        return () => {
            workspaceListener.close()
        }
    }, [boardIdsToListen.join('-'), props.onBlocksChange])

    if (closed) {
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

export default WSConnection
