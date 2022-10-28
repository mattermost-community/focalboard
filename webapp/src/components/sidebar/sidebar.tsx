// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useCallback, useEffect, useState} from 'react'
import {FormattedMessage} from 'react-intl'
import {BeforeCapture, DragDropContext, Droppable, DropResult} from 'react-beautiful-dnd'

import {getActiveThemeName, loadTheme} from '../../theme'
import IconButton from '../../widgets/buttons/iconButton'
import HamburgerIcon from '../../widgets/icons/hamburger'
import HideSidebarIcon from '../../widgets/icons/hideSidebar'
import ShowSidebarIcon from '../../widgets/icons/showSidebar'
import {getMySortedBoards} from '../../store/boards'
import {useAppDispatch, useAppSelector} from '../../store/hooks'
import {Utils} from '../../utils'
import {IUser} from '../../user'

import './sidebar.scss'

import {
    BoardCategoryWebsocketData,
    Category,
    CategoryBoards,
    fetchSidebarCategories,
    getSidebarCategories, updateBoardCategories,
    updateCategories, updateCategoryBoardsOrder, updateCategoryOrder,
} from '../../store/sidebar'

import BoardsSwitcher from '../boardsSwitcher/boardsSwitcher'

import wsClient, {WSClient} from '../../wsclient'

import {getCurrentTeam, getCurrentTeamId} from '../../store/teams'

import {Constants} from '../../constants'

import {getMe} from '../../store/users'
import {getCurrentViewId} from '../../store/views'

import octoClient from '../../octoClient'

import {useWebsockets} from '../../hooks/websockets'

import mutator from '../../mutator'

import {Board} from '../../blocks/board'

import SidebarCategory from './sidebarCategory'
import SidebarSettingsMenu from './sidebarSettingsMenu'
import SidebarUserMenu from './sidebarUserMenu'

type Props = {
    activeBoardId?: string
    onBoardTemplateSelectorOpen: () => void
    onBoardTemplateSelectorClose?: () => void
}

function getWindowDimensions() {
    const {innerWidth: width, innerHeight: height} = window
    return {
        width,
        height,
    }
}

const Sidebar = (props: Props) => {
    const [isHidden, setHidden] = useState(false)
    const [userHidden, setUserHidden] = useState(false)
    const [windowDimensions, setWindowDimensions] = useState(getWindowDimensions())
    const boards = useAppSelector(getMySortedBoards)
    const dispatch = useAppDispatch()
    const sidebarCategories = useAppSelector<CategoryBoards[]>(getSidebarCategories)
    const me = useAppSelector<IUser|null>(getMe)
    const activeViewID = useAppSelector(getCurrentViewId)

    useEffect(() => {
        wsClient.addOnChange((_: WSClient, categories: Category[]) => {
            dispatch(updateCategories(categories))
        }, 'category')

        wsClient.addOnChange((_: WSClient, blockCategories: BoardCategoryWebsocketData[]) => {
            dispatch(updateBoardCategories(blockCategories))
        }, 'blockCategories')
    }, [])

    const teamId = useAppSelector(getCurrentTeamId)
    const team = useAppSelector(getCurrentTeam)

    useEffect(() => {
        if (team) {
            dispatch(fetchSidebarCategories(team!.id))
        }
    }, [team?.id])

    useEffect(() => {
        loadTheme()
    }, [])

    useEffect(() => {
        function handleResize() {
            setWindowDimensions(getWindowDimensions())
        }

        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    useEffect(() => {
        hideSidebar()
    }, [windowDimensions])

    useWebsockets(teamId, (websocketClient: WSClient) => {
        const onCategoryReorderHandler = (_: WSClient, newCategoryOrder: string[]): void => {
            dispatch(updateCategoryOrder(newCategoryOrder))
        }

        websocketClient.addOnChange(onCategoryReorderHandler, 'categoryOrder')
        return () => {
            websocketClient.removeOnChange(onCategoryReorderHandler, 'categoryOrder')
        }
    }, [teamId])

    if (!boards) {
        return <div/>
    }

    const hideSidebar = () => {
        if (!userHidden) {
            if (windowDimensions.width < 768) {
                setHidden(true)
            } else {
                setHidden(false)
            }
        }
    }

    const handleCategoryDND = useCallback(async (result: DropResult) => {
        const {destination, source} = result
        if (!team || !destination) {
            return
        }

        console.log(`Moving from index: ${source.index} to index: ${destination.index}`)

        const categories = sidebarCategories

        // creating a mutable copy
        const newCategories = Array.from(categories)

        // remove category from old index
        newCategories.splice(source.index, 1)

        // add it to new index
        newCategories.splice(destination.index, 0, categories[source.index])

        const newCategoryOrder = newCategories.map((category) => category.id)

        // optimistically updating the store to produce a lag-free UI
        await dispatch(updateCategoryOrder(newCategoryOrder))
        await octoClient.reorderSidebarCategories(team.id, newCategoryOrder)
    }, [team, sidebarCategories])

    const handleCategoryBoardDND = useCallback(async (result: DropResult) => {
        const {source, destination, draggableId} = result

        if (!team || !destination) {
            return
        }

        const fromCategoryID = source.droppableId
        const toCategoryID = destination.droppableId
        const boardID = draggableId

        console.log(`Source droppable ID: ${source.droppableId}`)
        console.log(`Destination droppable ID: ${destination.droppableId}`)
        console.log(source.droppableId === destination.droppableId ? 'SAME CATEGORY' : 'DIFFERENT CATEGORIES')

        if (fromCategoryID === toCategoryID) {
            // board re-arranged withing the same category
            console.log(`Moving from index: ${source.index} to index: ${destination.index}`)
            const toSidebarCategory = sidebarCategories.find((category) => category.id === toCategoryID)
            if (!toSidebarCategory) {
                Utils.logError(`toCategoryID not found in list of sidebar categories. toCategoryID: ${toCategoryID}`)
                return
            }

            const boardIDs = [...toSidebarCategory.boardIDs]
            boardIDs.splice(source.index, 1)
            boardIDs.splice(destination.index, 0, toSidebarCategory.boardIDs[source.index])

            dispatch(updateCategoryBoardsOrder({categoryID: toCategoryID, boardIDs}))
            await octoClient.reorderSidebarCategoryBoards(team.id, toCategoryID, boardIDs)
        } else {
            // board moved to a different category
            const toSidebarCategory = sidebarCategories.find((category) => category.id === toCategoryID)
            if (!toSidebarCategory) {
                Utils.logError(`toCategoryID not found in list of sidebar categories. toCategoryID: ${toCategoryID}`)
                return
            }

            const boardIDs = [...toSidebarCategory.boardIDs]
            boardIDs.splice(destination.index, 0, boardID)

            // optimistically updating the store to create a lag-free UI.
            await dispatch(updateCategoryBoardsOrder({categoryID: toCategoryID, boardIDs}))
            dispatch(updateBoardCategories([{boardID, categoryID: toCategoryID}]))

            await mutator.moveBoardToCategory(team.id, boardID, toCategoryID, fromCategoryID)
            await octoClient.reorderSidebarCategoryBoards(team.id, toCategoryID, boardIDs)
        }
    }, [team, sidebarCategories])

    const onDragEnd = useCallback(async (result: DropResult) => {
        const {destination, source, type} = result

        if (!team || !destination) {
            setDraggedItemID('')
            setIsCategoryBeingDragged(false)
            return
        }

        if (destination.droppableId === source.droppableId && destination.index === source.index) {
            setDraggedItemID('')
            setIsCategoryBeingDragged(false)
            return
        }

        if (type === 'category') {
            handleCategoryDND(result)
        } else if (type === 'board') {
            handleCategoryBoardDND(result)
        } else {
            Utils.logWarn(`unknown drag type encountered, type: ${type}`)
        }

        setDraggedItemID('')
        setIsCategoryBeingDragged(false)
    }, [team, sidebarCategories])

    const [draggedItemID, setDraggedItemID] = useState<string>('')
    const [isCategoryBeingDragged, setIsCategoryBeingDragged] = useState<boolean>(false)

    const onBeforeCapture = useCallback((before: BeforeCapture) => {
        console.log(`before.draggableId: ${before.draggableId}`)
        setDraggedItemID(before.draggableId)
        const draggedCategoryIndex = sidebarCategories.findIndex((category) => category.id === before.draggableId)
        if (draggedCategoryIndex > -1) {
            console.log('DELETCTED DNDING A CATEGORY')
        }
        setIsCategoryBeingDragged(draggedCategoryIndex > -1)
    }, [sidebarCategories])

    if (!boards) {
        return <div/>
    }

    if (!me) {
        return <div/>
    }

    if (isHidden) {
        return (
            <div className='Sidebar octo-sidebar hidden'>
                <div className='octo-sidebar-header show-button'>
                    <div className='hamburger-icon'>
                        <IconButton
                            icon={<HamburgerIcon/>}
                            onClick={() => {
                                setUserHidden(false)
                                setHidden(false)
                            }}
                        />
                    </div>
                    <div className='show-icon'>
                        <IconButton
                            icon={<ShowSidebarIcon/>}
                            onClick={() => {
                                setUserHidden(false)
                                setHidden(false)
                            }}
                        />
                    </div>
                </div>
            </div>
        )
    }

    const getSortedCategoryBoards = (category: CategoryBoards): Board[] => {
        const categoryBoardsByID = new Map<string, Board>()
        boards.forEach((board) => {
            if (!category.boardIDs.includes(board.id)) {
                return
            }

            categoryBoardsByID.set(board.id, board)
        })

        const sortedBoards: Board[] = []
        category.boardIDs.forEach((boardID) => {
            const b = categoryBoardsByID.get(boardID)
            if (b) {
                sortedBoards.push(b)
            }
        })
        return sortedBoards
    }

    return (
        <div className='Sidebar octo-sidebar'>
            {!Utils.isFocalboardPlugin() &&
                <div className='octo-sidebar-header'>
                    <div className='heading'>
                        <SidebarUserMenu/>
                    </div>

                    <div className='octo-spacer'/>
                    <div className='sidebarSwitcher'>
                        <IconButton
                            onClick={() => {
                                setUserHidden(true)
                                setHidden(true)
                            }}
                            icon={<HideSidebarIcon/>}
                        />
                    </div>
                </div>}

            {team && team.id !== Constants.globalTeamId &&
                <div className='WorkspaceTitle'>
                    {Utils.isFocalboardPlugin() &&
                    <>
                        <div className='octo-spacer'/>
                        <div className='sidebarSwitcher'>
                            <IconButton
                                onClick={() => {
                                    setUserHidden(true)
                                    setHidden(true)
                                }}
                                icon={<HideSidebarIcon/>}
                            />
                        </div>
                    </>
                    }
                </div>
            }

            <BoardsSwitcher
                onBoardTemplateSelectorOpen={props.onBoardTemplateSelectorOpen}
                userIsGuest={me?.is_guest}
            />

            <DragDropContext
                onDragEnd={onDragEnd}
                // onBeforeCapture={onBeforeCapture}
            >
                <Droppable
                    droppableId='lhs-categories'
                    type='category'
                >
                    {(provided) => (
                        <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className='octo-sidebar-list'
                        >
                            {
                                sidebarCategories.map((category, index) => (
                                    <SidebarCategory
                                        hideSidebar={hideSidebar}
                                        key={category.id}
                                        activeBoardID={props.activeBoardId}
                                        activeViewID={activeViewID}
                                        categoryBoards={category}
                                        boards={getSortedCategoryBoards(category)}
                                        allCategories={sidebarCategories}
                                        index={index}
                                        onBoardTemplateSelectorClose={props.onBoardTemplateSelectorClose}
                                        draggedItemID={draggedItemID}
                                        forceCollapse={isCategoryBeingDragged}
                                    />
                                ))
                            }
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>

            <div className='octo-spacer'/>

            {
                (!Utils.isFocalboardPlugin()) &&
                <div
                    className='add-board'
                    onClick={props.onBoardTemplateSelectorOpen}
                >
                    <FormattedMessage
                        id='Sidebar.add-board'
                        defaultMessage='+ Add board'
                    />
                </div>
            }

            {!Utils.isFocalboardPlugin() &&
                <SidebarSettingsMenu activeTheme={getActiveThemeName()}/>}
        </div>
    )
}

export default React.memo(Sidebar)
