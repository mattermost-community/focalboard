// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useCallback, useRef, useState, useContext} from 'react'
import {useIntl} from 'react-intl'
import {generatePath, useHistory, useRouteMatch} from 'react-router-dom'

import {Board} from '../../blocks/board'
import {Page, createPage} from '../../blocks/page'
import {Block} from '../../blocks/block'
import {BoardView, IViewType} from '../../blocks/boardView'
import mutator from '../../mutator'
import Menu from '../../widgets/menu'
import MenuWrapper from '../../widgets/menuWrapper'
import BoardPermissionGate from '../permissions/boardPermissionGate'
import TelemetryClient, {TelemetryCategory, TelemetryActions} from '../../telemetry/telemetryClient'

import './sidebarBoardItem.scss'
import {CategoryBoards, updateBoardCategories} from '../../store/sidebar'
import CreateNewFolder from '../../widgets/icons/newFolder'
import isPagesContext from '../../isPages'
import {useAppDispatch, useAppSelector} from '../../store/hooks'
import {getCurrentBoardViews, getCurrentViewId} from '../../store/views'
import {getCurrentBoardPages, getCurrentPageId} from '../../store/pages'
import Folder from '../../widgets/icons/folder'
import Check from '../../widgets/icons/checkIcon'
import CompassIcon from '../../widgets/icons/compassIcon'
import BoardIcon from '../../widgets/icons/board'
import TableIcon from '../../widgets/icons/table'
import GalleryIcon from '../../widgets/icons/gallery'
import CalendarIcon from '../../widgets/icons/calendar'
import DuplicateIcon from '../../widgets/icons/duplicate'
import IconButton from '../../widgets/buttons/iconButton'
import DeleteIcon from '../../widgets/icons/delete'
import OptionsIcon from '../../widgets/icons/options'
import PageMenu from '../pageMenu'

import {getCurrentTeam} from '../../store/teams'
import {Permission} from '../../constants'
import {Utils} from '../../utils'

import AddIcon from '../../widgets/icons/add'
import CloseIcon from '../../widgets/icons/close'
import {UserConfigPatch} from '../../user'
import {getMe, getMyConfig, patchProps} from '../../store/users'
import octoClient from '../../octoClient'
import {getCurrentBoardId, getMySortedBoards} from '../../store/boards'
import {UserSettings} from '../../userSettings'
import {Archiver} from '../../archiver'

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
    allCategories: CategoryBoards[]
    onDeleteRequest: (board: Board) => void
    showBoard: (boardId: string) => void
    showView: (viewId: string, boardId: string) => void
    showPage: (pageId: string, boardId: string) => void
}

type PageSidebarItemProps = {
    page: Page
    pages: Page[]
    board: Board
    currentPageId: string
    showPage: (pageId: string, boardId: string) => void
    showBoard: (boardId: string) => void
    parentId: string
    depth: number
}

const PageSidebarItem = (props: PageSidebarItemProps) => {
    const intl = useIntl()
    const {page, pages, board, currentPageId, parentId, depth} = props
    const subpages = pages.filter((p) => p.parentId == page.id)

    return (
        <>
            <div
                key={page.id}
                className={`SidebarBoardItem sidebar-page-item ${page.id === currentPageId ? 'active' : ''} depth-${depth}`}
                onClick={() => props.showPage(page.id, board.id)}
            >
                {page.fields.icon || <CompassIcon icon='file-text-outline'/>}
                <div
                    className='octo-sidebar-title'
                    title={page.title || intl.formatMessage({id: 'Sidebar.untitled-page', defaultMessage: '(Untitled Page)'})}
                >
                    {page.title || intl.formatMessage({id: 'Sidebar.untitled-page', defaultMessage: '(Untitled Page)'})}
                </div>
                <PageMenu
                    pageId={page.id}
                    onClickDelete={async () => {
                        if (!page) {
                            Utils.assertFailure()
                            return
                        }
                        TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.DeletePage, {board: props.board.id, page: page.id})
                        await mutator.deleteBlock(page, 'delete page')
                        props.showBoard(page.boardId)
                    }}
                    onClickDuplicate={async () => {
                        if (!page) {
                            Utils.assertFailure()
                            return
                        }
                        TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.DuplicatePage, {board: props.board.id, page: page.id})
                        await mutator.duplicatePage(
                            page.id,
                            props.board.id,
                            'duplicate page',
                            async (newPageId: string) => {
                                props.showPage(newPageId, page.boardId)
                            },
                            async () => {
                                props.showPage(page.id, page.boardId)
                            },
                        )
                    }}
                    onClickAddSubpage={async () => {
                        if (!page) {
                            Utils.assertFailure()
                            return
                        }
                        TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.CreateSubpage, {board: props.board.id, page: page.id})
                        const subpage = createPage()
                        subpage.parentId = page.id
                        subpage.boardId = board.id
                        await mutator.insertBlock(
                            board.id,
                            subpage,
                            intl.formatMessage({id: 'Mutator.new-subpage', defaultMessage: 'new subpage'}),
                            async (newBlock: Block) => {
                                props.showPage(newBlock.id, board.id)
                            },
                            async () => {
                                props.showPage(currentPageId, board.id)
                            },
                        )
                    }}
                />
            </div>
            {subpages.map((page: Page) => (
                <PageSidebarItem
                    depth={props.depth+1}
                    page={page}
                    pages={pages}
                    board={board}
                    currentPageId={currentPageId}
                    showPage={props.showPage}
                    showBoard={props.showBoard}
                    parentId={page.id}
                />
            ))}
        </>
    )
}

const SidebarBoardItem = (props: Props) => {
    const intl = useIntl()

    const [boardsMenuOpen, setBoardsMenuOpen] = useState<{[key: string]: boolean}>({})

    const isPages = useContext(isPagesContext)
    const team = useAppSelector(getCurrentTeam)
    const boardViews = useAppSelector(getCurrentBoardViews)
    const pages = useAppSelector(getCurrentBoardPages)
    const currentViewId = useAppSelector(getCurrentViewId)
    const currentPageId = useAppSelector(getCurrentPageId)
    const teamID = team?.id || ''
    const me = useAppSelector(getMe)
    const myConfig = useAppSelector(getMyConfig)

    const match = useRouteMatch<{boardId: string, viewId?: string, cardId?: string, teamId?: string}>()
    const history = useHistory()
    const dispatch = useAppDispatch()
    const myAllBoards = useAppSelector(getMySortedBoards)
    const currentBoardID = useAppSelector(getCurrentBoardId)

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

    const handleDuplicateBoard = useCallback(async (asTemplate: boolean) => {
        const blocksAndBoards = await mutator.duplicateBoard(
            board.id,
            undefined,
            asTemplate,
            undefined,
            () => {
                Utils.showBoard(board.id, match, history)
                return Promise.resolve()
            },
        )

        if (blocksAndBoards.boards.length === 0) {
            return
        }

        const boardId = blocksAndBoards.boards[0].id

        // If the source board is in a custom category, set the new board in
        // the same category. Even though the server does this as well on its side,
        // we need to do this to avoid the duplicated board showing up in default "Boards" category first
        // then jumping to the custom category.
        // The jump would happen because when server clones a board from a custom category,
        // two WS events are sent - first to indicate the new board belongs to the specific category,
        // second, to indicate the new board is created. Depending on the order of execution of the two
        // WS event handlers, if the handler for second events executes first, it will show the new board
        // in default category in LHS, then when the handler for first events gets executed, it moves the board
        // to the correct category.
        // By not waiting for the board-category WS event and setting the right category for the board,
        // we avoid the jumping behavior.
        if (props.categoryBoards.id !== '') {
            dispatch(updateBoardCategories([{
                boardID: boardId,
                categoryID: props.categoryBoards.id,
            }]))
        }

        Utils.showBoard(boardId, match, history)
    }, [board.id])

    const addPage = useCallback(async () => {
        const page = createPage()
        page.parentId = board.id
        page.boardId = board.id
        await mutator.insertBlock(
            board.id,
            page,
            intl.formatMessage({id: 'Mutator.new-page', defaultMessage: 'new page'}),
            async (newBlock: Block) => {
                props.showPage(newBlock.id, board.id)
            },
            async () => {
                props.showPage(currentPageId, board.id)
            },
        )
    }, [board.id, currentPageId])

    const showTemplatePicker = () => {
        // if the same board, reuse the match params
        // otherwise remove viewId and cardId, results in first view being selected
        const params = {teamId: match.params.teamId}
        const newPath = generatePath('/team/:teamId?', params)
        history.push(newPath)
    }

    const handleHideBoard = async () => {
        if (!me) {
            return
        }

        // creating new array as myConfig.hiddenBoardIDs.value
        // belongs to Redux state and so is immutable.
        const hiddenBoards = {...(myConfig.hiddenBoardIDs ? myConfig.hiddenBoardIDs.value : {})}

        hiddenBoards[board.id] = true
        const hiddenBoardsArray = Object.keys(hiddenBoards)
        const patch: UserConfigPatch = {
            updatedFields: {
                hiddenBoardIDs: JSON.stringify(hiddenBoardsArray),
            },
        }
        const patchedProps = await octoClient.patchUserConfig(me.id, patch)
        if (!patchedProps) {
            return
        }

        dispatch(patchProps(patchedProps))

        // If we're hiding the board we're currently on,
        // we need to switch to a different board once its hidden.
        if (currentBoardID === props.board.id) {
            // There's no special logic on what the next board needs to be.
            // To keep things simple, we just switch to the first unhidden board

            // Empty board ID navigates to template picker, which is
            // fine if there are no more visible boards to switch to.
            const visibleBoards = myAllBoards.filter((b) => !hiddenBoards[b.id])

            if (visibleBoards.length === 0) {
                if (isPages) {
                    UserSettings.setLastFolderID(match.params.teamId!, null)
                } else {
                    UserSettings.setLastBoardID(match.params.teamId!, null)
                }
                showTemplatePicker()
            } else {
                let nextBoardID = ''
                if (visibleBoards.length > 0) {
                    nextBoardID = visibleBoards[0].id
                }
                props.showBoard(nextBoardID)
            }
        }
    }

    const boardItemRef = useRef<HTMLDivElement>(null)

    const title = board.title || (isPages ? intl.formatMessage({id: 'Sidebar.untitled-page', defaultMessage: '(Untitled Page)'}) : intl.formatMessage({id: 'Sidebar.untitled-board', defaultMessage: '(Untitled Board)'}))

    const isPageSelected = isPages && currentPageId
    const isBoardHighlighted = props.isActive && !isPageSelected

    return (
        <>
            <div
                className={`SidebarBoardItem subitem ${isBoardHighlighted ? 'active' : ''}`}
                onClick={() => props.showBoard(board.id)}
                ref={boardItemRef}
            >
                <div className='octo-sidebar-icon'>
                    {board.icon || (isPages ? <CompassIcon icon='file-text-outline'/> : <CompassIcon icon='product-boards'/>)}
                </div>
                <div
                    className='octo-sidebar-title'
                    title={title}
                >
                    {title}
                </div>
                <div>
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
                            position='auto'
                            parentRef={boardItemRef}
                        >
                            {isPages &&
                                <BoardPermissionGate
                                    boardId={board.id}
                                    permissions={[Permission.ManageBoardCards]}
                                >
                                    <Menu.Text
                                        id='addPage'
                                        name={intl.formatMessage({id: 'ViewHeader.addSubpage', defaultMessage: 'Add subpage'})}
                                        icon={<AddIcon/>}
                                        onClick={addPage}
                                    />
                                </BoardPermissionGate>}
                            <Menu.SubMenu
                                key={`moveBlock-${board.id}`}
                                id='moveBlock'
                                className='boardMoveToCategorySubmenu'
                                name={intl.formatMessage({id: 'SidebarCategories.BlocksMenu.Move', defaultMessage: 'Move To...'})}
                                icon={<CreateNewFolder/>}
                                position='auto'
                            >
                                {generateMoveToCategoryOptions(board.id)}
                            </Menu.SubMenu>
                            {!me?.is_guest &&
                                <Menu.Text
                                    id='duplicateBoard'
                                    name={isPages ? intl.formatMessage({id: 'Sidebar.duplicate-page', defaultMessage: 'Duplicate page'}): intl.formatMessage({id: 'Sidebar.duplicate-board', defaultMessage: 'Duplicate board'})}
                                    icon={<DuplicateIcon/>}
                                    onClick={() => handleDuplicateBoard(board.isTemplate)}
                                />}
                            {!isPages && !me?.is_guest &&
                                <Menu.Text
                                    id='templateFromBoard'
                                    name={intl.formatMessage({id: 'Sidebar.template-from-board', defaultMessage: 'New template from board'})}
                                    icon={<AddIcon/>}
                                    onClick={() => handleDuplicateBoard(true)}
                                />}
                            <Menu.Text
                                id='exportBoardArchive'
                                name={isPages ? intl.formatMessage({id: 'ViewHeader.export-page-archive', defaultMessage: 'Export page archive'}) : intl.formatMessage({id: 'ViewHeader.export-board-archive', defaultMessage: 'Export board archive'})}
                                icon={<CompassIcon icon='export-variant'/>}
                                onClick={() => Archiver.exportBoardArchive(board)}
                            />
                            <Menu.Text
                                id='hideBoard'
                                name={isPages ? intl.formatMessage({id: 'HidePage.MenuOption', defaultMessage: 'Hide page'}) : intl.formatMessage({id: 'HideBoard.MenuOption', defaultMessage: 'Hide board'})}
                                icon={<CloseIcon/>}
                                onClick={() => handleHideBoard()}
                            />
                            <BoardPermissionGate
                                boardId={board.id}
                                permissions={[Permission.DeleteBoard]}
                            >
                                <Menu.Text
                                    key={`deleteBlock-${board.id}`}
                                    id='deleteBlock'
                                    className='text-danger'
                                    name={isPages ? intl.formatMessage({id: 'Sidebar.delete-pages', defaultMessage: 'Delete pages tree'}) : intl.formatMessage({id: 'Sidebar.delete-board', defaultMessage: 'Delete board'})}
                                    icon={<DeleteIcon/>}
                                    onClick={() => {
                                        props.onDeleteRequest(board)
                                    }}
                                />
                            </BoardPermissionGate>
                        </Menu>
                    </MenuWrapper>
                </div>
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

            {props.isActive && pages.filter((p) => p.parentId === board.id).map((page: Page) => (
                <PageSidebarItem
                    page={page}
                    pages={pages}
                    board={board}
                    currentPageId={currentPageId}
                    showPage={props.showPage}
                    showBoard={props.showBoard}
                    parentId={board.id}
                    depth={0}
                />
            ))}
        </>
    )
}

export default React.memo(SidebarBoardItem)
