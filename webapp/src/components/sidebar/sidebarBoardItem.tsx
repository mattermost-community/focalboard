// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useCallback, useState} from 'react'
import {useIntl} from 'react-intl'
import {useHistory, useRouteMatch} from "react-router-dom"

import {Board} from '../../blocks/board'
import {BoardView, IViewType} from '../../blocks/boardView'
import mutator from '../../mutator'
import IconButton from '../../widgets/buttons/iconButton'
import DeleteIcon from '../../widgets/icons/delete'
import OptionsIcon from '../../widgets/icons/options'
import Menu from '../../widgets/menu'
import MenuWrapper from '../../widgets/menuWrapper'
import BoardPermissionGate from '../permissions/boardPermissionGate'

import './sidebarBoardItem.scss'
import {CategoryBoards} from '../../store/sidebar'
import CreateNewFolder from '../../widgets/icons/newFolder'
import {useAppSelector} from '../../store/hooks'
import {getCurrentBoardViews, getCurrentViewId} from '../../store/views'
import Folder from '../../widgets/icons/folder'
import Check from '../../widgets/icons/checkIcon'
import BoardIcon from '../../widgets/icons/board'
import TableIcon from '../../widgets/icons/table'
import GalleryIcon from '../../widgets/icons/gallery'
import CalendarIcon from '../../widgets/icons/calendar'

import {getCurrentTeam} from '../../store/teams'
import {Permission} from '../../constants'
import DuplicateIcon from "../../widgets/icons/duplicate"
import {Utils} from "../../utils"

import AddIcon from "../../widgets/icons/add"

const iconForViewType = (viewType: IViewType): JSX.Element => {
    switch (viewType) {
    case 'board': return <BoardIcon/>
    case 'table': return <TableIcon/>
    case 'gallery': return <GalleryIcon/>
    case 'calendar': return <CalendarIcon/>
    default: return <div/>
    }
}

type Props = {
    isActive: boolean
    categoryBoards: CategoryBoards
    board: Board
    allCategories: Array<CategoryBoards>
    onDeleteRequest: (board: Board) => void
    showBoard: (boardId: string) => void
    showView: (viewId: string, boardId: string) => void
}

const SidebarBoardItem = (props: Props) => {
    const intl = useIntl()

    const [boardsMenuOpen, setBoardsMenuOpen] = useState<{[key: string]: boolean}>({})

    const team = useAppSelector(getCurrentTeam)
    const boardViews = useAppSelector(getCurrentBoardViews)
    const currentViewId = useAppSelector(getCurrentViewId)
    const teamID = team?.id || ''

    const match = useRouteMatch<{boardId: string, viewId?: string, cardId?: string, teamId?: string}>()
    const history = useHistory()

    const generateMoveToCategoryOptions = (boardID: string) => {
        return props.allCategories.map((category) => (
            <Menu.Text
                key={category.id}
                id={category.id}
                name={category.name}
                icon={category.id === props.categoryBoards.id ? <Check/> : <Folder/>}
                onClick={async (toCategoryID) => {
                    const fromCategoryID = props.categoryBoards.id
                    if (fromCategoryID !== toCategoryID) {
                        await mutator.moveBoardToCategory(teamID, boardID, toCategoryID, fromCategoryID)
                    }
                }}
            />
        ))
    }

    const board = props.board

    const handleDuplicateBoard = useCallback(async(asTemplate: boolean) => {
        const blocksAndBoards = await mutator.duplicateBoard(
            board.id,
            undefined,
            asTemplate,
            undefined,
            () => {
                Utils.showBoard(board.id, match, history)
                return Promise.resolve()
            }
        )

        if (blocksAndBoards.boards.length === 0) {
            return
        }

        const boardId = blocksAndBoards.boards[0].id
        Utils.showBoard(boardId, match, history)

    }, [board.id])

    const title = board.title || intl.formatMessage({id: 'Sidebar.untitled-board', defaultMessage: '(Untitled Board)'})
    return (
        <>
            <div
                className={`SidebarBoardItem subitem ${props.isActive ? 'active' : ''}`}
                onClick={() => props.showBoard(board.id)}
            >
                <div className='octo-sidebar-icon'>
                    {board.icon}
                </div>
                <div
                    className='octo-sidebar-title'
                    title={title}
                >
                    {title}
                </div>
                <MenuWrapper
                    className={boardsMenuOpen[board.id] ? 'menuOpen' : 'x'}
                    stopPropagationOnToggle={true}
                    onToggle={(open) => {
                        setBoardsMenuOpen((menuState) => {
                            const newState = {...menuState}
                            newState[board.id] = open
                            return newState
                        })
                    }}
                >
                    <IconButton icon={<OptionsIcon/>}/>
                    <Menu
                        fixed={true}
                        position='left'
                    >
                        <BoardPermissionGate
                            boardId={board.id}
                            permissions={[Permission.DeleteBoard]}
                        >
                            <Menu.Text
                                key={`deleteBlock-${board.id}`}
                                id='deleteBlock'
                                name={intl.formatMessage({id: 'Sidebar.delete-board', defaultMessage: 'Delete Board'})}
                                icon={<DeleteIcon/>}
                                onClick={() => {
                                    props.onDeleteRequest(board)
                                }}
                            />
                        </BoardPermissionGate>
                        <Menu.SubMenu
                            key={`moveBlock-${board.id}`}
                            id='moveBlock'
                            name={intl.formatMessage({id: 'SidebarCategories.BlocksMenu.Move', defaultMessage: 'Move To...'})}
                            icon={<CreateNewFolder/>}
                            position='bottom'
                        >
                            {generateMoveToCategoryOptions(board.id)}
                        </Menu.SubMenu>
                        <Menu.Text
                            id='duplicateBoard'
                            name={intl.formatMessage({id: 'Sidebar.duplicate-board', defaultMessage: 'Duplicate board'})}
                            icon={<DuplicateIcon/>}
                            onClick={() => handleDuplicateBoard(board.isTemplate)}
                        />
                        <Menu.Text
                            id='templateFromBoard'
                            name={intl.formatMessage({id: 'Sidebar.template-from-board', defaultMessage: 'New template from board'})}
                            icon={<AddIcon/>}
                            onClick={() => handleDuplicateBoard(true)}
                        />
                    </Menu>
                </MenuWrapper>
            </div>
            {props.isActive && boardViews.map((view: BoardView) => (
                <div
                    key={view.id}
                    className={`SidebarBoardItem sidebar-view-item ${view.id === currentViewId ? 'active' : ''}`}
                    onClick={() => props.showView(view.id, board.id)}
                >
                    {iconForViewType(view.fields.viewType)}
                    <div
                        className='octo-sidebar-title'
                        title={view.title || intl.formatMessage({id: 'Sidebar.untitled-view', defaultMessage: '(Untitled View)'})}
                    >
                        {view.title || intl.formatMessage({id: 'Sidebar.untitled-view', defaultMessage: '(Untitled View)'})}
                    </div>
                </div>
            ))}
        </>
    )
}

export default React.memo(SidebarBoardItem)
