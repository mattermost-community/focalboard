// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useEffect, useState, useMemo, useCallback} from 'react'
import {FormattedMessage, IntlShape, useIntl} from 'react-intl'
import {generatePath, useHistory, useRouteMatch} from 'react-router-dom'

import {Board, createBoard} from '../../blocks/board'
import {Block} from '../../blocks/block'
import {Card} from '../../blocks/card'
import {BoardView, createBoardView} from '../../blocks/boardView'
import IconButton from '../../widgets/buttons/iconButton'
import CloseIcon from '../../widgets/icons/close'
import AddIcon from '../../widgets/icons/add'
import Button from '../../widgets/buttons/button'
import mutator from '../../mutator'
import octoClient from '../../octoClient'
import {getSortedTemplates} from '../../store/boards'
import {fetchGlobalTemplates, getGlobalTemplates} from '../../store/globalTemplates'
import {getViewsByBoard} from '../../store/views'
import {useAppDispatch, useAppSelector} from '../../store/hooks'
import {getVisibleAndHiddenGroups} from '../../boardUtils'
import TelemetryClient, {TelemetryActions, TelemetryCategory} from '../../telemetry/telemetryClient'

import ViewHeader from '../viewHeader/viewHeader'
import ViewTitle from '../viewTitle'
import Kanban from '../kanban/kanban'

import Table from '../table/table'

import CalendarFullView from '../calendar/fullCalendar'

import Gallery from '../gallery/gallery'

import './boardTemplateSelector.scss'

export const addBoardFromTemplate = async (intl: IntlShape, showBoard: (id: string) => void, boardTemplateId: string, activeBoardId?: string, global = false) => {
    const oldBoardId = activeBoardId
    const afterRedo = async (newBoardId: string) => {
        showBoard(newBoardId)
    }
    const beforeUndo = async () => {
        if (oldBoardId) {
            showBoard(oldBoardId)
        }
    }
    const asTemplate = false
    const actionDescription = intl.formatMessage({id: 'Mutator.new-board-from-template', defaultMessage: 'new board from template'})

    TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.CreateBoardViaTemplate, {boardTemplateId})
    if (global) {
        await mutator.duplicateFromRootBoard(boardTemplateId, actionDescription, asTemplate, afterRedo, beforeUndo)
    } else {
        await mutator.duplicateBoard(boardTemplateId, actionDescription, asTemplate, afterRedo, beforeUndo)
    }
}

export const addBoardClicked = async (showBoard: (id: string) => void, intl: IntlShape, activeBoardId?: string) => {
    const oldBoardId = activeBoardId

    const board = createBoard()
    board.rootId = board.id

    const view = createBoardView()
    view.fields.viewType = 'board'
    view.parentId = board.id
    view.rootId = board.rootId
    view.title = intl.formatMessage({id: 'View.NewBoardTitle', defaultMessage: 'Board view'})

    await mutator.insertBlocks(
        [board, view],
        'add board',
        async (newBlocks: Block[]) => {
            const newBoardId = newBlocks[0].id
            TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.CreateBoard, {board: newBoardId})
            showBoard(newBoardId)
        },
        async () => {
            if (oldBoardId) {
                showBoard(oldBoardId)
            }
        },
    )
}

export const addBoardTemplateClicked = async (showBoard: (id: string) => void, intl: IntlShape, activeBoardId?: string) => {
    const boardTemplate = createBoard()
    boardTemplate.rootId = boardTemplate.id
    boardTemplate.fields.isTemplate = true
    boardTemplate.title = intl.formatMessage({id: 'View.NewTemplateTitle', defaultMessage: 'Untitled Template'})

    const view = createBoardView()
    view.fields.viewType = 'board'
    view.parentId = boardTemplate.id
    view.rootId = boardTemplate.rootId
    view.title = intl.formatMessage({id: 'View.NewBoardTitle', defaultMessage: 'Board view'})

    await mutator.insertBlocks(
        [boardTemplate, view],
        'add board template',
        async (newBlocks: Block[]) => {
            const newBoardId = newBlocks[0].id
            TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.CreateBoardTemplate, {board: newBoardId})
            showBoard(newBoardId)
        }, async () => {
            if (activeBoardId) {
                showBoard(activeBoardId)
            }
        },
    )
}

type Props = {
    onClose: () => void
}

const BoardTemplateSelector = React.memo((props: Props) => {
    const globalTemplates = useAppSelector<Board[]>(getGlobalTemplates) || []
    const viewsByBoard = useAppSelector<{[key: string]: BoardView[]}>(getViewsByBoard) || {}
    const {onClose} = props
    const dispatch = useAppDispatch()
    const intl = useIntl()
    const history = useHistory()
    const match = useRouteMatch<{boardId: string, viewId?: string}>()

    const showBoard = useCallback((boardId) => {
        const params = {...match.params, boardId: boardId || ''}
        delete params.viewId
        const newPath = generatePath(match.path, params)
        history.push(newPath)
        onClose()
    }, [match, history])

    useEffect(() => {
        if (octoClient.workspaceId !== '0' && globalTemplates.length === 0) {
            dispatch(fetchGlobalTemplates())
        }
    }, [octoClient.workspaceId])

    const templates = useAppSelector(getSortedTemplates) || []
    const allTemplates = templates.concat(globalTemplates)

    const [activeTemplate, setActiveTemplate] = useState<Board>(allTemplates[0])
    const [activeTemplateCards, setActiveTemplateCards] = useState<Card[]>([])

    let activeView: null|BoardView = null
    if (viewsByBoard[activeTemplate?.id] && viewsByBoard[activeTemplate?.id].length > 0) {
        activeView = viewsByBoard[activeTemplate?.id][0]
    }

    if (!activeView) {
        return null
    }
    useEffect(() => {
        if (!activeTemplate) {
            setActiveTemplate(templates.concat(globalTemplates)[0])
        }
    }, [templates, globalTemplates])

    useEffect(() => {
        if (activeTemplate) {
            setActiveTemplateCards([])
            octoClient.getSubtree(activeTemplate.id, activeView?.fields.viewType === 'gallery' ? 3 : 2).then((blocks) => {
                const cards = blocks.filter((b) => b.type === 'card')
                setActiveTemplateCards(cards as Card[])
            })
        }
    }, [activeTemplate, activeView])

    const dateDisplayProperty = useMemo(() => {
        return activeTemplate.fields.cardProperties.find((o) => o.id === activeView.fields.dateDisplayPropertyId)
    }, [activeView, activeTemplate])

    const groupByProperty = useMemo(() => {
        return activeTemplate.fields.cardProperties.find((o) => o.id === activeView?.fields.groupById) || activeTemplate.fields.cardProperties[0]
    }, [activeView, activeTemplate])

    const {visible: visibleGroups, hidden: hiddenGroups} = useMemo(() => {
        if (!activeView) {
            return {visible: [], hidden: []}
        }
        return getVisibleAndHiddenGroups(activeTemplateCards, activeView.fields.visibleOptionIds, activeView?.fields.hiddenOptionIds, groupByProperty)
    }, [activeTemplateCards, activeView, groupByProperty])

    if (!allTemplates) {
        return <div/>
    }

    return (
        <div className='BoardTemplateSelector'>
            <div className='toolbar'>
                <IconButton
                    onClick={onClose}
                    icon={<CloseIcon/>}
                    title={'Close'}
                />
            </div>
            <div className='header'>
                <h1 className='title'>
                    <FormattedMessage
                        id='BoardTemplateSelector.title'
                        defaultMessage='Create a Board'
                    />
                </h1>
                <p className='description'>
                    <FormattedMessage
                        id='BoardTemplateSelector.description'
                        defaultMessage='Choose a template to help you get started. Easily customize the template to fit your needs, or create an empty board to start from scratch.'
                    />
                </p>
            </div>

            <div className='templates'>
                <div className='templates-list'>
                    {allTemplates.map((boardTemplate) => (
                        <div
                            key={boardTemplate.id}
                            className={activeTemplate?.id === boardTemplate.id ? 'template-item active' : 'template-item'}
                            onClick={() => setActiveTemplate(boardTemplate)}
                        >
                            <span className='template-icon'>{boardTemplate.fields.icon}</span>
                            <span className='template-name'>{boardTemplate.title}</span>
                        </div>
                    ))}
                    <div
                        className='new-template'
                        onClick={() => addBoardTemplateClicked(showBoard, intl)}
                    >
                        <span className='template-icon'><AddIcon/></span>
                        <span className='template-name'>
                            <FormattedMessage
                                id='BoardTemplateSelector.add-template'
                                defaultMessage='New template'
                            />
                        </span>
                    </div>
                </div>
                <div className='template-preview-box'>
                    <div className='preview'>
                        <div className='prevent-click'/>
                        <div className='top-head'>
                            <ViewTitle
                                key={activeTemplate?.id + activeTemplate?.title}
                                board={activeTemplate}
                                readonly={true}
                            />
                            <ViewHeader
                                board={activeTemplate}
                                activeView={activeView}
                                cards={activeTemplateCards}
                                views={viewsByBoard[activeTemplate.id]}
                                groupByProperty={groupByProperty}
                                addCard={() => null}
                                addCardFromTemplate={() => null}
                                addCardTemplate={() => null}
                                editCardTemplate={() => null}
                                readonly={false}
                                showShared={false}
                            />
                        </div>

                        {activeView?.fields.viewType === 'board' &&
                        <Kanban
                            board={activeTemplate}
                            activeView={activeView}
                            cards={activeTemplateCards}
                            groupByProperty={groupByProperty}
                            visibleGroups={visibleGroups}
                            hiddenGroups={hiddenGroups}
                            selectedCardIds={[]}
                            readonly={false}
                            onCardClicked={() => null}
                            addCard={() => Promise.resolve()}
                            showCard={() => null}
                        />}
                        {activeView.fields.viewType === 'table' &&
                            <Table
                                board={activeTemplate}
                                activeView={activeView}
                                cards={activeTemplateCards}
                                groupByProperty={groupByProperty}
                                views={[activeView]}
                                visibleGroups={visibleGroups}
                                selectedCardIds={[]}
                                readonly={false}
                                cardIdToFocusOnRender={''}
                                onCardClicked={() => null}
                                addCard={() => Promise.resolve()}
                                showCard={() => null}
                            />}
                        {activeView.fields.viewType === 'gallery' &&
                            <Gallery
                                board={activeTemplate}
                                cards={activeTemplateCards}
                                activeView={activeView}
                                readonly={false}
                                selectedCardIds={[]}
                                onCardClicked={() => null}
                                addCard={() => Promise.resolve()}
                            />}
                        {activeView.fields.viewType === 'calendar' &&
                            <CalendarFullView
                                board={activeTemplate}
                                cards={activeTemplateCards}
                                activeView={activeView}
                                readonly={false}
                                dateDisplayProperty={dateDisplayProperty}
                                showCard={() => null}
                                addCard={() => Promise.resolve()}
                            />}
                    </div>
                    <div className='buttons'>
                        <Button
                            filled={true}
                            onClick={() => addBoardFromTemplate(intl, showBoard, activeTemplate.id)}
                        >
                            <FormattedMessage
                                id='BoardTemplateSelector.use-this-template'
                                defaultMessage='Use this template'
                            />
                        </Button>
                        <Button
                            filled={false}
                            className='empty-board'
                            onClick={() => addBoardClicked(showBoard, intl)}
                        >
                            <FormattedMessage
                                id='BoardTemplateSelector.create-empty-board'
                                defaultMessage='Create empty board'
                            />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
})

export default BoardTemplateSelector

