// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useCallback, useState} from 'react'
import {FormattedMessage, useIntl} from 'react-intl'
import {generatePath, useHistory, useRouteMatch} from 'react-router-dom'

import {Board} from '../../blocks/board'
import mutator from '../../mutator'
import IconButton from '../../widgets/buttons/iconButton'
import DeleteIcon from '../../widgets/icons/delete'
import OptionsIcon from '../../widgets/icons/options'
import Menu from '../../widgets/menu'
import MenuWrapper from '../../widgets/menuWrapper'

import './sidebarCategory.scss'
import {Category, CategoryBoards} from '../../store/sidebar'
import ChevronDown from '../../widgets/icons/chevronDown'
import ChevronRight from '../../widgets/icons/chevronRight'
import CreateNewFolder from '../../widgets/icons/newFolder'
import CreateCategory from '../createCategory/createCategory'
import {useAppSelector} from '../../store/hooks'
import {IUser} from '../../user'
import {getMe} from '../../store/users'
import {Utils} from '../../utils'
import Update from '../../widgets/icons/update'

import telemetryClient, {TelemetryActions, TelemetryCategory} from '../../telemetry/telemetryClient'

import {getCurrentTeam} from '../../store/teams'

import ConfirmationDialogBox, {ConfirmationDialogBoxProps} from '../confirmationDialogBox'

import DeleteBoardDialog from './deleteBoardDialog'
import SidebarBoardItem from './sidebarBoardItem'

type Props = {
    activeCategoryId?: string
    activeBoardID?: string
    hideSidebar: () => void
    categoryBoards: CategoryBoards
    boards: Board[]
    allCategories: Array<CategoryBoards>
}

const SidebarCategory = (props: Props) => {
    const [collapsed, setCollapsed] = useState(false)
    const intl = useIntl()
    const history = useHistory()

    const [deleteBoard, setDeleteBoard] = useState<Board|null>()
    const [showDeleteCategoryDialog, setShowDeleteCategoryDialog] = useState<boolean>(false)
    const [categoryMenuOpen, setCategoryMenuOpen] = useState<boolean>(false)

    const match = useRouteMatch<{boardId: string, viewId?: string, cardId?: string, teamId?: string}>()
    const [showCreateCategoryModal, setShowCreateCategoryModal] = useState(false)
    const [showUpdateCategoryModal, setShowUpdateCategoryModal] = useState(false)
    const me = useAppSelector<IUser|null>(getMe)

    const team = useAppSelector(getCurrentTeam)
    const teamID = team?.id || ''

    const showBoard = useCallback((boardId) => {
        Utils.showBoard(boardId, match, history)
        props.hideSidebar()
    }, [match, history])

    const showView = useCallback((viewId, boardId) => {
        // if the same board, reuse the match params
        // otherwise remove viewId and cardId, results in first view being selected
        const params = {...match.params, boardId: boardId || '', viewId: viewId || ''}
        if (boardId !== match.params.boardId && viewId !== match.params.viewId) {
            params.cardId = undefined
        }
        const newPath = generatePath(match.path, params)
        history.push(newPath)
        props.hideSidebar()
    }, [match, history])

    const blocks = props.categoryBoards.boardIDs || []

    const handleCreateNewCategory = () => {
        setShowCreateCategoryModal(true)
    }

    const handleDeleteCategory = async () => {
        await mutator.deleteCategory(teamID, props.categoryBoards.id)
    }

    const handleUpdateCategory = async () => {
        setShowUpdateCategoryModal(true)
    }

    const deleteCategoryProps: ConfirmationDialogBoxProps = {
        heading: intl.formatMessage({
            id: 'SidebarCategories.CategoryMenu.DeleteModal.Title',
            defaultMessage: 'Delete this category?',
        }),
        subText: intl.formatMessage(
            {
                id: 'SidebarCategories.CategoryMenu.DeleteModal.Body',
                defaultMessage: 'Boards in <b>{categoryName}</b> will move back to the Boards categories. You\'re not removed from any boards.',
            },
            {
                categoryName: props.categoryBoards.name,
                b: (...chunks) => <b>{chunks}</b>,
            },
        ),
        onConfirm: () => handleDeleteCategory(),
        onClose: () => setShowDeleteCategoryDialog(false),
    }

    const onDeleteBoard = useCallback(async () => {
        if (!deleteBoard) {
            return
        }
        telemetryClient.trackEvent(TelemetryCategory, TelemetryActions.DeleteBoard, {board: deleteBoard.id})
        mutator.deleteBoard(
            deleteBoard,
            intl.formatMessage({id: 'Sidebar.delete-board', defaultMessage: 'Delete board'}),
            async () => {
                let nextBoardId: number | undefined
                if (props.boards.length > 1) {
                    const deleteBoardIndex = props.boards.findIndex((board) => board.id === deleteBoard.id)
                    nextBoardId = deleteBoardIndex + 1 === props.boards.length ? deleteBoardIndex - 1 : deleteBoardIndex + 1
                }

                if (nextBoardId) {
                // This delay is needed because WSClient has a default 100 ms notification delay before updates
                    setTimeout(() => {
                        showBoard(props.boards[nextBoardId as number].id)
                    }, 120)
                }
            },
            async () => {
                showBoard(deleteBoard.id)
            },
        )
    }, [showBoard, deleteBoard, props.boards])

    return (
        <div className='SidebarCategory'>
            <div
                className={`octo-sidebar-item category ' ${collapsed ? 'collapsed' : 'expanded'} ${props.categoryBoards.id === props.activeCategoryId ? 'active' : ''}`}
            >
                <IconButton
                    icon={collapsed ? <ChevronRight/> : <ChevronDown/>}
                    onClick={() => setCollapsed(!collapsed)}
                />
                <div
                    className='octo-sidebar-title category-title'
                    title={props.categoryBoards.name}
                >
                    {props.categoryBoards.name}
                </div>
                <MenuWrapper
                    className={categoryMenuOpen ? 'menuOpen' : ''}
                    stopPropagationOnToggle={true}
                    onToggle={(open) => setCategoryMenuOpen(open)}
                >
                    <IconButton icon={<OptionsIcon/>}/>
                    <Menu position='left'>
                        <Menu.Text
                            id='createNewCategory'
                            name={intl.formatMessage({id: 'SidebarCategories.CategoryMenu.CreateNew', defaultMessage: 'Create New Category'})}
                            icon={<CreateNewFolder/>}
                            onClick={handleCreateNewCategory}
                        />
                        {
                            props.categoryBoards.id !== '' &&
                            <React.Fragment>
                                <Menu.Text
                                    id='deleteCategory'
                                    className='text-danger'
                                    name={intl.formatMessage({id: 'SidebarCategories.CategoryMenu.Delete', defaultMessage: 'Delete Category'})}
                                    icon={<DeleteIcon/>}
                                    onClick={() => setShowDeleteCategoryDialog(true)}
                                />
                                <Menu.Text
                                    id='updateCategory'
                                    name={intl.formatMessage({id: 'SidebarCategories.CategoryMenu.Update', defaultMessage: 'Rename Category'})}
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
                        id='Sidebar.no-boards-in-category'
                        defaultMessage='No boards inside'
                    />
                </div>}
            {!collapsed && props.boards.map((board: Board) => {
                if (!blocks.includes(board.id)) {
                    return null
                }
                return (
                    <SidebarBoardItem
                        key={board.id}
                        board={board}
                        categoryBoards={props.categoryBoards}
                        allCategories={props.allCategories}
                        isActive={board.id === props.activeBoardID}
                        showBoard={showBoard}
                        showView={showView}
                        onDeleteRequest={setDeleteBoard}
                    />
                )
            })}

            {
                showCreateCategoryModal && (
                    <CreateCategory
                        onClose={() => setShowCreateCategoryModal(false)}
                        title={(
                            <FormattedMessage
                                id='SidebarCategories.CategoryMenu.CreateNew'
                                defaultMessage='Create New Category'
                            />
                        )}
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
                        initialValue={props.categoryBoards.name}
                        title={(
                            <FormattedMessage
                                id='SidebarCategories.CategoryMenu.Update'
                                defaultMessage='Rename Category'
                            />
                        )}
                        onClose={() => setShowUpdateCategoryModal(false)}
                        onCreate={async (name) => {
                            if (!me) {
                                Utils.logError('me not initialized')
                                return
                            }

                            const category: Category = {
                                name,
                                id: props.categoryBoards.id,
                                userID: me.id,
                                teamID,
                            } as Category

                            await mutator.updateCategory(category)
                            setShowUpdateCategoryModal(false)
                        }}
                    />
                )
            }

            { deleteBoard &&
                <DeleteBoardDialog
                    boardTitle={deleteBoard.title}
                    onClose={() => setDeleteBoard(null)}
                    onDelete={onDeleteBoard}
                />
            }

            {
                showDeleteCategoryDialog && <ConfirmationDialogBox dialogBox={deleteCategoryProps}/>
            }
        </div>
    )
}

export default React.memo(SidebarCategory)
