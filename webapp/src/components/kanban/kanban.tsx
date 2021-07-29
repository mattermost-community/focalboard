// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
/* eslint-disable max-lines */
import React, {useRef, useState} from 'react'
import {FormattedMessage, injectIntl, IntlShape} from 'react-intl'

import {IPropertyOption} from '../../blocks/board'
import {Card} from '../../blocks/card'
import mutator from '../../mutator'
import {Utils} from '../../utils'
import {BoardTree} from '../../viewModel/boardTree'
import Button from '../../widgets/buttons/button'

import {CardTree, MutableCardTree} from '../../viewModel/cardTree'

import useCardListener from '../../hooks/cardListener'

import KanbanCard from './kanbanCard'
import KanbanColumn from './kanbanColumn'
import KanbanColumnHeader from './kanbanColumnHeader'
import KanbanHiddenColumnItem from './kanbanHiddenColumnItem'

import './kanban.scss'

type Props = {
    boardTree: BoardTree
    selectedCardIds: string[]
    intl: IntlShape
    readonly: boolean
    onCardClicked: (e: React.MouseEvent, card: Card) => void
    addCard: (groupByOptionId?: string, show?:boolean) => Promise<void>
    showCard: (cardId?: string) => void
}

const Kanban = (props: Props) => {
    const {boardTree} = props
    const {cards, groupByProperty} = boardTree

    if (!groupByProperty) {
        Utils.assertFailure('Board views must have groupByProperty set')
        return <div/>
    }

    const propertyValues = groupByProperty.options || []
    Utils.log(`${propertyValues.length} propertyValues`)

    const {board, activeView, visibleGroups, hiddenGroups} = boardTree
    const visiblePropertyTemplates = board.cardProperties.filter((template) => activeView.visiblePropertyIds.includes(template.id))
    const isManualSort = activeView.sortOptions.length === 0

    const [cardTrees, setCardTrees] = useState<{[key: string]: CardTree | undefined}>({})
    const cardTreeRef = useRef<{[key: string]: CardTree | undefined}>()
    cardTreeRef.current = cardTrees

    useCardListener(
        async (blocks) => {
            for (const block of blocks) {
                const cardTree = cardTreeRef.current && cardTreeRef.current[block.parentId]
                // eslint-disable-next-line no-await-in-loop
                const newCardTree = cardTree ? MutableCardTree.incrementalUpdate(cardTree, blocks) : await MutableCardTree.sync(block.parentId)
                setCardTrees((oldTree) => ({...oldTree, [block.parentId]: newCardTree}))
            }
        },
        async () => {
            cards.forEach(async (c) => {
                const newCardTree = await MutableCardTree.sync(c.id)
                setCardTrees((oldTree) => ({...oldTree, [c.id]: newCardTree}))
            })
        },
    )

    const propertyNameChanged = async (option: IPropertyOption, text: string): Promise<void> => {
        await mutator.changePropertyOptionValue(boardTree, boardTree.groupByProperty!, option, text)
    }

    const addGroupClicked = async () => {
        Utils.log('onAddGroupClicked')

        const option: IPropertyOption = {
            id: Utils.createGuid(),
            value: 'New group',
            color: 'propColorDefault',
        }

        await mutator.insertPropertyOption(boardTree, boardTree.groupByProperty!, option, 'add group')
    }

    const orderAfterMoveToColumn = (cardIds: string[], columnId?: string): string[] => {
        let cardOrder = activeView.cardOrder.slice()
        const columnGroup = boardTree.visibleGroups.find((g) => g.option.id === columnId)
        const columnCards = columnGroup?.cards
        if (!columnCards || columnCards.length === 0) {
            return cardOrder
        }
        const lastCardId = columnCards[columnCards.length - 1].id
        const setOfIds = new Set(cardIds)
        cardOrder = cardOrder.filter((id) => !setOfIds.has(id))
        const lastCardIndex = cardOrder.indexOf(lastCardId)
        cardOrder.splice(lastCardIndex + 1, 0, ...cardIds)
        return cardOrder
    }

    const onDropToColumn = async (option: IPropertyOption, card?: Card, dstOption?: IPropertyOption) => {
        const {selectedCardIds} = props
        const optionId = option ? option.id : undefined

        let draggedCardIds = selectedCardIds
        if (card) {
            draggedCardIds = Array.from(new Set(selectedCardIds).add(card.id))
        }

        Utils.assertValue(boardTree)

        if (draggedCardIds.length > 0) {
            const orderedCards = boardTree.orderedCards()
            const cardsById: { [key: string]: Card } = orderedCards.reduce((acc: { [key: string]: Card }, c: Card): { [key: string]: Card } => {
                acc[c.id] = c
                return acc
            }, {})
            const draggedCards: Card[] = draggedCardIds.map((o: string) => cardsById[o])
            await mutator.performAsUndoGroup(async () => {
                const description = draggedCards.length > 1 ? `drag ${draggedCards.length} cards` : 'drag card'
                const awaits = []
                for (const draggedCard of draggedCards) {
                    Utils.log(`ondrop. Card: ${draggedCard.title}, column: ${optionId}`)
                    const oldValue = draggedCard.properties[boardTree.groupByProperty!.id]
                    if (optionId !== oldValue) {
                        awaits.push(mutator.changePropertyValue(draggedCard, boardTree.groupByProperty!.id, optionId, description))
                    }
                }
                const newOrder = orderAfterMoveToColumn(draggedCardIds, optionId)
                awaits.push(mutator.changeViewCardOrder(boardTree.activeView, newOrder, description))
                await Promise.all(awaits)
            })
        } else if (dstOption) {
            Utils.log(`ondrop. Header option: ${dstOption.value}, column: ${option?.value}`)

            // Move option to new index
            const visibleOptionIds = boardTree.visibleGroups.map((o) => o.option.id)

            const srcIndex = visibleOptionIds.indexOf(dstOption.id)
            const destIndex = visibleOptionIds.indexOf(option.id)

            visibleOptionIds[srcIndex] = option.id
            visibleOptionIds[destIndex] = dstOption.id

            await mutator.changeViewVisibleOptionIds(activeView, visibleOptionIds)
        }
    }

    const onDropToCard = async (srcCard: Card, dstCard: Card) => {
        Utils.log(`onDropToCard: ${dstCard.title}`)
        const {selectedCardIds} = props
        const optionId = dstCard.properties[activeView.groupById!]

        const draggedCardIds = Array.from(new Set(selectedCardIds).add(srcCard.id))

        const description = draggedCardIds.length > 1 ? `drag ${draggedCardIds.length} cards` : 'drag card'

        // Update dstCard order
        const orderedCards = boardTree.orderedCards()
        const cardsById: { [key: string]: Card } = orderedCards.reduce((acc: { [key: string]: Card }, card: Card): { [key: string]: Card } => {
            acc[card.id] = card
            return acc
        }, {})
        const draggedCards: Card[] = draggedCardIds.map((o: string) => cardsById[o])
        let cardOrder = orderedCards.map((o) => o.id)
        const isDraggingDown = cardOrder.indexOf(srcCard.id) <= cardOrder.indexOf(dstCard.id)
        cardOrder = cardOrder.filter((id) => !draggedCardIds.includes(id))
        let destIndex = cardOrder.indexOf(dstCard.id)
        if (srcCard.properties[boardTree.groupByProperty!.id] === optionId && isDraggingDown) {
            // If the cards are in the same column and dragging down, drop after the target dstCard
            destIndex += 1
        }
        cardOrder.splice(destIndex, 0, ...draggedCardIds)

        await mutator.performAsUndoGroup(async () => {
            // Update properties of dragged cards
            const awaits = []
            for (const draggedCard of draggedCards) {
                Utils.log(`draggedCard: ${draggedCard.title}, column: ${optionId}`)
                const oldOptionId = draggedCard.properties[boardTree.groupByProperty!.id]
                if (optionId !== oldOptionId) {
                    awaits.push(mutator.changePropertyValue(draggedCard, boardTree.groupByProperty!.id, optionId, description))
                }
            }
            await Promise.all(awaits)
            await mutator.changeViewCardOrder(activeView, cardOrder, description)
        })
    }

    return (
        <div className='Kanban'>
            <div
                className='octo-board-header'
                id='mainBoardHeader'
            >
                {/* Column headers */}

                {visibleGroups.map((group) => (
                    <KanbanColumnHeader
                        key={group.option.id}
                        group={group}
                        boardTree={boardTree}
                        intl={props.intl}
                        addCard={props.addCard}
                        readonly={props.readonly}
                        propertyNameChanged={propertyNameChanged}
                        onDropToColumn={onDropToColumn}
                    />
                ))}

                {/* Hidden column header */}

                {hiddenGroups.length > 0 &&
                    <div className='octo-board-header-cell narrow'>
                        <FormattedMessage
                            id='BoardComponent.hidden-columns'
                            defaultMessage='Hidden columns'
                        />
                    </div>
                }

                {!props.readonly &&
                    <div className='octo-board-header-cell narrow'>
                        <Button
                            onClick={addGroupClicked}
                        >
                            <FormattedMessage
                                id='BoardComponent.add-a-group'
                                defaultMessage='+ Add a group'
                            />
                        </Button>
                    </div>
                }
            </div>

            {/* Main content */}

            <div
                className='octo-board-body'
                id='mainBoardBody'
            >
                {/* Columns */}

                {visibleGroups.map((group) => (
                    <KanbanColumn
                        key={group.option.id || 'empty'}
                        onDrop={(card: Card) => onDropToColumn(group.option, card)}
                    >
                        {group.cards.map((card) => (
                            <KanbanCard
                                card={card}
                                cardTree={cardTrees[card.id]}
                                visiblePropertyTemplates={visiblePropertyTemplates}
                                key={card.id}
                                readonly={props.readonly}
                                isSelected={props.selectedCardIds.includes(card.id)}
                                onClick={(e) => {
                                    props.onCardClicked(e, card)
                                }}
                                onDrop={onDropToCard}
                                showCard={props.showCard}
                                isManualSort={isManualSort}
                            />
                        ))}
                        {!props.readonly &&
                        <Button
                            onClick={() => {
                                props.addCard(group.option.id, true)
                            }}
                        >
                            <FormattedMessage
                                id='BoardComponent.new'
                                defaultMessage='+ New'
                            />
                        </Button>
                        }
                    </KanbanColumn>
                ))}

                {/* Hidden columns */}

                {hiddenGroups.length > 0 &&
                <div className='octo-board-column narrow'>
                    {hiddenGroups.map((group) => (
                        <KanbanHiddenColumnItem
                            key={group.option.id}
                            group={group}
                            boardTree={boardTree}
                            intl={props.intl}
                            readonly={props.readonly}
                            onDrop={(card: Card) => onDropToColumn(group.option, card)}
                        />
                    ))}
                </div>}
            </div>
        </div>
    )
}

export default injectIntl(Kanban)
