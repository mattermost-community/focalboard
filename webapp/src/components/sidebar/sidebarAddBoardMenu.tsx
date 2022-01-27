// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useCallback, useEffect} from 'react'
import {FormattedMessage, IntlShape, useIntl} from 'react-intl'
import {generatePath, useHistory, useRouteMatch} from 'react-router-dom'

import {Block} from '../../blocks/block'
import {Board, BoardsAndBlocks, createBoard} from '../../blocks/board'
import {createBoardView} from '../../blocks/boardView'
import mutator from '../../mutator'
import octoClient from '../../octoClient'
import {getSortedTemplates} from '../../store/boards'
import {fetchGlobalTemplates, getGlobalTemplates} from '../../store/globalTemplates'
import {useAppDispatch, useAppSelector} from '../../store/hooks'
import TelemetryClient, {TelemetryActions, TelemetryCategory} from '../../telemetry/telemetryClient'
import AddIcon from '../../widgets/icons/add'
import BoardIcon from '../../widgets/icons/board'
import Menu from '../../widgets/menu'
import MenuWrapper from '../../widgets/menuWrapper'

import BoardTemplateMenuItem from './boardTemplateMenuItem'
import './sidebarAddBoardMenu.scss'

type Props = {
    activeBoardId?: string
}

export const addBoardClicked = async (showBoard: (id: string) => void, intl: IntlShape, activeBoardId?: string) => {
    const oldBoardId = activeBoardId

    let board = createBoard()
    board.teamId = octoClient.teamId
    let view = createBoardView()
    view.fields.viewType = 'board'
    view.boardId = board.id
    view.parentId = board.id
    view.rootId = board.id
    view.title = intl.formatMessage({id: 'View.NewBoardTitle', defaultMessage: 'Board view'})

    const bab = {
        boards: [board],
        blocks: [view],
    } as BoardsAndBlocks

    await mutator.createBoardsAndBlocks(
        bab,
        'add board and default view',
        async ({boards, blocks}) => {
            board = boards[0]
            TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.CreateBoard, {board: board.id})
            showBoard(board.id)
        },
        async () => {
            if (oldBoardId) {
                showBoard(oldBoardId)
            }
        }
    )
}

export const addBoardTemplateClicked = async (showBoard: (id: string) => void, intl: IntlShape, activeBoardId?: string) => {
    const oldBoardId = activeBoardId

    let boardTemplate = createBoard()
    boardTemplate.teamId = octoClient.teamId
    boardTemplate.isTemplate = true
    boardTemplate.title = intl.formatMessage({id: 'View.NewTemplateTitle', defaultMessage: 'Untitled Template'})
    let view = createBoardView()
    view.fields.viewType = 'board'
    view.boardId = boardTemplate.id
    view.parentId = boardTemplate.id
    view.rootId = boardTemplate.id
    view.title = intl.formatMessage({id: 'View.NewBoardTitle', defaultMessage: 'Board view'})

    const bab = {
        boards: [boardTemplate],
        blocks: [view],
    } as BoardsAndBlocks

    await mutator.createBoardsAndBlocks(
        bab,
        'add board template and default view',
        async ({boards, blocks}) => {
            boardTemplate = boards[0]
            TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.CreateBoard, {board: boardTemplate.id})
            showBoard(boardTemplate.id)
        },
        async () => {
            if (oldBoardId) {
                showBoard(oldBoardId)
            }
        }
    )
}

const SidebarAddBoardMenu = (props: Props): JSX.Element => {
    const globalTemplates = useAppSelector<Board[]>(getGlobalTemplates)
    const dispatch = useAppDispatch()
    const history = useHistory()
    const match = useRouteMatch<{boardId: string, viewId?: string}>()

    const showBoard = useCallback((boardId) => {
        const params = {...match.params, boardId: boardId || ''}
        delete params.viewId
        const newPath = generatePath(match.path, params)
        history.push(newPath)
    }, [match, history])

    useEffect(() => {
        if (octoClient.teamId !== '0' && globalTemplates.length === 0) {
            dispatch(fetchGlobalTemplates(octoClient.teamId))
        }
    }, [octoClient.teamId])

    const intl = useIntl()
    const templates = useAppSelector(getSortedTemplates)

    if (!templates) {
        return <div/>
    }

    return (
        <div className='SidebarAddBoardMenu'>
            <MenuWrapper>
                <div className='menu-entry'>
                    <FormattedMessage
                        id='Sidebar.add-board'
                        defaultMessage='+ Add board'
                    />
                </div>
                <Menu position='top'>
                    {templates.length > 0 && <>
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

                    {templates.map((boardTemplate) => (
                        <BoardTemplateMenuItem
                            key={boardTemplate.id}
                            boardTemplate={boardTemplate}
                            isGlobal={false}
                            showBoard={showBoard}
                            activeBoardId={props.activeBoardId}
                        />
                    ))}

                    {globalTemplates.map((boardTemplate: Board) => (
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
                        onClick={() => addBoardTemplateClicked(showBoard, intl, props.activeBoardId)}
                    />
                </Menu>
            </MenuWrapper>
        </div>
    )
}

export default SidebarAddBoardMenu
