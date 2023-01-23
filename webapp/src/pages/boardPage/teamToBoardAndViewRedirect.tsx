// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {useEffect, useContext} from 'react'
import {generatePath, useHistory, useRouteMatch} from 'react-router-dom'

import isPagesContext from '../../isPages'
import {getBoards, getCurrentBoardId} from '../../store/boards'
import {setCurrent as setCurrentView, getCurrentBoardViews} from '../../store/views'
import {setCurrent as setCurrentPage, getCurrentBoardPages} from '../../store/pages'
import {useAppSelector, useAppDispatch} from '../../store/hooks'
import {UserSettings} from '../../userSettings'
import {Utils} from '../../utils'
import {getSidebarCategories} from '../../store/sidebar'
import {Constants} from '../../constants'

const TeamToBoardAndViewRedirect = (): null => {
    const boardId = useAppSelector(getCurrentBoardId)
    const boardViews = useAppSelector(getCurrentBoardViews)
    const boardPages = useAppSelector(getCurrentBoardPages)
    const isPages = useContext(isPagesContext)
    const dispatch = useAppDispatch()
    const history = useHistory()
    const match = useRouteMatch<{boardId: string, viewId: string, cardId?: string, teamId?: string}>()
    const categories = useAppSelector(getSidebarCategories)
    const boards = useAppSelector(getBoards)
    const teamId = match.params.teamId || UserSettings.lastTeamId || Constants.globalTeamId

    useEffect(() => {
        let boardID = match.params.boardId
        if (!match.params.boardId) {
            // first preference is for last visited board
            if (isPages) {
                boardID = UserSettings.lastFolderId[teamId]
            } else {
                boardID = UserSettings.lastBoardId[teamId]
            }

            // if last visited board is unavailable, use the first board in categories list
            if (!boardID && categories.length > 0) {
                let goToBoardID: string | null = null

                for (const category of categories) {
                    for (const categoryBoardID of category.boardIDs) {
                        if (boards[categoryBoardID]) {
                            if (isPages && boards[categoryBoardID].isPagesFolder === true) {
                                // pick the first category board that exists
                                goToBoardID = categoryBoardID
                                break
                            } else if (!isPages && boards[categoryBoardID].isPagesFolder !== true) {
                                goToBoardID = categoryBoardID
                                break
                            }
                        }
                    }
                }

                // there may even be no boards at all
                if (goToBoardID) {
                    boardID = goToBoardID
                }
            }

            if (boardID) {
                const newPath = generatePath(Utils.getBoardPagePath(match.path), {...match.params, boardId: boardID, viewID: undefined})
                history.replace(newPath)

                // return from here because the loadBoardData() call
                // will fetch the data to be used below. We'll
                // use it in the next render cycle.
                return
            }
        }

        let viewID = match.params.viewId

        if (!isPages) {
            // when a view isn't open,
            // but the data is available, try opening a view
            if ((!viewID || viewID === '0') && boardId && boardId === match.params.boardId && ((boardPages && boardPages.length > 0) || (boardViews && boardViews.length > 0))) {
                // most recent view gets the first preference
                viewID = UserSettings.lastViewId[boardID]
                if (viewID) {
                    UserSettings.setLastViewId(boardID, viewID)
                    dispatch(setCurrentView(viewID))
                } else if (boardViews.length > 0) {
                    // if most recent view is unavailable, pick the first view
                    viewID = boardViews[0].id
                    UserSettings.setLastViewId(boardID, viewID)
                    dispatch(setCurrentView(viewID))
                    dispatch(setCurrentPage(''))
                } else if (boardPages.length > 0) {
                    // if most recent page is unavailable, pick the first page
                    viewID = boardPages[0].id
                    UserSettings.setLastPageId(boardID, viewID)
                    dispatch(setCurrentView(''))
                    dispatch(setCurrentPage(viewID))
                }
                if (viewID) {
                    const newPath = generatePath(Utils.getBoardPagePath(match.path), {...match.params, viewId: viewID})
                    history.replace(newPath)
                }
            }
        }
    }, [teamId, match.params.boardId, match.params.viewId, categories.length, boardViews.length, boardId, boardPages.length, isPages])

    return null
}

export default TeamToBoardAndViewRedirect
