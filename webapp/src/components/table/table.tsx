// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import {FormattedMessage, IntlShape} from 'react-intl'
import {useDrop, useDragLayer} from 'react-dnd'

import {IPropertyOption, IPropertyTemplate} from '../../blocks/board'
import {MutableBoardView} from '../../blocks/boardView'
import {Card} from '../../blocks/card'
import {Constants} from '../../constants'
import mutator from '../../mutator'
import {Utils} from '../../utils'

import {BoardTree} from '../../viewModel/boardTree'

import {OctoUtils} from './../../octoUtils'

import './table.scss'
import TableHeader from './tableHeader'
import TableRows from './tableRows'
import TableGroup from './tableGroup'

type Props = {
    boardTree: BoardTree
    selectedCardIds: string[]
    readonly: boolean
    cardIdToFocusOnRender: string
    intl: IntlShape
    showCard: (cardId?: string) => void
    addCard: (groupByOptionId?: string) => Promise<void>
    onCardClicked: (e: React.MouseEvent, card: Card) => void
}

const Table = (props: Props) => {
    const {boardTree} = props
    const {board, cards, activeView, visibleGroups} = boardTree

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
        drop: (item: {id: string}, monitor) => {
            const columnWidths = {...activeView.columnWidths}
            const finalOffset = monitor.getDifferenceFromInitialOffset()?.x || 0
            const newWidth = Math.max(Constants.minColumnWidth, (columnWidths[item.id] || 0) + (finalOffset || 0))
            if (newWidth !== columnWidths[item.id]) {
                columnWidths[item.id] = newWidth

                const newView = new MutableBoardView(activeView)
                newView.columnWidths = columnWidths
                mutator.updateBlock(newView, activeView, 'resize column')
            }
        },
    }), [activeView])

    const onAutoSizeColumn = ((columnID: string, headerWidth: number) => {
        let longestSize = headerWidth
        const visibleProperties = board.cardProperties.filter(() => activeView.visiblePropertyIds.includes(columnID))
        const columnRef = columnRefs.get(columnID)
        if (!columnRef?.current) {
            return
        }
        const {fontDescriptor, padding} = Utils.getFontAndPaddingFromCell(columnRef.current)

        cards.forEach((card) => {
            let displayValue = card.title
            if (columnID !== Constants.titleColumnId) {
                const template = visibleProperties.find((t) => t.id === columnID)
                if (!template) {
                    return
                }

                displayValue = OctoUtils.propertyDisplayValue(card, card.properties[columnID], template, props.intl) || ''
                if (template.type === 'select') {
                    displayValue = displayValue.toUpperCase()
                }
            }
            const thisLen = Utils.getTextWidth(displayValue, fontDescriptor) + padding
            if (thisLen > longestSize) {
                longestSize = thisLen
            }
        })

        const columnWidths = {...activeView.columnWidths}
        columnWidths[columnID] = longestSize
        const newView = new MutableBoardView(activeView)
        newView.columnWidths = columnWidths
        mutator.updateBlock(newView, activeView, 'autosize column')
    })

    const hideGroup = (groupById: string): void => {
        const index : number = activeView.collapsedOptionIds.indexOf(groupById)
        const newValue : string[] = [...activeView.collapsedOptionIds]
        if (index > -1) {
            newValue.splice(index, 1)
        } else if (groupById !== '') {
            newValue.push(groupById)
        }

        const newView = new MutableBoardView(activeView)
        newView.collapsedOptionIds = newValue
        mutator.performAsUndoGroup(async () => {
            await mutator.updateBlock(newView, activeView, 'hide group')
        })
    }

    const onDropToColumn = async (template: IPropertyTemplate, container: IPropertyTemplate) => {
        Utils.log(`ondrop. Source column: ${template.name}, dest column: ${container.name}`)

        // Move template to new index
        const destIndex = container ? board.cardProperties.indexOf(container) : 0
        await mutator.changePropertyTemplateOrder(board, template, destIndex >= 0 ? destIndex : 0)
    }

    const onDropToGroupHeader = async (option: IPropertyOption, dstOption?: IPropertyOption) => {
        if (dstOption) {
            Utils.log(`ondrop. Header target: ${dstOption.value}, source: ${option?.value}`)

            // Move option to new index
            const visibleOptionIds = boardTree.visibleGroups.map((o) => o.option.id)
            const srcIndex = visibleOptionIds.indexOf(dstOption.id)
            const destIndex = visibleOptionIds.indexOf(option.id)

            visibleOptionIds.splice(srcIndex, 0, visibleOptionIds.splice(destIndex, 1)[0])
            Utils.log(`ondrop. updated visibleoptionids: ${visibleOptionIds}`)

            await mutator.changeViewVisibleOptionIds(activeView, visibleOptionIds)
        }
    }

    const propertyNameChanged = async (option: IPropertyOption, text: string): Promise<void> => {
        await mutator.changePropertyOptionValue(boardTree, boardTree.groupByProperty!, option, text)
    }

    const titleSortOption = activeView.sortOptions.find((o) => o.propertyId === Constants.titleColumnId)
    let titleSorted: 'up' | 'down' | 'none' = 'none'
    if (titleSortOption) {
        titleSorted = titleSortOption.reversed ? 'up' : 'down'
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
                    boardTree={boardTree}
                    template={{id: Constants.titleColumnId, name: 'title', type: 'text', options: []}}
                    offset={resizingColumn === Constants.titleColumnId ? offset : 0}
                    onDrop={onDropToColumn}
                    onAutoSizeColumn={onAutoSizeColumn}
                />

                {/* Table header row */}

                {board.cardProperties.
                    filter((template) => activeView.visiblePropertyIds.includes(template.id)).
                    map((template) => {
                        let sorted: 'up' | 'down' | 'none' = 'none'
                        const sortOption = activeView.sortOptions.find((o) => o.propertyId === template.id)
                        if (sortOption) {
                            sorted = sortOption.reversed ? 'up' : 'down'
                        }

                        return (
                            <TableHeader
                                name={template.name}
                                sorted={sorted}
                                readonly={props.readonly}
                                boardTree={boardTree}
                                template={template}
                                key={template.id}
                                offset={resizingColumn === template.id ? offset : 0}
                                onDrop={onDropToColumn}
                                onAutoSizeColumn={onAutoSizeColumn}
                            />
                        )
                    })}
            </div>


            {/* Table header row */}
            {activeView.groupById &&
                <div>
                    {visibleGroups.map((group) => {
                        return (
                            <TableGroup
                                key={group.option.id}
                                boardTree={boardTree}
                                group={group}
                                intl={props.intl}
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
                            />)
                    })}
                </div>
            }

            {/* No Grouping, Rows, one per card */}
            {!activeView.groupById &&
                <TableRows
                    boardTree={boardTree}
                    columnRefs={columnRefs}
                    cards={boardTree.cards}
                    selectedCardIds={props.selectedCardIds}
                    readonly={props.readonly}
                    cardIdToFocusOnRender={props.cardIdToFocusOnRender}
                    intl={props.intl}
                    showCard={props.showCard}
                    addCard={props.addCard}
                    onCardClicked={props.onCardClicked}
                />
            }

            {/* Add New row */}
            <div className='octo-table-footer'>
                {!props.readonly && !activeView.groupById &&
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
        </div>
    )
}

export default Table
