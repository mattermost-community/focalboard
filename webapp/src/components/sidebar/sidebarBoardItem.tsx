// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useState, useCallback} from 'react'
import {FormattedMessage, useIntl} from 'react-intl'
import {generatePath, useHistory, useRouteMatch} from 'react-router-dom'

import {Board} from '../../blocks/board'
import {BoardView, IViewType, sortBoardViewsAlphabetically} from '../../blocks/boardView'
import mutator from '../../mutator'
import IconButton from '../../widgets/buttons/iconButton'
import BoardIcon from '../../widgets/icons/board'
import DeleteIcon from '../../widgets/icons/delete'
import DisclosureTriangle from '../../widgets/icons/disclosureTriangle'
import DuplicateIcon from '../../widgets/icons/duplicate'
import OptionsIcon from '../../widgets/icons/options'
import TableIcon from '../../widgets/icons/table'
import GalleryIcon from '../../widgets/icons/gallery'
import Menu from '../../widgets/menu'
import MenuWrapper from '../../widgets/menuWrapper'

import './sidebarBoardItem.scss'

type Props = {
    views: readonly BoardView[]
    board: Board
    activeBoardId?: string
    activeViewId?: string
    nextBoardId?: string
}

const SidebarBoardItem = React.memo((props: Props) => {
    const [collapsed, setCollapsed] = useState(false)
    const intl = useIntl()
    const history = useHistory()
    const match = useRouteMatch()

    const showBoard = useCallback((boardId) => {
        const newPath = generatePath(match.path, {...match.params, boardId: boardId || ''})
        history.push(newPath)
    }, [match, history])

    const showView = useCallback((viewId, boardId) => {
        const newPath = generatePath(match.path, {...match.params, boardId: boardId || '', viewId: viewId || ''})
        history.push(newPath)
    }, [match, history])

    const iconForViewType = (viewType: IViewType): JSX.Element => {
        switch (viewType) {
        case 'board': return <BoardIcon/>
        case 'table': return <TableIcon/>
        case 'gallery': return <GalleryIcon/>
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
                    {board.icon ? `${board.icon} ${displayTitle}` : displayTitle}
                </div>
                <MenuWrapper stopPropagationOnToggle={true}>
                    <IconButton icon={<OptionsIcon/>}/>
                    <Menu position='left'>
                        <Menu.Text
                            id='deleteBoard'
                            name={intl.formatMessage({id: 'Sidebar.delete-board', defaultMessage: 'Delete board'})}
                            icon={<DeleteIcon/>}
                            onClick={async () => {
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
                        />

                        <Menu.Text
                            id='duplicateBoard'
                            name={intl.formatMessage({id: 'Sidebar.duplicate-board', defaultMessage: 'Duplicate board'})}
                            icon={<DuplicateIcon/>}
                            onClick={() => {
                                duplicateBoard(board.id)
                            }}
                        />

                        <Menu.Text
                            id='templateFromBoard'
                            name={intl.formatMessage({id: 'Sidebar.template-from-board', defaultMessage: 'New template from board'})}
                            onClick={() => {
                                addTemplateFromBoard(board.id)
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
                    {iconForViewType(view.viewType)}
                    <div
                        className='octo-sidebar-title'
                        title={view.title || intl.formatMessage({id: 'Sidebar.untitled-view', defaultMessage: '(Untitled View)'})}
                    >
                        {view.title || intl.formatMessage({id: 'Sidebar.untitled-view', defaultMessage: '(Untitled View)'})}
                    </div>
                </div>
            ))}
        </div>
    )
})

export default SidebarBoardItem
