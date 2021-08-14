// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useEffect, useState} from 'react'
import {batch} from 'react-redux'
import {FormattedMessage} from 'react-intl'
import {generatePath, useHistory, useRouteMatch} from 'react-router-dom'
import {useHotkeys} from 'react-hotkeys-hook'

import {Block} from '../blocks/block'
import {ContentBlock} from '../blocks/contentBlock'
import {CommentBlock} from '../blocks/commentBlock'
import {Board} from '../blocks/board'
import {Card} from '../blocks/card'
import {BoardView} from '../blocks/boardView'
import {sendFlashMessage} from '../components/flashMessages'
import Workspace from '../components/workspace'
import mutator from '../mutator'
import octoClient from '../octoClient'
import {Utils} from '../utils'
import wsClient, {WSClient} from '../wsclient'
import './boardPage.scss'
import {updateBoards, getCurrentBoard, setCurrent as setCurrentBoard} from '../store/boards'
import {updateViews, getCurrentView, setCurrent as setCurrentView, getCurrentBoardViews} from '../store/views'
import {updateCards} from '../store/cards'
import {updateContents} from '../store/contents'
import {updateComments} from '../store/comments'
import {initialLoad, initialReadOnlyLoad} from '../store/initialLoad'
import {useAppSelector, useAppDispatch} from '../store/hooks'

type Props = {
    readonly?: boolean
}

const websocketTimeoutForBanner = 5000

const BoardPage = (props: Props) => {
    const board = useAppSelector(getCurrentBoard)
    const activeView = useAppSelector(getCurrentView)
    const boardViews = useAppSelector(getCurrentBoardViews)
    const dispatch = useAppDispatch()

    const history = useHistory()
    const match = useRouteMatch<{boardId: string, viewId: string, workspaceId?: string}>()
    const [websocketClosed, setWebsocketClosed] = useState(false)

    // TODO: Make this less brittle. This only works because this is the root render function
    useEffect(() => {
        octoClient.workspaceId = match.params.workspaceId || '0'
    }, [match.params.workspaceId])

    // Backward compatibility: This can be removed in the future, this is for
    // transform the old query params into routes
    useEffect(() => {
        const queryString = new URLSearchParams(window.location.search)
        const queryBoardId = queryString.get('id')
        const queryViewId = queryString.get('v')
        if (queryBoardId) {
            const params = {...match.params, boardId: queryBoardId}
            if (queryViewId) {
                params.viewId = queryViewId
            }
            const newPath = generatePath(match.path, params)
            history.replace(newPath)
        }
    }, [])

    useEffect(() => {
        const boardId = match.params.boardId
        const viewId = match.params.viewId

        if (!boardId) {
            // Load last viewed boardView
            const lastBoardId = localStorage.getItem('lastBoardId') || undefined
            const lastViewId = localStorage.getItem('lastViewId') || undefined
            if (lastBoardId) {
                let newPath = generatePath(match.path, {...match.params, boardId: lastBoardId})
                if (lastViewId) {
                    newPath = generatePath(match.path, {...match.params, boardId: lastBoardId, viewId: lastViewId})
                }
                history.replace(newPath)
                return
            }
            return
        }

        Utils.log(`attachToBoard: ${boardId}`)
        if (!viewId && boardViews.length > 0) {
            const newPath = generatePath(match.path, {...match.params, boardId, viewId: boardViews[0].id})
            history.replace(newPath)
            return
        }

        localStorage.setItem('lastBoardId', boardId || '')
        localStorage.setItem('lastViewId', viewId || '')
        dispatch(setCurrentBoard(boardId || ''))
        dispatch(setCurrentView(viewId || ''))
    }, [match.params.boardId, match.params.viewId, history, boardViews])

    useEffect(() => {
        Utils.setFavicon(board?.fields.icon)
    }, [board?.fields.icon])

    useEffect(() => {
        if (board) {
            let title = `${board.title}`
            if (activeView?.title) {
                title += ` | ${activeView.title}`
            }
            document.title = title
        } else {
            document.title = 'Focalboard'
        }
    }, [board?.title, activeView?.title])

    useEffect(() => {
        let loadAction: any = initialLoad
        let token = localStorage.getItem('focalboardSessionId') || ''
        if (props.readonly) {
            loadAction = initialReadOnlyLoad
            const queryString = new URLSearchParams(window.location.search)
            token = token || queryString.get('r') || ''
        }
        dispatch(loadAction(match.params.boardId))

        if (wsClient.state === 'open') {
            wsClient.authenticate(match.params.workspaceId || '0', token)
            wsClient.subscribeToWorkspace(match.params.workspaceId || '0')
        }

        const incrementalUpdate = (_: WSClient, blocks: Block[]) => {
            batch(() => {
                dispatch(updateBoards(blocks.filter((b: Block) => b.type === 'board' || b.deleteAt !== 0) as Board[]))
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
                wsClient.authenticate(match.params.workspaceId || '0', newToken)
                wsClient.subscribeToWorkspace(match.params.workspaceId || '0')
            }

            if (timeout) {
                clearTimeout(timeout)
            }

            if (newState === 'close') {
                timeout = setTimeout(() => {
                    setWebsocketClosed(true)
                }, websocketTimeoutForBanner)
            } else {
                setWebsocketClosed(false)
            }
        }

        wsClient.addOnChange(incrementalUpdate)
        wsClient.addOnReconnect(() => dispatch(loadAction(match.params.boardId)))
        wsClient.addOnStateChange(updateWebsocketState)
        return () => {
            if (timeout) {
                clearTimeout(timeout)
            }
            wsClient.unsubscribeToWorkspace(match.params.workspaceId || '0')
            wsClient.removeOnChange(incrementalUpdate)
            wsClient.removeOnReconnect(() => dispatch(loadAction(match.params.boardId)))
            wsClient.removeOnStateChange(updateWebsocketState)
        }
    }, [match.params.workspaceId, props.readonly])

    useHotkeys('ctrl+z,cmd+z', () => {
        Utils.log('Undo')
        if (mutator.canUndo) {
            const description = mutator.undoDescription
            mutator.undo().then(() => {
                if (description) {
                    sendFlashMessage({content: `Undo ${description}`, severity: 'low'})
                } else {
                    sendFlashMessage({content: 'Undo', severity: 'low'})
                }
            })
        } else {
            sendFlashMessage({content: 'Nothing to Undo', severity: 'low'})
        }
    })

    useHotkeys('shift+ctrl+z,shift+cmd+z', () => {
        Utils.log('Redo')
        if (mutator.canRedo) {
            const description = mutator.redoDescription
            mutator.redo().then(() => {
                if (description) {
                    sendFlashMessage({content: `Redo ${description}`, severity: 'low'})
                } else {
                    sendFlashMessage({content: 'Redu', severity: 'low'})
                }
            })
        } else {
            sendFlashMessage({content: 'Nothing to Redo', severity: 'low'})
        }
    })

    return (
        <div className='BoardPage'>
            {websocketClosed &&
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
                </div>}
            <Workspace readonly={props.readonly || false}/>
        </div>
    )
}

export default BoardPage
