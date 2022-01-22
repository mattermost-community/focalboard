// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useCallback} from 'react'

import {FormattedMessage} from 'react-intl'
import {useDragLayer, useDrop} from 'react-dnd'

import {IPropertyOption, IPropertyTemplate, Board, BoardGroup} from '../../blocks/board'
import {createBoardView, BoardView} from '../../blocks/boardView'
import {Card} from '../../blocks/card'
import {Constants} from '../../constants'
import mutator from '../../mutator'
import {Utils} from '../../utils'
import {useAppDispatch} from '../../store/hooks'
import {updateView} from '../../store/views'

import './table.scss'

import TableHeaders from './tableHeaders'
import TableRows from './tableRows'
import TableGroup from './tableGroup'
import CalculationRow from './calculation/calculationRow'

type Props = {
    selectedCardIds: string[]
    board: Board
    cards: Card[]
    activeView: BoardView
    views: BoardView[]
    visibleGroups: BoardGroup[]
    groupByProperty?: IPropertyTemplate
    readonly: boolean
    cardIdToFocusOnRender: string
    showCard: (cardId?: string) => void
    addCard: (groupByOptionId?: string) => Promise<void>
    onCardClicked: (e: React.MouseEvent, card: Card) => void
}

const Table = (props: Props): JSX.Element => {
    const {board, cards, activeView, visibleGroups, groupByProperty, views} = props
    const isManualSort = activeView.fields.sortOptions?.length === 0
    const dispatch = useAppDispatch()

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

    const columnRefs: Map<string, React.RefObject<HTMLDivElement>> = new Map()

    const [, drop] = useDrop(() => ({
        accept: 'horizontalGrip',
        drop: async (item: { id: string }, monitor) => {
            const columnWidths = {...activeView.fields.columnWidths}
            const finalOffset = monitor.getDifferenceFromInitialOffset()?.x || 0
            const newWidth = Math.max(Constants.minColumnWidth, (columnWidths[item.id] || 0) + (finalOffset || 0))
            if (newWidth !== columnWidths[item.id]) {
                columnWidths[item.id] = newWidth

                const newView = createBoardView(activeView)
                newView.fields.columnWidths = columnWidths
                try {
                    dispatch(updateView(newView))
                    await mutator.updateBlock(newView, activeView, 'resize column')
                } catch {
                    dispatch(updateView(activeView))
                }
            }
        },
    }), [activeView])

    const hideGroup = useCallback((groupById: string): void => {
        const index: number = activeView.fields.collapsedOptionIds.indexOf(groupById)
        const newValue: string[] = [...activeView.fields.collapsedOptionIds]
        if (index > -1) {
            newValue.splice(index, 1)
        } else if (groupById !== '') {
            newValue.push(groupById)
        }

        const newView = createBoardView(activeView)
        newView.fields.collapsedOptionIds = newValue
        mutator.performAsUndoGroup(async () => {
            await mutator.updateBlock(newView, activeView, 'hide group')
        })
    }, [activeView])

    const onDropToGroupHeader = useCallback(async (option: IPropertyOption, dstOption?: IPropertyOption) => {
        if (dstOption) {
            Utils.log(`ondrop. Header target: ${dstOption.value}, source: ${option?.value}`)

            // Move option to new index
            const visibleOptionIds = visibleGroups.map((o) => o.option.id)
            const srcIndex = visibleOptionIds.indexOf(dstOption.id)
            const destIndex = visibleOptionIds.indexOf(option.id)

            visibleOptionIds.splice(srcIndex, 0, visibleOptionIds.splice(destIndex, 1)[0])
            Utils.log(`ondrop. updated visibleoptionids: ${visibleOptionIds}`)

            await mutator.changeViewVisibleOptionIds(activeView.id, activeView.fields.visibleOptionIds, visibleOptionIds)
        }
    }, [activeView, visibleGroups])

    const onDropToCard = useCallback((srcCard: Card, dstCard: Card) => {
        Utils.log(`onDropToCard: ${dstCard.title}`)
        onDropToGroup(srcCard, dstCard.fields.properties[activeView.fields.groupById!] as string, dstCard.id)
    }, [activeView])

    const onDropToGroup = useCallback((srcCard: Card, groupID: string, dstCardID: string) => {
        Utils.log(`onDropToGroup: ${srcCard.title}`)
        const {selectedCardIds} = props

        const draggedCardIds = Array.from(new Set(selectedCardIds).add(srcCard.id))
        const description = draggedCardIds.length > 1 ? `drag ${draggedCardIds.length} cards` : 'drag card'

        if (activeView.fields.groupById !== undefined) {
            const cardsById: { [key: string]: Card } = cards.reduce((acc: { [key: string]: Card }, card: Card): { [key: string]: Card } => {
                acc[card.id] = card
                return acc
            }, {})
            const draggedCards: Card[] = draggedCardIds.map((o: string) => cardsById[o])

            mutator.performAsUndoGroup(async () => {
                // Update properties of dragged cards
                const awaits = []
                for (const draggedCard of draggedCards) {
                    Utils.log(`draggedCard: ${draggedCard.title}, column: ${draggedCard.fields.properties}`)
                    Utils.log(`droppedColumn:  ${groupID}`)
                    const oldOptionId = draggedCard.fields.properties[groupByProperty!.id]
                    Utils.log(`ondrop. oldValue: ${oldOptionId}`)

                    if (groupID !== oldOptionId) {
                        awaits.push(mutator.changePropertyValue(draggedCard, groupByProperty!.id, groupID, description))
                    }
                }
                await Promise.all(awaits)
            })
        }

        // Update dstCard order
        if (isManualSort) {
            let cardOrder = Array.from(new Set([...activeView.fields.cardOrder, ...cards.map((o) => o.id)]))
            if (dstCardID) {
                const isDraggingDown = cardOrder.indexOf(srcCard.id) <= cardOrder.indexOf(dstCardID)
                cardOrder = cardOrder.filter((id) => !draggedCardIds.includes(id))
                let destIndex = cardOrder.indexOf(dstCardID)
                if (isDraggingDown) {
                    destIndex += 1
                }
                cardOrder.splice(destIndex, 0, ...draggedCardIds)
            } else {
                // Find index of first group item
                const firstCard = cards.find((card) => card.fields.properties[activeView.fields.groupById!] === groupID)
                if (firstCard) {
                    const destIndex = cardOrder.indexOf(firstCard.id)
                    cardOrder.splice(destIndex, 0, ...draggedCardIds)
                } else {
                    // if not found, this is the only item in group.
                    return
                }
            }

            mutator.performAsUndoGroup(async () => {
                await mutator.changeViewCardOrder(activeView, cardOrder, description)
            })
        }
    }, [activeView, cards, props.selectedCardIds, groupByProperty])

    const propertyNameChanged = useCallback(async (option: IPropertyOption, text: string): Promise<void> => {
        await mutator.changePropertyOptionValue(board, groupByProperty!, option, text)
    }, [board, groupByProperty])

    return (
        <div
            className='Table'
            ref={drop}
        >
            <div className='octo-table-body'>
                <TableHeaders
                    board={board}
                    cards={cards}
                    activeView={activeView}
                    views={views}
                    offset={offset}
                    resizingColumn={resizingColumn}
                    columnRefs={columnRefs}
                    readonly={props.readonly}
                />

                {/* Table rows */}
                <div className='table-row-container'>
                    {activeView.fields.groupById &&
                    visibleGroups.map((group) => {
                        return (
                            <TableGroup
                                key={group.option.id}
                                board={board}
                                activeView={activeView}
                                groupByProperty={groupByProperty}
                                group={group}
                                readonly={props.readonly}
                                columnRefs={columnRefs}
                                selectedCardIds={props.selectedCardIds}
                                cardIdToFocusOnRender={props.cardIdToFocusOnRender}
                                hideGroup={hideGroup}
                                addCard={props.addCard}
                                showCard={props.showCard}
                                propertyNameChanged={propertyNameChanged}
                                onCardClicked={props.onCardClicked}
                                onDropToGroupHeader={onDropToGroupHeader}
                                onDropToCard={onDropToCard}
                                onDropToGroup={onDropToGroup}
                            />)
                    })
                    }

                    {/* No Grouping, Rows, one per card */}
                    {!activeView.fields.groupById &&
                    <TableRows
                        board={board}
                        activeView={activeView}
                        columnRefs={columnRefs}
                        cards={cards}
                        selectedCardIds={props.selectedCardIds}
                        readonly={props.readonly}
                        cardIdToFocusOnRender={props.cardIdToFocusOnRender}
                        showCard={props.showCard}
                        addCard={props.addCard}
                        onCardClicked={props.onCardClicked}
                        onDrop={onDropToCard}
                    />
                    }
                </div>

                {/* Add New row */}
                <div className='octo-table-footer'>
                    {!props.readonly && !activeView.fields.groupById &&
                    <div
                        className='octo-table-cell'
                        onClick={() => {
                            props.addCard('')
                        }}
                    >
                        <FormattedMessage
                            id='TableComponent.plus-new'
                            defaultMessage='+ New'
                        />
                    </div>
                    }
                </div>

                <CalculationRow
                    board={board}
                    cards={cards}
                    activeView={activeView}
                    resizingColumn={resizingColumn}
                    offset={offset}
                    readonly={props.readonly}
                />
            </div>
        </div>
    )
}

export default Table
