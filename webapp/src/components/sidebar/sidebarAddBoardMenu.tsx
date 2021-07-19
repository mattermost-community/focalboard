// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useEffect, useCallback} from 'react'
import {FormattedMessage, useIntl, IntlShape} from 'react-intl'
import {generatePath, useHistory, useRouteMatch} from 'react-router-dom'

import {MutableBoard} from '../../blocks/board'
import {MutableBoardView} from '../../blocks/boardView'
import mutator from '../../mutator'
import octoClient from '../../octoClient'
import {WorkspaceTree} from '../../viewModel/workspaceTree'
import AddIcon from '../../widgets/icons/add'
import BoardIcon from '../../widgets/icons/board'
import Menu from '../../widgets/menu'
import MenuWrapper from '../../widgets/menuWrapper'
import {useAppDispatch, useAppSelector} from '../../store/hooks'
import {getGlobalTemplates, fetchGlobalTemplates} from '../../store/globalTemplates'

import BoardTemplateMenuItem from './boardTemplateMenuItem'

import './sidebarAddBoardMenu.scss'

type Props = {
    workspaceTree: WorkspaceTree,
    activeBoardId?: string
}

const addBoardClicked = async (showBoard: (id: string) => void, intl: IntlShape, activeBoardId?: string) => {
    const oldBoardId = activeBoardId

    const board = new MutableBoard()
    board.rootId = board.id

    const view = new MutableBoardView()
    view.viewType = 'board'
    view.parentId = board.id
    view.rootId = board.rootId
    view.title = intl.formatMessage({id: 'View.NewBoardTitle', defaultMessage: 'Board view'})

    await mutator.insertBlocks(
        [board, view],
        'add board',
        async () => {
            showBoard(board.id)
        },
        async () => {
            if (oldBoardId) {
                showBoard(oldBoardId)
            }
        },
    )
}

const addBoardTemplateClicked = async (showBoard: (id: string) => void, activeBoardId?: string) => {
    const boardTemplate = new MutableBoard()
    boardTemplate.rootId = boardTemplate.id
    boardTemplate.isTemplate = true
    await mutator.insertBlock(
        boardTemplate,
        'add board template',
        async () => {
            showBoard(boardTemplate.id)
        }, async () => {
            if (activeBoardId) {
                showBoard(activeBoardId)
            }
        },
    )
}

const SidebarAddBoardMenu = (props: Props): JSX.Element => {
    const globalTemplates = useAppSelector<MutableBoard[]>(getGlobalTemplates)
    const dispatch = useAppDispatch()
    const history = useHistory()
    const match = useRouteMatch()

    const showBoard = useCallback((boardId) => {
        const newPath = generatePath(match.path, {...match.params, boardId: boardId || ''})
        history.push(newPath)
    }, [match, history])

    useEffect(() => {
        if (octoClient.workspaceId !== '0' && globalTemplates.length === 0) {
            dispatch(fetchGlobalTemplates())
        }
    }, [octoClient.workspaceId])

    const {workspaceTree} = props
    const intl = useIntl()

    if (!workspaceTree) {
        return <div/>
    }

    return (
        <div className='SidebarAddBoardMenu'>
            <MenuWrapper>
                <div className='menu-entry'>
                    <FormattedMessage
                        id='Sidebar.add-board'
                        defaultMessage='+ Add Board'
                    />
                </div>
                <Menu position='top'>
                    {workspaceTree.boardTemplates.length > 0 && <>
                        <Menu.Label>
                            <b>
                                <FormattedMessage
                                    id='Sidebar.select-a-template'
                                    defaultMessage='Select a template'
                                />
                            </b>
                        </Menu.Label>

                        <Menu.Separator/>
                    </>}

                    {workspaceTree.boardTemplates.map((boardTemplate) => (
                        <BoardTemplateMenuItem
                            key={boardTemplate.id}
                            boardTemplate={boardTemplate}
                            isGlobal={false}
                            showBoard={showBoard}
                            activeBoardId={props.activeBoardId}
                        />
                    ))}

                    {globalTemplates.map((boardTemplate: MutableBoard) => (
                        <BoardTemplateMenuItem
                            key={boardTemplate.id}
                            boardTemplate={boardTemplate}
                            isGlobal={true}
                            showBoard={showBoard}
                            activeBoardId={props.activeBoardId}
                        />
                    ))}

                    <Menu.Text
                        id='empty-template'
                        name={intl.formatMessage({id: 'Sidebar.empty-board', defaultMessage: 'Empty board'})}
                        icon={<BoardIcon/>}
                        onClick={() => addBoardClicked(showBoard, intl, props.activeBoardId)}
                    />

                    <Menu.Text
                        icon={<AddIcon/>}
                        id='add-template'
                        name={intl.formatMessage({id: 'Sidebar.add-template', defaultMessage: 'New template'})}
                        onClick={() => addBoardTemplateClicked(showBoard, props.activeBoardId)}
                    />
                </Menu>
            </MenuWrapper>
        </div>
    )
}

export default SidebarAddBoardMenu
