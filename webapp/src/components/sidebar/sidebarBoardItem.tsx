// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useCallback, useState} from 'react'
import {FormattedMessage, useIntl} from 'react-intl'
import {generatePath, useHistory, useRouteMatch} from 'react-router-dom'

import {Board} from '../../blocks/board'
import {BoardView, IViewType} from '../../blocks/boardView'
import mutator from '../../mutator'
import TelemetryClient, {TelemetryActions, TelemetryCategory} from '../../telemetry/telemetryClient'
import IconButton from '../../widgets/buttons/iconButton'
import BoardIcon from '../../widgets/icons/board'
import CalendarIcon from '../../widgets/icons/calendar'
import DeleteIcon from '../../widgets/icons/delete'
import DuplicateIcon from '../../widgets/icons/duplicate'
import GalleryIcon from '../../widgets/icons/gallery'
import OptionsIcon from '../../widgets/icons/options'
import TableIcon from '../../widgets/icons/table'
import Menu from '../../widgets/menu'
import MenuWrapper from '../../widgets/menuWrapper'

import DeleteBoardDialog from './deleteBoardDialog'

import './sidebarBoardItem.scss'
import {Category, CategoryBlocks} from '../../store/sidebar'
import ChevronDown from '../../widgets/icons/chevronDown'
import ChevronRight from '../../widgets/icons/chevronRight'
import CreateNewFolder from '../../widgets/icons/newFolder'
import CreateCategory from '../createCategory/createCategory'
import {useAppSelector} from '../../store/hooks'
import {IUser} from '../../user'
import {getMe} from '../../store/users'
import {Utils} from '../../utils'
import Update from '../../widgets/icons/update'
import Folder from '../../widgets/icons/folder'
import CheckIcon from '../../widgets/icons/check'

type Props = {
    activeCategoryId?: string
    activeViewId?: string
    nextBoardId?: string
    hideSidebar: () => void
    categoryBlocks: CategoryBlocks
    boards: Board[]
    allCategories: Array<CategoryBlocks>
}

const SidebarBoardItem = React.memo((props: Props) => {
    const [collapsed, setCollapsed] = useState(false)
    const intl = useIntl()
    const history = useHistory()
    const [deleteBoardOpen, setDeleteBoardOpen] = useState(false)
    const match = useRouteMatch<{boardId: string, viewId?: string, cardId?: string, workspaceId?: string}>()
    const [showCreateCategoryModal, setShowCreateCategoryModal] = useState(false)
    const [showUpdateCategoryModal, setShowUpdateCategoryModal] = useState(false)
    const me = useAppSelector<IUser|null>(getMe)

    // TODO un-hardcode this teamID
    const teamID = 'atjjg8ofqb8kjnwy15yhezdgoh'

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

    const blocks = props.categoryBlocks.blockIDs || []

    const handleCreateNewCategory = () => {
        setShowCreateCategoryModal(true)
    }

    const handleDeleteCategory = async () => {
        await mutator.deleteCategory(teamID, props.categoryBlocks.id)
    }

    const handleUpdateCategory = async () => {
        setShowUpdateCategoryModal(true)
    }

    const generateMoveToCategoryOptions = (blockID: string) => {
        return props.allCategories.map((category) => (
            <Menu.Text
                key={category.id}
                id={category.id}
                name={category.name}
                icon={category.id === props.categoryBlocks.id ? <CheckIcon/> : <Folder/>}
                onClick={async (toCategoryID) => {
                    const fromCategoryID = props.categoryBlocks.id
                    await mutator.moveBlockToCategory(teamID, blockID, toCategoryID, fromCategoryID)
                }}
            />
        ))
    }

    return (
        <div className='SidebarBoardItem'>
            <div
                className={`octo-sidebar-item category ' ${collapsed ? 'collapsed' : 'expanded'} ${props.categoryBlocks.id === props.activeCategoryId ? 'active' : ''}`}

                // onClick={() => showBoard(board.id)}
            >
                <IconButton
                    icon={collapsed ? <ChevronRight/> : <ChevronDown/>}
                    onClick={() => setCollapsed(!collapsed)}
                />
                <div
                    className='octo-sidebar-title category-title'
                    title={props.categoryBlocks.name}
                >
                    {props.categoryBlocks.name}
                </div>
                <MenuWrapper stopPropagationOnToggle={true}>
                    <IconButton icon={<OptionsIcon/>}/>
                    <Menu position='left'>
                        <Menu.Text
                            id='createNewCategory'
                            name={intl.formatMessage({id: 'SidebarCategories.CategoryMenu.CreateNew', defaultMessage: 'Create New Category'})}
                            icon={<CreateNewFolder/>}
                            onClick={handleCreateNewCategory}
                        />
                        {
                            props.categoryBlocks.id !== '' &&
                            <React.Fragment>
                                <Menu.Text
                                    id='deleteCategory'
                                    name={intl.formatMessage({id: 'SidebarCategories.CategoryMenu.Delete', defaultMessage: 'Delete Category'})}
                                    icon={<DeleteIcon/>}
                                    onClick={handleDeleteCategory}
                                />
                                <Menu.Text
                                    id='updateCategory'
                                    name={intl.formatMessage({id: 'SidebarCategories.CategoryMenu.Update', defaultMessage: 'SidebarCategories.CategoryMenu.Update'})}
                                    icon={<Update/>}
                                    onClick={handleUpdateCategory}
                                />
                            </React.Fragment>
                        }
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
            {!collapsed && blocks.map((blockID) => {
                // console.log('AAAA ' + props.boards.length)
                // console.log(props.boards)
                const thisBoard = props.boards.find((b) => b.id === blockID)
                return (
                    <div
                        key={blockID}
                        className={`octo-sidebar-item subitem ${blockID === props.activeViewId ? 'active' : ''}`}
                        onClick={() => showBoard(blockID)}
                    >
                        <div className='octo-sidebar-icon'>
                            {thisBoard?.fields.icon}
                        </div>
                        <div
                            className='octo-sidebar-title'
                            title={thisBoard?.title || intl.formatMessage({id: 'Sidebar.untitled-boardAA', defaultMessage: '(asdasdsaUntitled Board)'})}
                        >
                            {thisBoard?.title || intl.formatMessage({id: 'Sidebar.untitled-boardAA', defaultMessage: blockID})}
                        </div>
                        <MenuWrapper stopPropagationOnToggle={true}>
                            <IconButton icon={<OptionsIcon/>}/>
                            <Menu position='left'>
                                <Menu.SubMenu
                                    id='moveBlock'
                                    name={intl.formatMessage({id: 'SidebarCategories.BlocksMenu.Move', defaultMessage: 'Move To...'})}
                                    icon={<CreateNewFolder/>}
                                    position='bottom'
                                >
                                    {generateMoveToCategoryOptions(blockID)}
                                </Menu.SubMenu>
                            </Menu>
                        </MenuWrapper>
                    </div>
                )
            })}

            {
                showCreateCategoryModal && (
                    <CreateCategory
                        onClose={() => setShowCreateCategoryModal(false)}
                        onCreate={async (name) => {
                            if (!me) {
                                Utils.logError('me not initialized')
                                return
                            }

                            const category: Category = {
                                name,
                                userID: me.id,
                                teamID,
                            } as Category

                            await mutator.createCategory(category)
                            setShowCreateCategoryModal(false)
                        }}
                    />
                )
            }

            {
                showUpdateCategoryModal && (
                    <CreateCategory
                        initialValue={props.categoryBlocks.name}
                        onClose={() => setShowUpdateCategoryModal(false)}
                        onCreate={async (name) => {
                            if (!me) {
                                Utils.logError('me not initialized')
                                return
                            }

                            const category: Category = {
                                name,
                                id: props.categoryBlocks.id,
                                userID: me.id,
                                teamID,
                            } as Category

                            await mutator.updateCategory(category)
                            setShowUpdateCategoryModal(false)
                        }}
                    />
                )
            }

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
