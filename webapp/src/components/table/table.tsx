// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useCallback} from 'react'

import {FormattedMessage, useIntl} from 'react-intl'
import {useDragLayer, useDrop} from 'react-dnd'

import {IPropertyOption, IPropertyTemplate, Board, BoardGroup} from '../../blocks/board'
import {createBoardView, BoardView, ISortOption} from '../../blocks/boardView'
import {Card} from '../../blocks/card'
import {Constants} from '../../constants'
import mutator from '../../mutator'
import {Utils} from '../../utils'
import {useAppDispatch} from '../../store/hooks'
import {updateView} from '../../store/views'

import {OctoUtils} from '../../octoUtils'

import './table.scss'

import TableHeader from './tableHeader'
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
    const intl = useIntl()
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

    const onAutoSizeColumn = useCallback((columnID: string, headerWidth: number) => {
        let longestSize = headerWidth
        const visibleProperties = board.fields.cardProperties.filter(() => activeView.fields.visiblePropertyIds.includes(columnID)) || []
        const columnRef = columnRefs.get(columnID)
        if (!columnRef?.current) {
            return
        }

        let template: IPropertyTemplate | undefined
        const columnFontPadding = Utils.getFontAndPaddingFromCell(columnRef.current)
        let perItemPadding = 0
        if (columnID !== Constants.titleColumnId) {
            template = visibleProperties.find((t: IPropertyTemplate) => t.id === columnID)
            if (!template) {
                return
            }
            if (template.type === 'multiSelect') {
                // For multiselect, the padding calculated above depends on the number selected when calculating the padding.
                // Need to calculate it manually here.
                // DOM Object hierarchy should be {cell -> property -> [value1, value2, etc]}
                let valueCount = 0
                if (columnRef?.current?.childElementCount > 0) {
                    const propertyElement = columnRef.current.children.item(0) as Element
                    if (propertyElement) {
                        valueCount = propertyElement.childElementCount
                        if (valueCount > 0) {
                            const statusPadding = Utils.getFontAndPaddingFromChildren(propertyElement.children, 0)
                            perItemPadding = statusPadding.padding / valueCount
                        }
                    }
                }

                // remove the "value" portion of the original calculation
                columnFontPadding.padding -= (perItemPadding * valueCount)
            }
        }

        cards.forEach((card) => {
            let thisLen = 0
            if (columnID === Constants.titleColumnId) {
                thisLen = Utils.getTextWidth(card.title, columnFontPadding.fontDescriptor) + columnFontPadding.padding
            } else if (template) {
                const displayValue = (OctoUtils.propertyDisplayValue(card, card.fields.properties[columnID], template as IPropertyTemplate, intl) || '')
                switch (template.type) {
                case 'select': {
                    thisLen = Utils.getTextWidth(displayValue.toString().toUpperCase(), columnFontPadding.fontDescriptor)
                    break
                }
                case 'multiSelect': {
                    if (displayValue) {
                        const displayValues = displayValue as string[]
                        displayValues.forEach((value) => {
                            thisLen += Utils.getTextWidth(value.toUpperCase(), columnFontPadding.fontDescriptor) + perItemPadding
                        })
                    }
                    break
                }
                default: {
                    thisLen = Utils.getTextWidth(displayValue.toString(), columnFontPadding.fontDescriptor)
                    break
                }
                }
                thisLen += columnFontPadding.padding
            }
            if (thisLen > longestSize) {
                longestSize = thisLen
            }
        })

        const columnWidths = {...activeView.fields.columnWidths}
        columnWidths[columnID] = longestSize
        const newView = createBoardView(activeView)
        newView.fields.columnWidths = columnWidths
        mutator.updateBlock(newView, activeView, 'autosize column')
    }, [activeView, board, cards])

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

    const onDropToColumn = useCallback(async (template: IPropertyTemplate, container: IPropertyTemplate) => {
        Utils.log(`ondrop. Source column: ${template.name}, dest column: ${container.name}`)

        // Move template to new index
        const destIndex = container ? board.fields.cardProperties.indexOf(container) : 0
        await mutator.changePropertyTemplateOrder(board, template, destIndex >= 0 ? destIndex : 0)
    }, [board])

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

    const titleSortOption = activeView.fields.sortOptions?.find((o) => o.propertyId === Constants.titleColumnId)
    let titleSorted: 'up' | 'down' | 'none' = 'none'
    if (titleSortOption) {
        titleSorted = titleSortOption.reversed ? 'down' : 'up'
    }

    return (
        <div
            className='octo-table-body Table'
            ref={drop}
        >
            {/* Headers */}

            <div
                className='octo-table-header'
                id='mainBoardHeader'
            >
                <TableHeader
                    name={
                        <FormattedMessage
                            id='TableComponent.name'
                            defaultMessage='Name'
                        />
                    }
                    sorted={titleSorted}
                    readonly={props.readonly}
                    board={board}
                    activeView={activeView}
                    cards={cards}
                    views={views}
                    template={{id: Constants.titleColumnId, name: 'title', type: 'text', options: []}}
                    offset={resizingColumn === Constants.titleColumnId ? offset : 0}
                    onDrop={onDropToColumn}
                    onAutoSizeColumn={onAutoSizeColumn}
                />

                {/* Table header row */}

                {board.fields.cardProperties.filter((template: IPropertyTemplate) => activeView.fields.visiblePropertyIds.includes(template.id)).map((template: IPropertyTemplate) => {
                    let sorted: 'up' | 'down' | 'none' = 'none'
                    const sortOption = activeView.fields.sortOptions.find((o: ISortOption) => o.propertyId === template.id)
                    if (sortOption) {
                        sorted = sortOption.reversed ? 'down' : 'up'
                    }

                    return (
                        <TableHeader
                            name={template.name}
                            sorted={sorted}
                            readonly={props.readonly}
                            board={board}
                            activeView={activeView}
                            cards={cards}
                            views={views}
                            template={template}
                            key={template.id}
                            offset={resizingColumn === template.id ? offset : 0}
                            onDrop={onDropToColumn}
                            onAutoSizeColumn={onAutoSizeColumn}
                        />
                    )
                })}
            </div>

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
            />
        </div>
    )
}

export default Table
