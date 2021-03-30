// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useState} from 'react'
import {FormattedMessage, injectIntl, IntlShape} from 'react-intl'

import {Board} from '../../blocks/board'
import {BoardView, IViewType} from '../../blocks/boardView'
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
    showBoard: (id?: string) => void
    showView: (id: string, boardId?: string) => void
    activeBoardId?: string
    intl: IntlShape
    nextBoardId?: string
}

const SidebarBoardItem = React.memo((props: Props) => {
    const [collapsed, setCollapsed] = useState(false)

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
            props.intl.formatMessage({id: 'Mutator.duplicate-board', defaultMessage: 'duplicate board'}),
            false,
            async (newBoardId) => {
                props.showBoard(newBoardId)
            },
            async () => {
                if (oldBoardId) {
                    props.showBoard(oldBoardId)
                }
            },
        )
    }

    const addTemplateFromBoard = async (boardId: string) => {
        const oldBoardId = props.activeBoardId

        await mutator.duplicateBoard(
            boardId,
            props.intl.formatMessage({id: 'Mutator.new-template-from-board', defaultMessage: 'new template from board'}),
            true,
            async (newBoardId) => {
                props.showBoard(newBoardId)
            },
            async () => {
                if (oldBoardId) {
                    props.showBoard(oldBoardId)
                }
            },
        )
    }

    const {board, intl, views} = props
    const displayTitle: string = board.title || intl.formatMessage({id: 'Sidebar.untitled-board', defaultMessage: '(Untitled Board)'})
    const boardViews = views.filter((view) => view.parentId === board.id)

    return (
        <div className='SidebarBoardItem'>
            <div className={'octo-sidebar-item ' + (collapsed ? 'collapsed' : 'expanded')}>
                <IconButton
                    icon={<DisclosureTriangle/>}
                    onClick={() => setCollapsed(!collapsed)}
                />
                <div
                    className='octo-sidebar-title'
                    onClick={() => {
                        props.showBoard(board.id)
                    }}
                    title={displayTitle}
                >
                    {board.icon ? `${board.icon} ${displayTitle}` : displayTitle}
                </div>
                <MenuWrapper>
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
                                        // This delay is needed because OctoListener has a default 100 ms notification delay before updates
                                        setTimeout(() => {
                                            props.showBoard(props.nextBoardId)
                                        }, 120)
                                    },
                                    async () => {
                                        props.showBoard(board.id)
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
                    className='octo-sidebar-item subitem'
                >
                    {iconForViewType(view.viewType)}
                    <div
                        className='octo-sidebar-title'
                        onClick={() => {
                            props.showView(view.id, board.id)
                        }}
                        title={view.title || intl.formatMessage({id: 'Sidebar.untitled-view', defaultMessage: '(Untitled View)'})}
                    >
                        {view.title || intl.formatMessage({id: 'Sidebar.untitled-view', defaultMessage: '(Untitled View)'})}
                    </div>
                </div>
            ))}
        </div>
    )
})

export default injectIntl(SidebarBoardItem)
