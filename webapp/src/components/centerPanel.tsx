// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
/* eslint-disable max-lines */
import React, {useState, useCallback, useEffect, useMemo} from 'react'
import {useIntl, IntlShape} from 'react-intl'
import {useHotkeys} from 'react-hotkeys-hook'

import {ClientConfig} from '../config/clientConfig'

import {Block, ContentBlockTypes, createBlock} from '../blocks/block'
import {BlockIcons} from '../blockIcons'
import {Card, createCard} from '../blocks/card'
import {Page} from '../blocks/page'
import {Board, IPropertyTemplate} from '../blocks/board'
import {BoardView} from '../blocks/boardView'
import {CardFilter} from '../cardFilter'
import mutator from '../mutator'
import {Utils} from '../utils'
import {UserSettings} from '../userSettings'
import {getCurrentCard, addCard as addCardAction, addTemplate as addTemplateAction, showCardHiddenWarning} from '../store/cards'
import {getCurrentPageContents} from '../store/contents'
import {getCardLimitTimestamp} from '../store/limits'
import {updateContents} from '../store/contents'
import {updateView} from '../store/views'
import {getVisibleAndHiddenGroups} from '../boardUtils'
import TelemetryClient, {TelemetryCategory, TelemetryActions} from '../../../webapp/src/telemetry/telemetryClient'

import './centerPanel.scss'

import {useAppSelector, useAppDispatch} from '../store/hooks'
import {updatePages} from '../store/pages'

import {
    getMe,
    getOnboardingTourCategory,
    getOnboardingTourStarted,
    getOnboardingTourStep,
    patchProps,
} from '../store/users'

import {UserConfigPatch} from '../user'

import octoClient from '../octoClient'

import ShareBoardButton from './shareBoard/shareBoardButton'
import ShareBoardLoginButton from './shareBoard/shareBoardLoginButton'

import BlocksEditor from './blocksEditor/blocksEditor'
import {BlockData} from './blocksEditor/blocks/types'

import CardDialog from './cardDialog'
import RootPortal from './rootPortal'
import TopBar from './topBar'
import ViewHeader from './viewHeader/viewHeader'
import ViewTitle from './viewTitle'
import Kanban from './kanban/kanban'

import Table from './table/table'

import CalendarFullView from './calendar/fullCalendar'

import CardLimitNotification from './cardLimitNotification'

import Gallery from './gallery/gallery'
import {BoardTourSteps, FINISHED, TOUR_BOARD, TOUR_CARD} from './onboardingTour'
import ShareBoardTourStep from './onboardingTour/shareBoard/shareBoard'

type Props = {
    clientConfig?: ClientConfig
    board: Board
    cards: Card[]
    activeView?: BoardView
    activePage?: Page
    views: BoardView[]
    groupByProperty?: IPropertyTemplate
    dateDisplayProperty?: IPropertyTemplate
    readonly: boolean
    shownCardId?: string
    showCard: (cardId?: string) => void
    hiddenCardsCount: number
}

async function addBlockNewEditor(page: Page, intl: IntlShape, title: string, fields: any, contentType: ContentBlockTypes, afterBlockId: string, dispatch: any): Promise<Block> {
    const block = createBlock()
    block.parentId = page.id
    block.boardId = page.boardId
    block.title = title
    block.type = contentType
    block.fields = {...block.fields, ...fields}

    const description = intl.formatMessage({id: 'CardDetail.addCardText', defaultMessage: 'add page text'})

    const afterRedo = async (newBlock: Block) => {
        const contentOrder = page.fields.contentOrder.slice()
        if (afterBlockId) {
            const idx = contentOrder.indexOf(afterBlockId)
            if (idx === -1) {
                contentOrder.push(newBlock.id)
            } else {
                contentOrder.splice(idx + 1, 0, newBlock.id)
            }
        } else {
            contentOrder.push(newBlock.id)
        }
        await octoClient.patchBlock(page.boardId, page.id, {updatedFields: {contentOrder}})
        dispatch(updatePages([{...page, fields: {...page.fields, contentOrder}}]))
    }

    const beforeUndo = async () => {
        const contentOrder = page.fields.contentOrder.slice()
        await octoClient.patchBlock(page.boardId, page.id, {updatedFields: {contentOrder}})
    }

    const newBlock = await mutator.insertBlock(block.boardId, block, description, afterRedo, beforeUndo)
    dispatch(updateContents([newBlock]))
    return newBlock
}


const CenterPanel = (props: Props) => {
    const intl = useIntl()
    const [selectedCardIds, setSelectedCardIds] = useState<string[]>([])
    const [cardIdToFocusOnRender, setCardIdToFocusOnRender] = useState('')
    const [showHiddenCardCountNotification, setShowHiddenCardCountNotification] = useState(false)

    const onboardingTourStarted = useAppSelector(getOnboardingTourStarted)
    const onboardingTourCategory = useAppSelector(getOnboardingTourCategory)
    const onboardingTourStep = useAppSelector(getOnboardingTourStep)
    const cardLimitTimestamp = useAppSelector(getCardLimitTimestamp)
    const me = useAppSelector(getMe)
    const currentCard = useAppSelector(getCurrentCard)
    const currentPageContents = useAppSelector(getCurrentPageContents)
    const dispatch = useAppDispatch()

    // empty dependency array yields behavior like `componentDidMount`, it only runs _once_
    // https://stackoverflow.com/a/58579462
    useEffect(() => {
        TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.ViewBoard, {board: props.board.id, view: props.activeView?.id, viewType: props.activeView?.fields.viewType, page: props.activePage?.id})
    }, [])

    useHotkeys('esc', (e: KeyboardEvent) => {
        if (e.target !== document.body || props.readonly) {
            return
        }
        if (selectedCardIds.length > 0) {
            setSelectedCardIds([])
            e.stopPropagation()
        }
    }, [selectedCardIds, props.readonly])

    useHotkeys('ctrl+d', (e: KeyboardEvent) => {
        if (e.target !== document.body || props.readonly) {
            return
        }

        if (selectedCardIds.length > 0) {
            // CTRL+D: Duplicate selected cards
            const {board} = props
            if (selectedCardIds.length < 1) {
                return
            }

            mutator.performAsUndoGroup(async () => {
                for (const cardId of selectedCardIds) {
                    const card = props.cards.find((o) => o.id === cardId)
                    if (card) {
                        mutator.duplicateCard(cardId, board.id)
                    } else {
                        Utils.assertFailure(`Selected card not found: ${cardId}`)
                    }
                }
            })

            setSelectedCardIds([])
            e.stopPropagation()
            e.preventDefault()
        }
    }, [selectedCardIds, props.readonly, props.cards, props.board.id])

    useHotkeys('del,backspace', (e: KeyboardEvent) => {
        if (e.target !== document.body || props.readonly) {
            return
        }

        if (selectedCardIds.length > 0) {
            // Backspace or Del: Delete selected cards
            if (selectedCardIds.length < 1) {
                return
            }

            mutator.performAsUndoGroup(async () => {
                for (const cardId of selectedCardIds) {
                    const card = props.cards.find((o) => o.id === cardId)
                    if (card) {
                        mutator.deleteBlock(card, selectedCardIds.length > 1 ? `delete ${selectedCardIds.length} cards` : 'delete card')
                    } else {
                        Utils.assertFailure(`Selected card not found: ${cardId}`)
                    }
                }
            })

            setSelectedCardIds([])
            e.stopPropagation()
        }
    }, [selectedCardIds, props.readonly, props.cards])

    const showCard = useCallback((cardId?: string) => {
        if (selectedCardIds.length > 0) {
            setSelectedCardIds([])
        }
        props.showCard(cardId)
    }, [props.showCard, selectedCardIds])

    const addCard = useCallback(async (groupByOptionId?: string, show = false, properties: Record<string, string> = {}): Promise<void> => {
        const {activeView, board, groupByProperty} = props

        if (!activeView) {
            // TODO: Log here an error, it shouldn't happen ever
            return
        }

        const card = createCard()

        TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.CreateCard, {board: board.id, view: activeView.id, card: card.id})

        card.parentId = board.id
        card.boardId = board.id
        const propertiesThatMeetFilters = CardFilter.propertiesThatMeetFilterGroup(activeView.fields.filter, board.cardProperties)
        if ((activeView.fields.viewType === 'board' || activeView.fields.viewType === 'table') && groupByProperty) {
            if (groupByOptionId) {
                propertiesThatMeetFilters[groupByProperty.id] = groupByOptionId
            } else {
                delete propertiesThatMeetFilters[groupByProperty.id]
            }
        }
        card.fields.properties = {...card.fields.properties, ...properties, ...propertiesThatMeetFilters}
        if (!card.fields.icon && UserSettings.prefillRandomIcons) {
            card.fields.icon = BlockIcons.shared.randomIcon()
        }
        mutator.performAsUndoGroup(async () => {
            const newCard = await mutator.insertBlock(
                card.boardId,
                card,
                'add card',
                async (block: Block) => {
                    if (show) {
                        dispatch(addCardAction(createCard(block)))
                        dispatch(updateView({...activeView, fields: {...activeView.fields, cardOrder: [...activeView.fields.cardOrder, block.id]}}))
                        showCard(block.id)
                    } else {
                        // Focus on this card's title inline on next render
                        setCardIdToFocusOnRender(block.id)
                        setTimeout(() => setCardIdToFocusOnRender(''), 100)
                    }
                },
                async () => {
                    showCard(undefined)
                },
            )
            dispatch(showCardHiddenWarning(cardLimitTimestamp > 0))
            await mutator.changeViewCardOrder(board.id, activeView.id, activeView.fields.cardOrder, [...activeView.fields.cardOrder, newCard.id], 'add-card')
        })
    }, [props.activeView, props.board.id, props.board.cardProperties, props.groupByProperty, showCard])

    const addEmptyCardAndShow = useCallback(() => addCard('', true), [addCard])

    const shouldStartBoardsTour = useCallback((): boolean => {
        const isOnboardingBoard = props.board.title === 'Welcome to Boards!'
        const isTourStarted = onboardingTourStarted
        const completedCardsTour = onboardingTourCategory === TOUR_CARD && onboardingTourStep === FINISHED.toString()
        const noCardOpen = !currentCard

        return isOnboardingBoard && isTourStarted && completedCardsTour && noCardOpen
    }, [currentCard, onboardingTourStarted, onboardingTourCategory, onboardingTourStep, props.board.title])

    const prepareBoardsTour = useCallback(async () => {
        if (!me?.id) {
            return
        }

        const patch: UserConfigPatch = {
            updatedFields: {
                tourCategory: TOUR_BOARD,
                onboardingTourStep: BoardTourSteps.ADD_VIEW.toString(),
            },
        }

        const patchedProps = await octoClient.patchUserConfig(me.id, patch)
        if (patchedProps) {
            dispatch(patchProps(patchedProps))
        }
    }, [me?.id])

    const startBoardsTour = useCallback(async () => {
        if (!shouldStartBoardsTour()) {
            return
        }

        await prepareBoardsTour()
    }, [prepareBoardsTour, shouldStartBoardsTour])

    useEffect(() => {
        startBoardsTour()
    })

    const backgroundClicked = useCallback((e: React.MouseEvent) => {
        if (selectedCardIds.length > 0) {
            setSelectedCardIds([])
            e.stopPropagation()
        }
    }, [selectedCardIds])

    const addCardFromTemplate = useCallback(async (cardTemplateId: string, groupByOptionId?: string) => {
        const {activeView, board, groupByProperty} = props
        if (!activeView) {
            // TODO: Log here an error, it shouldn't happen ever
            return
        }

        const propertiesThatMeetFilters = CardFilter.propertiesThatMeetFilterGroup(activeView.fields.filter, board.cardProperties)
        if ((activeView.fields.viewType === 'board' || activeView.fields.viewType === 'table') && groupByProperty) {
            if (groupByOptionId) {
                propertiesThatMeetFilters[groupByProperty.id] = groupByOptionId
            } else {
                delete propertiesThatMeetFilters[groupByProperty.id]
            }
        }

        mutator.performAsUndoGroup(async () => {
            const [, newCardId] = await mutator.duplicateCard(
                cardTemplateId,
                board.id,
                true,
                intl.formatMessage({id: 'Mutator.new-card-from-template', defaultMessage: 'new card from template'}),
                false,
                propertiesThatMeetFilters,
                async (cardId) => {
                    if (!activeView) {
                        // TODO: Log here an error, it shouldn't happen ever
                        return
                    }
                    dispatch(updateView({...activeView, fields: {...activeView.fields, cardOrder: [...activeView.fields.cardOrder, cardId]}}))
                    TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.CreateCardViaTemplate, {board: props.board.id, view: activeView.id, card: cardId, cardTemplateId})
                    showCard(cardId)
                },
                async () => {
                    showCard(undefined)
                },
            )
            await mutator.changeViewCardOrder(props.board.id, activeView.id, activeView.fields.cardOrder, [...activeView.fields.cardOrder, newCardId], 'add-card')
        })
    }, [props.board, props.activeView, showCard])

    const addCardTemplate = useCallback(async () => {
        const {board, activeView} = props

        const cardTemplate = createCard()
        cardTemplate.fields.isTemplate = true
        cardTemplate.parentId = board.id
        cardTemplate.boardId = board.id

        await mutator.insertBlock(
            cardTemplate.boardId,
            cardTemplate,
            'add card template',
            async (newBlock: Block) => {
                const newTemplate = createCard(newBlock)
                TelemetryClient.trackEvent(TelemetryCategory, TelemetryActions.CreateCardTemplate, {board: board.id, view: activeView?.id, card: newTemplate.id})
                dispatch(addTemplateAction(newTemplate))
                showCard(newTemplate.id)
            }, async () => {
                showCard(undefined)
            },
        )
    }, [props.board, props.activeView, showCard])

    const editCardTemplate = useCallback((cardTemplateId: string) => {
        showCard(cardTemplateId)
    }, [showCard])

    const cardClicked = useCallback((e: React.MouseEvent, card: Card): void => {
        const {activeView, cards} = props

        if (e.shiftKey) {
            let newSelectedCardIds = [...selectedCardIds]
            if (newSelectedCardIds.length > 0 && (e.metaKey || e.ctrlKey)) {
                // Cmd+Shift+Click: Extend the selection
                const orderedCardIds = cards.map((o) => o.id)
                const lastCardId = newSelectedCardIds[newSelectedCardIds.length - 1]
                const srcIndex = orderedCardIds.indexOf(lastCardId)
                const destIndex = orderedCardIds.indexOf(card.id)
                const newCardIds = (srcIndex < destIndex) ? orderedCardIds.slice(srcIndex, destIndex + 1) : orderedCardIds.slice(destIndex, srcIndex + 1)
                for (const newCardId of newCardIds) {
                    if (!newSelectedCardIds.includes(newCardId)) {
                        newSelectedCardIds.push(newCardId)
                    }
                }
                setSelectedCardIds(newSelectedCardIds)
            } else {
                // Shift+Click: add to selection
                if (newSelectedCardIds.includes(card.id)) {
                    newSelectedCardIds = selectedCardIds.filter((o) => o !== card.id)
                } else {
                    newSelectedCardIds.push(card.id)
                }
                setSelectedCardIds(newSelectedCardIds)
            }
        } else if (activeView?.fields.viewType === 'board' || activeView?.fields.viewType === 'gallery') {
            showCard(card.id)
        }

        e.stopPropagation()
    }, [selectedCardIds, props.activeView, props.cards, showCard])

    const hiddenCardCountNotifyHandler = useCallback((show: boolean) => {
        setShowHiddenCardCountNotification(show)
    }, [showHiddenCardCountNotification])

    const showShareButton = !props.readonly && me?.id !== 'single-user'
    const showShareLoginButton = props.readonly && me?.id !== 'single-user'

    const {groupByProperty, activeView, activePage, board, views, cards} = props

    const {visible: visibleGroups, hidden: hiddenGroups} = useMemo(
        () => getVisibleAndHiddenGroups(cards, activeView?.fields.visibleOptionIds || [], activeView?.fields.hiddenOptionIds || [], groupByProperty),
        [cards, activeView?.fields.visibleOptionIds, activeView?.fields.hiddenOptionIds, groupByProperty],
    )

    const pageBlocks = useMemo(() => {
        return currentPageContents.flatMap((value: Block | Block[]): BlockData<any> => {
            const v: Block = Array.isArray(value) ? value[0] : value

            let data: any = v?.title
            if (v?.type === 'image') {
                data = {
                    file: v?.fields.fileId,
                }
            }

            if (v?.type === 'attachment') {
                data = {
                    file: v?.fields.fileId,
                    filename: v?.fields.filename,
                }
            }

            if (v?.type === 'video') {
                data = {
                    file: v?.fields.fileId,
                    filename: v?.fields.filename,
                }
            }

            if (v?.type === 'checkbox') {
                data = {
                    value: v?.title,
                    checked: v?.fields.value,
                }
            }

            return {
                id: v?.id,
                value: data,
                contentType: v?.type,
            }
        })
    }, [currentPageContents])

    return (
        <div
            className='BoardComponent'
            onClick={backgroundClicked}
        >
            {props.shownCardId && activeView &&
                <RootPortal>
                    <CardDialog
                        board={board}
                        activeView={activeView}
                        views={views}
                        cards={cards}
                        key={props.shownCardId}
                        cardId={props.shownCardId}
                        onClose={() => showCard(undefined)}
                        showCard={(cardId) => showCard(cardId)}
                        readonly={props.readonly}
                    />
                </RootPortal>}

            <div className='top-head'>
                <TopBar/>
                <div className='mid-head'>
                    <ViewTitle
                        key={board.id + board.title}
                        board={board}
                        readonly={props.readonly}
                    />
                    <div className='shareButtonWrapper'>
                        {showShareButton &&
                        <ShareBoardButton
                            enableSharedBoards={props.clientConfig?.enablePublicSharedBoards || false}
                        />
                        }
                        {showShareLoginButton &&
                            <ShareBoardLoginButton/>
                        }
                        <ShareBoardTourStep/>
                    </div>
                </div>
                <ViewHeader
                    board={props.board}
                    activeView={activeView}
                    activePage={activePage}
                    cards={props.cards}
                    views={props.views}
                    groupByProperty={props.groupByProperty}
                    dateDisplayProperty={props.dateDisplayProperty}
                    addCard={addEmptyCardAndShow}
                    addCardFromTemplate={addCardFromTemplate}
                    addCardTemplate={addCardTemplate}
                    editCardTemplate={editCardTemplate}
                    readonly={props.readonly}
                />
            </div>

            {activePage &&
                <BlocksEditor
                    onBlockCreated={async (block: any, afterBlock: any): Promise<BlockData|null> => {
                        if (block.contentType === 'text' && block.value === '') {
                            return null
                        }
                        let newBlock: Block
                        if (block.contentType === 'checkbox') {
                            newBlock = await addBlockNewEditor(activePage, intl, block.value.value, {value: block.value.checked}, block.contentType, afterBlock?.id, dispatch)
                        } else if (block.contentType === 'image' || block.contentType === 'attachment' || block.contentType === 'video') {
                            const newFileId = await octoClient.uploadFile(activePage.boardId, block.value.file)
                            newBlock = await addBlockNewEditor(activePage, intl, '', {fileId: newFileId, filename: block.value.filename}, block.contentType, afterBlock?.id, dispatch)
                        } else {
                            newBlock = await addBlockNewEditor(activePage, intl, block.value, {}, block.contentType, afterBlock?.id, dispatch)
                        }
                        return {...block, id: newBlock.id}
                    }}
                    onBlockModified={async (block: any): Promise<BlockData<any>|null> => {
                        const originalContentBlock = currentPageContents.flatMap((b) => b).find((b) => b.id === block.id)
                        if (!originalContentBlock) {
                            return null
                        }

                        if (block.contentType === 'text' && block.value === '') {
                            const description = intl.formatMessage({id: 'ContentBlock.DeleteAction', defaultMessage: 'delete'})

                            mutator.deleteBlock(originalContentBlock, description)
                            return null
                        }
                        const newBlock = {
                            ...originalContentBlock,
                            title: block.value,
                        }

                        if (block.contentType === 'checkbox') {
                            newBlock.title = block.value.value
                            newBlock.fields = {...newBlock.fields, value: block.value.checked}
                        }
                        mutator.updateBlock(activePage.boardId, newBlock, originalContentBlock, intl.formatMessage({id: 'ContentBlock.editCardText', defaultMessage: 'edit card content'}))
                        return block
                    }}
                    onBlockMoved={async (block: BlockData, beforeBlock: BlockData|null, afterBlock: BlockData|null): Promise<void> => {
                        if (block.id) {
                            const idx = activePage.fields.contentOrder.indexOf(block.id)
                            let sourceBlockId: string
                            let sourceWhere: 'after'|'before'
                            if (idx === -1) {
                                Utils.logError('Unable to find the block id in the order of the current block')
                                return
                            }
                            if (idx === 0) {
                                sourceBlockId = activePage.fields.contentOrder[1] as string
                                sourceWhere = 'before'
                            } else {
                                sourceBlockId = activePage.fields.contentOrder[idx - 1] as string
                                sourceWhere = 'after'
                            }
                            if (afterBlock && afterBlock.id) {
                                await mutator.moveContentBlock(block.id, afterBlock.id, 'after', sourceBlockId, sourceWhere, intl.formatMessage({id: 'ContentBlock.moveBlock', defaultMessage: 'move card content'}))
                                return
                            }
                            if (beforeBlock && beforeBlock.id) {
                                await mutator.moveContentBlock(block.id, beforeBlock.id, 'before', sourceBlockId, sourceWhere, intl.formatMessage({id: 'ContentBlock.moveBlock', defaultMessage: 'move card content'}))
                            }
                        }
                    }}
                    blocks={pageBlocks}
                />}

            {!activePage && activeView && activeView.fields.viewType === 'board' &&
            <Kanban
                board={props.board}
                activeView={activeView}
                cards={props.cards}
                groupByProperty={props.groupByProperty}
                visibleGroups={visibleGroups}
                hiddenGroups={hiddenGroups}
                selectedCardIds={selectedCardIds}
                readonly={props.readonly}
                onCardClicked={cardClicked}
                addCard={addCard}
                addCardFromTemplate={addCardFromTemplate}
                showCard={showCard}
                hiddenCardsCount={props.hiddenCardsCount}
                showHiddenCardCountNotification={hiddenCardCountNotifyHandler}
            />}
            {!activePage && activeView && activeView.fields.viewType === 'table' &&
                <Table
                    board={props.board}
                    activeView={activeView}
                    cards={props.cards}
                    groupByProperty={props.groupByProperty}
                    views={props.views}
                    visibleGroups={visibleGroups}
                    selectedCardIds={selectedCardIds}
                    readonly={props.readonly}
                    cardIdToFocusOnRender={cardIdToFocusOnRender}
                    showCard={showCard}
                    addCard={addCard}
                    onCardClicked={cardClicked}
                    hiddenCardsCount={props.hiddenCardsCount}
                    showHiddenCardCountNotification={hiddenCardCountNotifyHandler}
                />}
            {!activePage && activeView && activeView.fields.viewType === 'calendar' &&
                <CalendarFullView
                    board={props.board}
                    cards={props.cards}
                    activeView={activeView}
                    readonly={props.readonly}
                    dateDisplayProperty={props.dateDisplayProperty}
                    showCard={showCard}
                    addCard={(properties: Record<string, string>) => {
                        addCard('', true, properties)
                    }}
                />}

            {!activePage && activeView && activeView.fields.viewType === 'gallery' &&
                <Gallery
                    board={props.board}
                    cards={props.cards}
                    activeView={activeView}
                    readonly={props.readonly}
                    onCardClicked={cardClicked}
                    selectedCardIds={selectedCardIds}
                    addCard={(show) => addCard('', show)}
                    hiddenCardsCount={props.hiddenCardsCount}
                    showHiddenCardCountNotification={hiddenCardCountNotifyHandler}
                />}
            <CardLimitNotification
                showHiddenCardNotification={showHiddenCardCountNotification}
                hiddenCardCountNotificationHandler={hiddenCardCountNotifyHandler}
            />
        </div>
    )
}

export default React.memo(CenterPanel)
