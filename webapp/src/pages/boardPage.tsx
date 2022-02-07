// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useEffect, useState} from 'react'
import {batch} from 'react-redux'
import {FormattedMessage, useIntl} from 'react-intl'
import {generatePath, Redirect, useHistory, useRouteMatch, useLocation} from 'react-router-dom'
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
import wsClient, {Subscription, WSClient} from '../wsclient'
import './boardPage.scss'
import {updateBoards, getCurrentBoard, setCurrent as setCurrentBoard} from '../store/boards'
import {updateViews, getCurrentView, setCurrent as setCurrentView, getCurrentBoardViews} from '../store/views'
import {updateCards} from '../store/cards'
import {updateContents} from '../store/contents'
import {updateComments} from '../store/comments'
import {initialLoad, initialReadOnlyLoad} from '../store/initialLoad'
import {useAppSelector, useAppDispatch} from '../store/hooks'
import {UserSettings} from '../userSettings'

import IconButton from '../widgets/buttons/iconButton'
import CloseIcon from '../widgets/icons/close'

import TelemetryClient, {TelemetryActions, TelemetryCategory} from '../telemetry/telemetryClient'
import {fetchUserBlockSubscriptions, followBlock, getMe, unfollowBlock} from '../store/users'
import {IUser} from '../user'
type Props = {
    readonly?: boolean
}

const websocketTimeoutForBanner = 5000

const BoardPage = (props: Props): JSX.Element => {
    const intl = useIntl()
    const board = useAppSelector(getCurrentBoard)
    const activeView = useAppSelector(getCurrentView)
    const boardViews = useAppSelector(getCurrentBoardViews)
    const dispatch = useAppDispatch()

    const history = useHistory()
    const match = useRouteMatch<{boardId: string, viewId: string, cardId?: string, workspaceId?: string}>()
    const [websocketClosed, setWebsocketClosed] = useState(false)
    const queryString = new URLSearchParams(useLocation().search)
    const [mobileWarningClosed, setMobileWarningClosed] = useState(UserSettings.mobileWarningClosed)
    const me = useAppSelector<IUser|null>(getMe)

    let workspaceId = match.params.workspaceId || UserSettings.lastWorkspaceId || '0'

    // if we're in a legacy route and not showing a shared board,
    // redirect to the new URL schema equivalent
    if (Utils.isFocalboardLegacy() && !props.readonly) {
        window.location.href = window.location.href.replace('/plugins/focalboard', '/boards')
    }

    // TODO: Make this less brittle. This only works because this is the root render function
    useEffect(() => {
        workspaceId = match.params.workspaceId || workspaceId
        UserSettings.lastWorkspaceId = workspaceId
        octoClient.workspaceId = workspaceId
    }, [match.params.workspaceId])

    // Load user's block subscriptions when workspace changes
    // block subscriptions are relevant only in plugin mode.
    if (Utils.isFocalboardPlugin()) {
        useEffect(() => {
            if (!me) {
                return
            }

            dispatch(fetchUserBlockSubscriptions(me!.id))
        }, [match.params.workspaceId])
    }

    // Backward compatibility: This can be removed in the future, this is for
    // transform the old query params into routes
    useEffect(() => {
    }, [])

    useEffect(() => {
        // don't do anything if-
        // 1. the URL already has a workspace ID, or
        // 2. the workspace ID is unavailable.
        // This also ensures once the workspace id is
        // set in the URL, we don't update the history anymore.
        if (props.readonly || match.params.workspaceId || !workspaceId || workspaceId === '0') {
            return
        }

        // we can pick workspace ID from board if it's not available anywhere,
        const workspaceIDToUse = Utils.isFocalboardPlugin() ? workspaceId || board.workspaceId : '0'

        const newPath = Utils.buildOriginalPath(workspaceIDToUse, match.params.boardId, match.params.viewId, match.params.cardId)
        history.replace(`/workspace/${newPath}`)
    }, [workspaceId, match.params.boardId, match.params.viewId, match.params.cardId])

    useEffect(() => {
        // Backward compatibility: This can be removed in the future, this is for
        // transform the old query params into routes
        const queryBoardId = queryString.get('id')
        const params = {...match.params}
        let needsRedirect = false
        if (queryBoardId) {
            params.boardId = queryBoardId
            needsRedirect = true
        }
        const queryViewId = queryString.get('v')
        if (queryViewId) {
            params.viewId = queryViewId
            needsRedirect = true
        }
        const queryCardId = queryString.get('c')
        if (queryCardId) {
            params.cardId = queryCardId
            needsRedirect = true
        }
        if (needsRedirect) {
            const newPath = generatePath(match.path, params)
            history.replace(newPath)
            return
        }

        // Backward compatibility end
        const boardId = match.params.boardId
        const viewId = match.params.viewId === '0' ? '' : match.params.viewId

        if (!boardId) {
            // Load last viewed boardView
            const lastBoardId = UserSettings.lastBoardId || undefined
            const lastViewId = UserSettings.lastViewId || undefined
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

        // Ensure boardViews is for our boardId before redirecting
        const isCorrectBoardView = boardViews.length > 0 && boardViews[0].parentId === boardId
        if (!viewId && isCorrectBoardView) {
            const newPath = generatePath(match.path, {...match.params, boardId, viewId: boardViews[0].id})
            history.replace(newPath)
            return
        }

        UserSettings.lastBoardId = boardId || ''
        UserSettings.lastViewId = viewId || ''
        UserSettings.lastWorkspaceId = workspaceId

        dispatch(setCurrentBoard(boardId || ''))
        dispatch(setCurrentView(viewId || ''))
    }, [match.params.boardId, match.params.viewId, boardViews])

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
        } else if (Utils.isFocalboardPlugin()) {
            document.title = 'Boards - Mattermost'
        } else {
            document.title = 'Focalboard'
        }
    }, [board?.title, activeView?.title])

    if (props.readonly) {
        useEffect(() => {
            if (board?.id && activeView?.id) {
                TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.ViewSharedBoard, {board: board?.id, view: activeView?.id})
            }
        }, [board?.id, activeView?.id])
    }

    useEffect(() => {
        let loadAction: any = initialLoad /* eslint-disable-line @typescript-eslint/no-explicit-any */
        let token = localStorage.getItem('focalboardSessionId') || ''
        if (props.readonly) {
            loadAction = initialReadOnlyLoad
            token = token || queryString.get('r') || ''
        }

        dispatch(loadAction(match.params.boardId))

        let subscribedToWorkspace = false
        if (wsClient.state === 'open') {
            wsClient.authenticate(match.params.workspaceId || '0', token)
            wsClient.subscribeToWorkspace(match.params.workspaceId || '0')
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
                wsClient.authenticate(match.params.workspaceId || '0', newToken)
                wsClient.subscribeToWorkspace(match.params.workspaceId || '0')
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
        wsClient.addOnReconnect(() => dispatch(loadAction(match.params.boardId)))
        wsClient.addOnStateChange(updateWebsocketState)
        wsClient.setOnFollowBlock((_: WSClient, subscription: Subscription): void => {
            if (subscription.subscriberId === me?.id && subscription.workspaceId === match.params.workspaceId) {
                dispatch(followBlock(subscription))
            }
        })
        wsClient.setOnUnfollowBlock((_: WSClient, subscription: Subscription): void => {
            if (subscription.subscriberId === me?.id && subscription.workspaceId === match.params.workspaceId) {
                dispatch(unfollowBlock(subscription))
            }
        })
        return () => {
            if (timeout) {
                clearTimeout(timeout)
            }
            if (subscribedToWorkspace) {
                wsClient.unsubscribeToWorkspace(match.params.workspaceId || '0')
            }
            wsClient.removeOnChange(incrementalUpdate)
            wsClient.removeOnReconnect(() => dispatch(loadAction(match.params.boardId)))
            wsClient.removeOnStateChange(updateWebsocketState)
        }
    }, [match.params.workspaceId, props.readonly, match.params.boardId])

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

    // this is needed to redirect to dashboard
    // when opening Focalboard for the first time
    const shouldGoToDashboard = Utils.isFocalboardPlugin() && workspaceId === '0' && !match.params.boardId && !match.params.viewId
    if (shouldGoToDashboard) {
        return (<Redirect to={'/dashboard'}/>)
    }

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

            {!mobileWarningClosed &&
                <div className='mobileWarning'>
                    <div>
                        <FormattedMessage
                            id='Error.mobileweb'
                            defaultMessage='Mobile web support is currently in early beta. Not all functionality may be present.'
                        />
                    </div>
                    <IconButton
                        onClick={() => {
                            UserSettings.mobileWarningClosed = true
                            setMobileWarningClosed(true)
                        }}
                        icon={<CloseIcon/>}
                        title='Close'
                        className='margin-right'
                    />
                </div>}

            {props.readonly && board === undefined &&
                <div className='error'>
                    {intl.formatMessage({id: 'BoardPage.syncFailed', defaultMessage: 'Board may be deleted or access revoked.'})}
                </div>}
            <Workspace
                readonly={props.readonly || false}
            />
        </div>
    )
}

export default BoardPage
