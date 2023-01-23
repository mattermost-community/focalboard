// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useCallback, useState, useContext} from 'react'
import {useIntl} from 'react-intl'
import {generatePath, useHistory, useRouteMatch} from 'react-router-dom'

import {Board} from '../../blocks/board'
import {createPage} from '../../blocks/page'
import {Block} from '../../blocks/block'
import mutator from '../../mutator'
import IconButton from '../../widgets/buttons/iconButton'
import DeleteIcon from '../../widgets/icons/delete'
import OptionsIcon from '../../widgets/icons/options'
import Menu from '../../widgets/menu'
import MenuWrapper from '../../widgets/menuWrapper'
import BoardPermissionGate from '../permissions/boardPermissionGate'

import './sidebarBoardItem.scss'
import {CategoryBoards, updateBoardCategories} from '../../store/sidebar'
import CreateNewFolder from '../../widgets/icons/newFolder'
import {useAppDispatch, useAppSelector} from '../../store/hooks'
import Folder from '../../widgets/icons/folder'
import Check from '../../widgets/icons/checkIcon'
import CompassIcon from '../../widgets/icons/compassIcon'
import DuplicateIcon from '../../widgets/icons/duplicate'
import isPagesContext from '../../isPages'
import {getCurrentPage} from '../../store/pages'

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

import './sidebarBoardMenu.scss'

type Props = {
    categoryBoards: CategoryBoards
    board: Board
    allCategories: CategoryBoards[]
    onDeleteRequest: (board: Board) => void
    showBoard: (boardId: string) => void
    showPage: (pageId: string, boardId: string) => void
    itemRef: React.RefObject<HTMLDivElement>
}

const SidebarBoardMenu = (props: Props) => {
    const intl = useIntl()

    const [boardsMenuOpen, setBoardsMenuOpen] = useState<{[key: string]: boolean}>({})

    const isPages = useContext(isPagesContext)
    const team = useAppSelector(getCurrentTeam)
    const currentPage = useAppSelector(getCurrentPage)
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
        page.parentId = currentPage?.id
        page.boardId = board.id
        await mutator.insertBlock(
            board.id,
            page,
            intl.formatMessage({id: 'Mutator.new-page', defaultMessage: 'new page'}),
            async (newBlock: Block) => {
                props.showPage(newBlock.id, board.id)
            },
            async () => {
                props.showPage(currentPage?.id, board.id)
            },
        )
    }, [board.id, currentPage?.id])

    const showTemplatePicker = () => {
        // if the same board, reuse the match params
        // otherwise remove viewId and cardId, results in first view being selected
        const params = {teamId: match.params.teamId}
        if (isPages) {
            const newPath = generatePath('/pages/team/:teamId?', params)
            history.push(newPath)
        } else {
            const newPath = generatePath('/boards/team/:teamId?', params)
            history.push(newPath)
        }
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
            let visibleBoards = myAllBoards.filter((b) => !hiddenBoards[b.id])
            if (isPages) {
                visibleBoards = visibleBoards.filter((b) => b.isPagesFolder === true)
            } else {
                visibleBoards = visibleBoards.filter((b) => b.isPagesFolder !== true)
            }

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

    return (
        <MenuWrapper
            className={boardsMenuOpen[board.id] ? 'SidebarBoardMenu menuOpen' : 'SidebarBoardMenu x'}
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
                parentRef={props.itemRef}
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
                        name={isPages ? intl.formatMessage({id: 'Sidebar.duplicate-page', defaultMessage: 'Duplicate page'}) : intl.formatMessage({id: 'Sidebar.duplicate-board', defaultMessage: 'Duplicate board'})}
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
    )
}

export default React.memo(SidebarBoardMenu)
