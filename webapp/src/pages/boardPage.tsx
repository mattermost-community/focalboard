// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useEffect, useState} from 'react'
import {batch} from 'react-redux'
import {FormattedMessage, useIntl} from 'react-intl'
import {generatePath, Redirect, useHistory, useRouteMatch, useLocation} from 'react-router-dom'
import {useHotkeys} from 'react-hotkeys-hook'

import {first} from 'lodash'

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
import {boardDataLoad, initialLoad, initialReadOnlyLoad, loadBoardData} from '../store/initialLoad'
import {useAppSelector, useAppDispatch} from '../store/hooks'
import {UserSettings} from '../userSettings'

import IconButton from '../widgets/buttons/iconButton'
import CloseIcon from '../widgets/icons/close'

import TelemetryClient, {TelemetryActions, TelemetryCategory} from '../telemetry/telemetryClient'
import {getSidebarCategories} from '../store/sidebar'
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
    const match = useRouteMatch<{boardId: string, viewId: string, cardId?: string, teamId?: string}>()
    const [websocketClosed, setWebsocketClosed] = useState(false)
    const queryString = new URLSearchParams(useLocation().search)
    const [mobileWarningClosed, setMobileWarningClosed] = useState(UserSettings.mobileWarningClosed)
    let teamId = match.params.teamId || UserSettings.lastTeamId || '0'

    // if we're in a legacy route and not showing a shared board,
    // redirect to the new URL schema equivalent
    if (Utils.isFocalboardLegacy() && !props.readonly) {
        window.location.href = window.location.href.replace('/plugins/focalboard', '/boards')
    }

    const categories = useAppSelector(getSidebarCategories)

    // TODO: Make this less brittle. This only works because this is the root render function
    useEffect(() => {
        teamId = match.params.teamId || teamId
        UserSettings.lastTeamId = teamId
        octoClient.teamId = teamId
    }, [match.params.teamId])

    console.log('########################################')
    console.log(teamId)
    console.log(board)
    console.log(boardViews)
    console.log('########################################')

    useEffect(() => {
        if (!match.params.boardId) {
            return
        }

        // set the active board if we're able to pick one
        dispatch(setCurrentBoard(match.params.boardId))

        // and fetch its data
        dispatch(loadBoardData(match.params.boardId))

        // and set it as most recently viewed board
        UserSettings.setLastBoardID(teamId, match.params.boardId)
    }, [match.params.boardId])

    useEffect(() => {
        if (!match.params.viewId) {
            return
        }

        dispatch(setCurrentView(match.params.viewId))
        UserSettings.setLastViewId(match.params.boardId, match.params.viewId)
    }, [match.params.viewId])

    useEffect(() => {
        console.log(`Board exists: ${Boolean(board)}`)

        let boardID = match.params.boardId
        if (!match.params.boardId) {
            // first preference is for last visited board
            boardID = UserSettings.lastBoardId[teamId]

            // if last visited board is unavailable, use the first board in categories list
            if (!boardID && categories.length > 0) {
                // a category may exist without any boards.
                // find the first category with a board and pick it's first board
                const categoryWithBoards = categories.find((category) => category.blockIDs.length > 0)

                // there may even be no boards at all
                if (categoryWithBoards) {
                    boardID = categoryWithBoards.blockIDs[0]
                }
            }

            if (boardID) {
                const newPath = generatePath(match.path, {...match.params, boardId: boardID, viewID: undefined})
                console.log(`newPath AAA: ${newPath}`)
                history.replace(newPath)

                // return from here because the loadBoardData() call
                // will fetch the data to be used below. We'll
                // use it in the next render cycle.
                return
            }
        }

        let viewID = match.params.viewId

        console.log('!!!!!!!!')
        console.log(board)
        console.log('!!!!!!!!')

        // when a view isn't open,
        // but the data is available, try opening a view
        if (!match.params.viewId && board && boardViews && boardViews.length > 0) {
            // most recent view gets the first preference
            viewID = UserSettings.lastViewId[boardID]
            if (viewID) {
                UserSettings.setLastViewId(boardID, viewID)
                dispatch(setCurrentView(viewID))
                return
            }

            // if most recent view is unavailable, pick the first view
            if (boardViews.length > 0) {
                viewID = boardViews[0].id
                UserSettings.setLastViewId(boardID, viewID)
                dispatch(setCurrentView(viewID))
            }

            if (viewID) {
                const newPath = generatePath(match.path, {...match.params, viewId: viewID})
                console.log(`newPath BBB: ${newPath}`)
                history.replace(newPath)
            }
        }
    }, [match.params.boardId, match.params.viewId, categories.length, boardViews.length, board])

    // useEffect(() => {
    //     // Backward compatibility: This can be removed in the future, this is for
    //     // transform the old query params into routes
    //     const queryBoardId = queryString.get('id')
    //     const params = {...match.params}
    //     let needsRedirect = false
    //     if (queryBoardId) {
    //         params.boardId = queryBoardId
    //         needsRedirect = true
    //     }
    //     const queryViewId = queryString.get('v')
    //     if (queryViewId) {
    //         params.viewId = queryViewId
    //         needsRedirect = true
    //     }
    //     const queryCardId = queryString.get('c')
    //     if (queryCardId) {
    //         params.cardId = queryCardId
    //         needsRedirect = true
    //     }
    //     if (needsRedirect) {
    //         const newPath = generatePath(match.path, params)
    //         history.replace(newPath)
    //         return
    //     }
    //
    //     // Backward compatibility end
    //     const boardId = match.params.boardId
    //     const viewId = match.params.viewId === '0' ? '' : match.params.viewId
    //
    //     // TODO use actual team ID here
    //     const teamID = 'atjjg8ofqb8kjnwy15yhezdgoh'
    //
    //     if (!boardId) {
    //         // Load last viewed boardView
    //         const lastBoardId = UserSettings.lastBoardId[teamID] || undefined
    //         const lastViewId = lastBoardId ? UserSettings.lastViewId[lastBoardId] : undefined
    //         if (lastBoardId) {
    //             let newPath = generatePath(match.path, {...match.params, boardId: lastBoardId})
    //             if (lastViewId) {
    //                 newPath = generatePath(match.path, {...match.params, boardId: lastBoardId, viewId: lastViewId})
    //             }
    //             history.replace(newPath)
    //             return
    //         }
    //         return
    //     }
    //
    //     Utils.log(`attachToBoard: ${boardId}`)
    //
    //     // Ensure boardViews is for our boardId before redirecting
    //     const isCorrectBoardView = boardViews.length > 0 && boardViews[0].parentId === boardId
    //     if (!viewId && isCorrectBoardView) {
    //         const newPath = generatePath(match.path, {...match.params, boardId, viewId: boardViews[0].id})
    //         history.replace(newPath)
    //         return
    //     }
    //
    //     UserSettings.setLastBoardID(teamId, boardId || '')
    //     if (boardId !== '') {
    //         UserSettings.setLastViewId(boardId, viewId)
    //     }
    //
    //     dispatch(setCurrentBoard(boardId || ''))
    //     dispatch(setCurrentView(viewId || ''))
    // }, [match.params.boardId, match.params.viewId, boardViews])

    useEffect(() => {
        Utils.setFavicon(board?.icon)
    }, [board?.icon])

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

        let subscribedToTeam = false
        if (wsClient.state === 'open') {
            wsClient.authenticate(match.params.teamId || '0', token)
            wsClient.subscribeToTeam(match.params.teamId || '0')
            subscribedToTeam = true
        }

        const incrementalUpdate = (_: WSClient, boards: Board[], blocks: Block[]) => {
            // only takes into account the entities that belong to the team or the user boards
            const teamBoards = boards.filter((b: Board) => b.teamId === '0' || b.teamId === teamId)

            // ToDo: update this
            // - create a selector to get user boards
            // - replace the teamId check of blocks by a "is in my boards" check
            /* const teamBlocks = blocks.filter((b: Block) => b.teamId === '0' || b.boardId in userBoardIds) */
            const teamBlocks = blocks

            batch(() => {
                dispatch(updateBoards(teamBoards.filter((b: Board) => b.deleteAt !== 0)))
                dispatch(updateViews(teamBlocks.filter((b: Block) => b.type === 'view' || b.deleteAt !== 0) as BoardView[]))
                dispatch(updateCards(teamBlocks.filter((b: Block) => b.type === 'card' || b.deleteAt !== 0) as Card[]))
                dispatch(updateComments(teamBlocks.filter((b: Block) => b.type === 'comment' || b.deleteAt !== 0) as CommentBlock[]))
                dispatch(updateContents(teamBlocks.filter((b: Block) => b.type !== 'card' && b.type !== 'view' && b.type !== 'board' && b.type !== 'comment') as ContentBlock[]))
            })
        }

        let timeout: ReturnType<typeof setTimeout>
        const updateWebsocketState = (_: WSClient, newState: 'init'|'open'|'close'): void => {
            if (newState === 'open') {
                const newToken = localStorage.getItem('focalboardSessionId') || ''
                wsClient.authenticate(match.params.teamId || '0', newToken)
                wsClient.subscribeToTeam(match.params.teamId || '0')
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

        wsClient.addOnChange(incrementalUpdate, 'block')
        wsClient.addOnReconnect(() => dispatch(loadAction(match.params.boardId)))
        wsClient.addOnStateChange(updateWebsocketState)
        return () => {
            if (timeout) {
                clearTimeout(timeout)
            }
            if (subscribedToTeam) {
                wsClient.unsubscribeToTeam(match.params.teamId || '0')
            }
            wsClient.removeOnChange(incrementalUpdate, 'block')
            wsClient.removeOnReconnect(() => dispatch(loadAction(match.params.boardId)))
            wsClient.removeOnStateChange(updateWebsocketState)
        }
    }, [match.params.teamId, props.readonly, match.params.boardId])

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
    const shouldGoToDashboard = Utils.isFocalboardPlugin() && teamId === '0' && !match.params.boardId && !match.params.viewId
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
