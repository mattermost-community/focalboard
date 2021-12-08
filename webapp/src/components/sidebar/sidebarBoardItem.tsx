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
import {CategoryBlocks} from '../../store/sidebar'

type Props = {
    activeCategoryId?: string
    activeViewId?: string
    nextBoardId?: string
    hideSidebar: () => void
    categoryBlocks: CategoryBlocks
    boards: Board[]
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
        // const oldBoardId = props.activeBoardId
        const oldBoardId = ''

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
        // const oldBoardId = props.activeBoardId
        const oldBoardId = ''

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

    const blocks = props.categoryBlocks.blockAttributes

    return (
        <div className='SidebarBoardItem'>
            <div
                className={`octo-sidebar-item ' ${collapsed ? 'collapsed' : 'expanded'} ${props.categoryBlocks.id === props.activeCategoryId ? 'active' : ''}`}

                // onClick={() => showBoard(board.id)}
            >
                <IconButton
                    icon={<DisclosureTriangle/>}
                    onClick={() => setCollapsed(!collapsed)}
                />
                <div
                    className='octo-sidebar-title'
                    title={props.categoryBlocks.name}
                >
                    {props.categoryBlocks.name}
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
                                TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.DuplicateBoard, {board: props.categoryBlocks.id})
                                duplicateBoard(props.categoryBlocks.id || '')
                            }}
                        />

                        <Menu.Text
                            id='templateFromBoard'
                            name={intl.formatMessage({id: 'Sidebar.template-from-board', defaultMessage: 'New template from board'})}
                            onClick={() => {
                                addTemplateFromBoard(props.categoryBlocks.id || '')
                            }}
                        />
                    </Menu>
                </MenuWrapper>
            </div>
            {!collapsed && blocks.length === 0 &&
                <div className='octo-sidebar-item subitem no-views'>
                    <FormattedMessage
                        id='Sidebar.no-views-in-board'
                        defaultMessage='No pages inside'
                    />
                </div>}
            {!collapsed && blocks.map((block) => {
                console.log('AAAA ' + props.boards.length)
                console.log(props.boards)
                const thisBoard = props.boards.find((b) => b.id === block.blockID)
                return (
                    <div
                        key={block.blockID}
                        className={`octo-sidebar-item subitem ${block.blockID === props.activeViewId ? 'active' : ''}`}
                        onClick={() => showBoard(block.blockID)}
                    >
                        {thisBoard?.fields.icon}
                        <div
                            className='octo-sidebar-title'
                            title={thisBoard?.title || intl.formatMessage({id: 'Sidebar.untitled-boardAA', defaultMessage: '(asdasdsaUntitled Board)'})}
                        >
                            {thisBoard?.title || intl.formatMessage({id: 'Sidebar.untitled-boardAA', defaultMessage: block.blockID})}
                        </div>
                    </div>
                )
            })}

            {/*{deleteBoardOpen &&*/}
            {/*<DeleteBoardDialog*/}
            {/*    boardTitle={props.board.title}*/}
            {/*    onClose={() => setDeleteBoardOpen(false)}*/}
            {/*    onDelete={async () => {*/}
            {/*        TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.DeleteBoard, {board: board.id})*/}
            {/*        mutator.deleteBlock(*/}
            {/*            board,*/}
            {/*            intl.formatMessage({id: 'Sidebar.delete-board', defaultMessage: 'Delete board'}),*/}
            {/*            async () => {*/}
            {/*                if (props.nextBoardId) {*/}
            {/*                    // This delay is needed because WSClient has a default 100 ms notification delay before updates*/}
            {/*                    setTimeout(() => {*/}
            {/*                        showBoard(props.nextBoardId)*/}
            {/*                    }, 120)*/}
            {/*                }*/}
            {/*            },*/}
            {/*            async () => {*/}
            {/*                showBoard(board.id)*/}
            {/*            },*/}
            {/*        )*/}
            {/*    }}*/}
            {/*/>}*/}
        </div>
    )
})

export default SidebarBoardItem
