// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useCallback, useState} from 'react'
import {FormattedMessage, useIntl} from 'react-intl'
import {generatePath, useHistory, useRouteMatch} from 'react-router-dom'

import {Board} from '../../blocks/board'
import {BoardView, IViewType, sortBoardViewsAlphabetically} from '../../blocks/boardView'
import mutator from '../../mutator'
import TelemetryClient, {TelemetryActions, TelemetryCategory} from '../../telemetry/telemetryClient'
import IconButton from '../../widgets/buttons/iconButton'
import BoardIcon from '../../widgets/icons/board'
import CalendarIcon from '../../widgets/icons/calendar'
import DeleteIcon from '../../widgets/icons/delete'
import DisclosureTriangle from '../../widgets/icons/disclosureTriangle'
import DuplicateIcon from '../../widgets/icons/duplicate'
import GalleryIcon from '../../widgets/icons/gallery'
import OptionsIcon from '../../widgets/icons/options'
import TableIcon from '../../widgets/icons/table'
import Menu from '../../widgets/menu'
import MenuWrapper from '../../widgets/menuWrapper'

import DeleteBoardDialog from './deleteBoardDialog'

import './sidebarBoardItem.scss'

type Props = {
    views: BoardView[]
    board: Board
    activeBoardId?: string
    activeViewId?: string
    nextBoardId?: string
    hideSidebar: () => void
}

const SidebarBoardItem = React.memo((props: Props) => {
    const [collapsed, setCollapsed] = useState(false)
    const intl = useIntl()
    const history = useHistory()
    const [deleteBoardOpen, setDeleteBoardOpen] = useState(false)
    const match = useRouteMatch<{boardId: string, viewId?: string, cardId?: string, workspaceId?: string}>()

    const showBoard = useCallback((boardId) => {
        // if the same board, reuse the match params
        // otherwise remove viewId and cardId, results in first view being selected
        const params = {...match.params, boardId: boardId || ''}
        if (boardId !== match.params.boardId) {
            params.viewId = undefined
            params.cardId = undefined
        }
        const newPath = generatePath(match.path, params)
        history.push(newPath)
        props.hideSidebar()
    }, [match, history])

    const showView = useCallback((viewId, boardId) => {
        const newPath = generatePath(match.path, {...match.params, boardId: boardId || '', viewId: viewId || ''})
        history.push(newPath)
        props.hideSidebar()
    }, [match, history])

    const iconForViewType = (viewType: IViewType): JSX.Element => {
        switch (viewType) {
        case 'board': return <BoardIcon/>
        case 'table': return <TableIcon/>
        case 'gallery': return <GalleryIcon/>
        case 'calendar': return <CalendarIcon/>
        default: return <div/>
        }
    }

    const duplicateBoard = async (boardId: string) => {
        const oldBoardId = props.activeBoardId

        await mutator.duplicateBoard(
            boardId,
            intl.formatMessage({id: 'Mutator.duplicate-board', defaultMessage: 'duplicate board'}),
            false,
            async (newBoardId) => {
                showBoard(newBoardId)
            },
            async () => {
                if (oldBoardId) {
                    showBoard(oldBoardId)
                }
            },
        )
    }

    const addTemplateFromBoard = async (boardId: string) => {
        const oldBoardId = props.activeBoardId

        await mutator.duplicateBoard(
            boardId,
            intl.formatMessage({id: 'Mutator.new-template-from-board', defaultMessage: 'new template from board'}),
            true,
            async (newBoardId) => {
                TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.AddTemplateFromBoard, {board: newBoardId})
                showBoard(newBoardId)
            },
            async () => {
                if (oldBoardId) {
                    showBoard(oldBoardId)
                }
            },
        )
    }

    const {board, views} = props
    const displayTitle: string = board.title || intl.formatMessage({id: 'Sidebar.untitled-board', defaultMessage: '(Untitled Board)'})
    const boardViews = sortBoardViewsAlphabetically(views.filter((view) => view.parentId === board.id))

    return (
        <div className='SidebarBoardItem'>
            <div
                className={`octo-sidebar-item ' ${collapsed ? 'collapsed' : 'expanded'} ${board.id === props.activeBoardId ? 'active' : ''}`}
                onClick={() => showBoard(board.id)}
            >
                <IconButton
                    icon={<DisclosureTriangle/>}
                    onClick={() => setCollapsed(!collapsed)}
                />
                <div
                    className='octo-sidebar-title'
                    title={displayTitle}
                >
                    {board.fields.icon ? <div className='octo-icon'>{board.fields.icon}</div> : undefined}
                    <span className='octo-sidebar-name'>{displayTitle}</span>
                </div>
                <MenuWrapper stopPropagationOnToggle={true}>
                    <IconButton icon={<OptionsIcon/>}/>
                    <Menu position='left'>
                        <Menu.Text
                            id='deleteBoard'
                            name={intl.formatMessage({id: 'Sidebar.delete-board', defaultMessage: 'Delete board'})}
                            icon={<DeleteIcon/>}
                            onClick={() => {
                                setDeleteBoardOpen(true)
                            }}
                        />

                        <Menu.Text
                            id='duplicateBoard'
                            name={intl.formatMessage({id: 'Sidebar.duplicate-board', defaultMessage: 'Duplicate board'})}
                            icon={<DuplicateIcon/>}
                            onClick={() => {
                                TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.DuplicateBoard, {board: board.id})
                                duplicateBoard(board.id || '')
                            }}
                        />

                        <Menu.Text
                            id='templateFromBoard'
                            name={intl.formatMessage({id: 'Sidebar.template-from-board', defaultMessage: 'New template from board'})}
                            onClick={() => {
                                addTemplateFromBoard(board.id || '')
                            }}
                        />
                    </Menu>
                </MenuWrapper>
            </div>
            {!collapsed && boardViews.length === 0 &&
                <div className='octo-sidebar-item subitem no-views'>
                    <FormattedMessage
                        id='Sidebar.no-views-in-board'
                        defaultMessage='No pages inside'
                    />
                </div>}
            {!collapsed && boardViews.map((view) => (
                <div
                    key={view.id}
                    className={`octo-sidebar-item subitem ${view.id === props.activeViewId ? 'active' : ''}`}
                    onClick={() => showView(view.id, board.id)}
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

            {deleteBoardOpen &&
            <DeleteBoardDialog
                boardTitle={props.board.title}
                onClose={() => setDeleteBoardOpen(false)}
                onDelete={async () => {
                    TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.DeleteBoard, {board: board.id})
                    mutator.deleteBlock(
                        board,
                        intl.formatMessage({id: 'Sidebar.delete-board', defaultMessage: 'Delete board'}),
                        async () => {
                            if (props.nextBoardId) {
                                // This delay is needed because WSClient has a default 100 ms notification delay before updates
                                setTimeout(() => {
                                    showBoard(props.nextBoardId)
                                }, 120)
                            }
                        },
                        async () => {
                            showBoard(board.id)
                        },
                    )
                }}
            />}
        </div>
    )
})

export default SidebarBoardItem
