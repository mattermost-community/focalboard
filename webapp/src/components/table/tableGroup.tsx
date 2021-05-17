// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {FormattedMessage, IntlShape} from 'react-intl'
import {useDrop, useDragLayer} from 'react-dnd'

import {IPropertyTemplate} from '../../blocks/board'
import {MutableBoardView} from '../../blocks/boardView'
import {Card} from '../../blocks/card'
import mutator from '../../mutator'
import {Utils} from '../../utils'

import {BoardTree} from '../../viewModel/boardTree'

import {OctoUtils} from '../../octoUtils'

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
    addCard: (show: boolean) => Promise<void>
    onCardClicked: (e: React.MouseEvent, card: Card) => void
}

const TableGroup = (props: Props) => {
    const {boardTree, cards} = props
    const {board, activeView, visibleGroups} = boardTree

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


    // const [, drop] = useDrop(() => ({
    //     accept: 'horizontalGrip',
    //     drop: (item: {id: string}, monitor) => {
    //         const columnWidths = {...activeView.columnWidths}
    //         const finalOffset = monitor.getDifferenceFromInitialOffset()?.x || 0
    //         const newWidth = Math.max(Constants.minColumnWidth, (columnWidths[item.id] || 0) + (finalOffset || 0))
    //         if (newWidth !== columnWidths[item.id]) {
    //             columnWidths[item.id] = newWidth

    //             const newView = new MutableBoardView(activeView)
    //             newView.columnWidths = columnWidths
    //             mutator.updateBlock(newView, activeView, 'resize column')
    //         }
    //     },
    // }), [activeView])

    // const onAutoSizeColumn = ((columnID: string, headerWidth: number) => {
    //     let longestSize = headerWidth
    //     const visibleProperties = board.cardProperties.filter(() => activeView.visiblePropertyIds.includes(columnID))
    //     const columnRef = columnRefs.get(columnID)
    //     if (!columnRef?.current) {
    //         return
    //     }
    //     const {fontDescriptor, padding} = Utils.getFontAndPaddingFromCell(columnRef.current)

    //     cards.forEach((card) => {
    //         let displayValue = card.title
    //         if (columnID !== Constants.titleColumnId) {
    //             const template = visibleProperties.find((t) => t.id === columnID)
    //             if (!template) {
    //                 return
    //             }

    //             displayValue = OctoUtils.propertyDisplayValue(card, card.properties[columnID], template, props.intl) || ''
    //             if (template.type === 'select') {
    //                 displayValue = displayValue.toUpperCase()
    //             }
    //         }
    //         const thisLen = Utils.getTextWidth(displayValue, fontDescriptor) + padding
    //         if (thisLen > longestSize) {
    //             longestSize = thisLen
    //         }
    //     })

    //     const columnWidths = {...activeView.columnWidths}
    //     columnWidths[columnID] = longestSize
    //     const newView = new MutableBoardView(activeView)
    //     newView.columnWidths = columnWidths
    //     mutator.updateBlock(newView, activeView, 'autosize column')
    // })

    const onDropToCard = (srcCard: Card, dstCard: Card) => {
        Utils.log(`onDropToCard: ${dstCard.title}`)
        const {selectedCardIds} = props

        const draggedCardIds = Array.from(new Set(selectedCardIds).add(srcCard.id))
        const description = draggedCardIds.length > 1 ? `drag ${draggedCardIds.length} cards` : 'drag card'


        if (activeView.groupById != undefined) {
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
                    if (optionId !== oldOptionId) {
                        awaits.push(mutator.changePropertyValue(draggedCard, boardTree.groupByProperty!.id, optionId, description))
                    }
                }
                await Promise.all(awaits)
                // await mutator.changeViewCardOrder(activeView, cardOrder, description)
            })
        }

        // Update dstCard order
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

    // const onDropToColumn = async (template: IPropertyTemplate, container: IPropertyTemplate) => {
    //     Utils.log(`ondrop. Source column: ${template.name}, dest column: ${container.name}`)

    //     // Move template to new index
    //     const destIndex = container ? board.cardProperties.indexOf(container) : 0
    //     await mutator.changePropertyTemplateOrder(board, template, destIndex >= 0 ? destIndex : 0)
    // }

    // const titleSortOption = activeView.sortOptions.find((o) => o.propertyId === Constants.titleColumnId)
    // let titleSorted: 'up' | 'down' | 'none' = 'none'
    // if (titleSortOption) {
    //     titleSorted = titleSortOption.reversed ? 'up' : 'down'
    // }

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
                                props.addCard(false)
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

export default TableGroup
