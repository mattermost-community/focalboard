// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {IntlShape} from 'react-intl'
import {useDragLayer} from 'react-dnd'

import {Card} from '../../blocks/card'
import mutator from '../../mutator'
import {Utils} from '../../utils'

import {BoardTree} from '../../viewModel/boardTree'

import './table.scss'
import TableRow from './tableRow'

type Props = {
    boardTree: BoardTree
    columnRefs: Map<string, React.RefObject<HTMLDivElement>>
    cards: readonly Card[]
    selectedCardIds: string[]
    readonly: boolean
    cardIdToFocusOnRender: string
    intl: IntlShape
    showCard: (cardId?: string) => void
    addCard: (groupByOptionId?: string) => Promise<void>
    onCardClicked: (e: React.MouseEvent, card: Card) => void
}

const TableRows = (props: Props) => {
    const {boardTree, cards} = props
    const {activeView} = boardTree
    const isManualSort = activeView.sortOptions.length < 1

    const {offset, resizingColumn} = useDragLayer((monitor) => {
        if (monitor.getItemType() === 'horizontalGrip') {
            return {
                offset: monitor.getDifferenceFromInitialOffset()?.x || 0,
                resizingColumn: monitor.getItem()?.id,
            }
        }
        return {
            offset: 0,
            resizingColumn: '',
        }
    })

    const onDropToCard = (srcCard: Card, dstCard: Card) => {
        Utils.log(`onDropToCard: ${dstCard.title}`)
        const {selectedCardIds} = props

        const draggedCardIds = Array.from(new Set(selectedCardIds).add(srcCard.id))
        const description = draggedCardIds.length > 1 ? `drag ${draggedCardIds.length} cards` : 'drag card'

        if (activeView.groupById !== undefined) {
            const optionId = dstCard.properties[activeView.groupById!]
            const orderedCards = boardTree.orderedCards()
            const cardsById: {[key: string]: Card} = orderedCards.reduce((acc: {[key: string]: Card}, card: Card): {[key: string]: Card} => {
                acc[card.id] = card
                return acc
            }, {})
            const draggedCards: Card[] = draggedCardIds.map((o: string) => cardsById[o])

            mutator.performAsUndoGroup(async () => {
                // Update properties of dragged cards
                const awaits = []
                for (const draggedCard of draggedCards) {
                    Utils.log(`draggedCard: ${draggedCard.title}, column: ${optionId}`)
                    const oldOptionId = draggedCard.properties[boardTree.groupByProperty!.id]
                    Utils.log(`ondrop. oldValue: ${oldOptionId}`)

                    if (optionId !== oldOptionId) {
                        awaits.push(mutator.changePropertyValue(draggedCard, boardTree.groupByProperty!.id, optionId, description))
                    }
                }
                await Promise.all(awaits)
            })
        }

        // Update dstCard order
        if (isManualSort) {
            let cardOrder = Array.from(new Set([...activeView.cardOrder, ...boardTree.cards.map((o) => o.id)]))
            const isDraggingDown = cardOrder.indexOf(srcCard.id) <= cardOrder.indexOf(dstCard.id)
            cardOrder = cardOrder.filter((id) => !draggedCardIds.includes(id))
            let destIndex = cardOrder.indexOf(dstCard.id)
            if (isDraggingDown) {
                destIndex += 1
            }
            cardOrder.splice(destIndex, 0, ...draggedCardIds)

            mutator.performAsUndoGroup(async () => {
                await mutator.changeViewCardOrder(activeView, cardOrder, description)
            })
        }
    }

    return (
        <div>
            {cards.map((card) => {
                const tableRow = (
                    <TableRow
                        key={card.id + card.updateAt}
                        boardTree={boardTree}
                        card={card}
                        isSelected={props.selectedCardIds.includes(card.id)}
                        focusOnMount={props.cardIdToFocusOnRender === card.id}
                        onSaveWithEnter={() => {
                            if (cards.length > 0 && cards[cards.length - 1] === card) {
                                props.addCard(activeView.groupById ? card.properties[activeView.groupById!] : '')
                            }
                        }}
                        onClick={(e: React.MouseEvent<HTMLDivElement>) => {
                            props.onCardClicked(e, card)
                        }}
                        showCard={props.showCard}
                        readonly={props.readonly}
                        onDrop={onDropToCard}
                        offset={offset}
                        resizingColumn={resizingColumn}
                        columnRefs={props.columnRefs}
                    />)

                return tableRow
            })}
        </div>
    )
}

export default TableRows
