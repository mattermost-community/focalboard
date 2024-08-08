// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, { useCallback } from 'react'

import { FormattedMessage } from 'react-intl'
import {
    FixedSizeTree,
    FixedSizeNodeData,
    FixedSizeNodeComponentProps,
} from 'react-vtree';
import { FixedSizeList, ListChildComponentProps } from 'react-window'
import AutoSizer from 'react-virtualized-auto-sizer'

import { IPropertyOption, IPropertyTemplate, Board, BoardGroup } from '../../blocks/board'
import { createBoardView, BoardView } from '../../blocks/boardView'
import { Card } from '../../blocks/card'
import { Constants, Permission } from '../../constants'
import mutator from '../../mutator'
import { Utils } from '../../utils'
import { useAppDispatch } from '../../store/hooks'
import { updateView } from '../../store/views'
import { useHasCurrentBoardPermissions } from '../../hooks/permissions'

import BoardPermissionGate from '../permissions/boardPermissionGate'

import './table.scss'

import HiddenCardCount from '../../components/hiddenCardCount/hiddenCardCount'

import TableHeaders from './tableHeaders'
import TableRows from './tableRows'
import TableRow from './tableRow'
import TableGroupHeaderRow from './tableGroupHeaderRow'
import CalculationRow from './calculation/calculationRow'
import {ColumnResizeProvider} from './tableColumnResizeContext'

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
    hiddenCardsCount: number
    showHiddenCardCountNotification: (show: boolean) => void
}

type TreeData = FixedSizeNodeData &
{
    isCard: boolean;
    isLeaf: boolean;
    node: BoardGroup | Card;
};

type StackElement = {
    nestingLevel: number;
    node: Card | BoardGroup;
    isLastCard: boolean;
    groupId: string;
};

const Table = (props: Props): JSX.Element => {
    const { board, cards, activeView, visibleGroups, groupByProperty, views, hiddenCardsCount } = props
    const isManualSort = activeView.fields.sortOptions?.length === 0
    const canEditBoardProperties = useHasCurrentBoardPermissions([Permission.ManageBoardProperties])
    const canEditCards = useHasCurrentBoardPermissions([Permission.ManageBoardCards])
    const dispatch = useAppDispatch()

    const resizeColumn = useCallback(async (columnId: string, width: number) => {
        const columnWidths = { ...activeView.fields.columnWidths }
        const newWidth = Math.max(Constants.minColumnWidth, width)
        if (newWidth !== columnWidths[columnId]) {
            Utils.log(`Resize of column finished: prev=${columnWidths[columnId]}, new=${newWidth}`)

            columnWidths[columnId] = newWidth

            const newView = createBoardView(activeView)
            newView.fields.columnWidths = columnWidths
            try {
                dispatch(updateView(newView))
                await mutator.updateBlock(board.id, newView, activeView, 'resize column')
            } catch {
                dispatch(updateView(activeView))
            }
        }
    }, [activeView])

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
            await mutator.updateBlock(board.id, newView, activeView, 'hide group')
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

            await mutator.changeViewVisibleOptionIds(board.id, activeView.id, activeView.fields.visibleOptionIds, visibleOptionIds)
        }
    }, [activeView, visibleGroups])

    const onDropToCard = useCallback((srcCard: Card, dstCard: Card) => {
        Utils.log(`onDropToCard: ${dstCard.title}`)
        onDropToGroup(srcCard, dstCard.fields.properties[activeView.fields.groupById!] as string, dstCard.id)
    }, [activeView.fields.groupById, cards])

    const onDropToGroup = useCallback((srcCard: Card, groupID: string, dstCardID: string) => {
        Utils.log(`onDropToGroup: ${srcCard.title}`)
        const { selectedCardIds } = props

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
                        awaits.push(mutator.changePropertyValue(board.id, draggedCard, groupByProperty!.id, groupID, description))
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
                await mutator.changeViewCardOrder(board.id, activeView.id, activeView.fields.cardOrder, cardOrder, description)
            })
        }
    }, [activeView, cards, props.selectedCardIds, groupByProperty])

    const propertyNameChanged = useCallback(async (option: IPropertyOption, text: string): Promise<void> => {
        await mutator.changePropertyOptionValue(board.id, board.cardProperties, groupByProperty!, option, text)
    }, [board, groupByProperty])

    const onClickRow = useCallback((e: React.MouseEvent<HTMLDivElement>, card: Card) => {
        props.onCardClicked(e, card)
    }, [props.onCardClicked])

    const Node = ({data: {node, isCard, isLeaf}, style, toggle, isOpen}: FixedSizeNodeComponentProps<TreeData>) => {
        if (isCard) {
            const card = node as Card;

            return (
                <div
                    style={style}
                >
                    <TableRow
                        key={card.id + card.updateAt}
                        board={board}
                        columnWidths={activeView.fields.columnWidths}
                        isManualSort={activeView.fields.sortOptions.length === 0}
                        groupById={activeView.fields.groupById}
                        visiblePropertyIds={activeView.fields.visiblePropertyIds}
                        collapsedOptionIds={activeView.fields.collapsedOptionIds}
                        card={card}
                        addCard={props.addCard}
                        isSelected={props.selectedCardIds.includes(card.id)}
                        focusOnMount={props.cardIdToFocusOnRender === card.id}
                        isLastCard={isLeaf}
                        onClick={onClickRow}
                        showCard={props.showCard}
                        readonly={props.readonly}
                        onDrop={onDropToCard}
                    />
                </div>
                
            )
        }
        const group = node as BoardGroup;
        return (
            <div
                style={style}
            >
                <TableGroupHeaderRow
                    group={group}
                    board={board}
                    activeView={activeView}
                    groupByProperty={groupByProperty}
                    hideGroup={hideGroup}
                    addCard={props.addCard}
                    readonly={props.readonly}
                    propertyNameChanged={propertyNameChanged}
                    onDrop={onDropToGroupHeader}
                    key={group.option.id}
                    onDropToGroup={onDropToGroup}
                    groupToggle={toggle}
                />
            </div>
        )
    }

    const treeWalker = useCallback(
        function* treeWalker(
            refresh: boolean,
        ): Generator<TreeData | string | symbol, void, boolean> {
            const stack: StackElement[] = [];
    
            for (let i = 0; i < visibleGroups.length; i++) {
                stack.push({
                    nestingLevel: 0,
                    node: visibleGroups[i],
                    groupId: visibleGroups[i].option.id,
                    isLastCard: false,
                });
            }
    
            while (stack.length !== 0) {
                const {node, nestingLevel, isLastCard, groupId} = stack.pop()!;
                let isOpened = null
                let group = null
                let card = null
                const isVisible = activeView.fields.collapsedOptionIds?.indexOf(groupId) === -1
    
                if (nestingLevel === 0) {
                    group = node as BoardGroup
                    const id = group.option.id;
                    isOpened = yield refresh ?
                        {
                            id,
                            isLeaf: group.cards.length === 0,
                            isOpenByDefault: isVisible,
                            node,
                            isCard: false,
                        }
                        : id;
                } else {
                    card = node as Card
                    const id = card.id;
                    isOpened = yield refresh
                        ? {
                            id: card.id+card.updateAt,
                            isCard: true,
                            isOpenByDefault: isVisible,
                            node,
                            isLeaf: isLastCard,
                        }
                        : id;
                }
    
                if (group && group.cards.length !== 0 && isOpened) {
                    for (let i = group.cards.length - 1; i >= 0; i--) {
                        stack.push({
                            nestingLevel: nestingLevel + 1,
                            node: group.cards[i],
                            groupId: group.option.id,
                            isLastCard: i === (group.cards.length - 1)
                        });
                    }
                }
            }
        }
    , [visibleGroups, activeView.fields.collapsedOptionIds])
    

    return (
        <div className='Table'>
            <ColumnResizeProvider
                columnWidths={activeView.fields.columnWidths}
                onResizeColumn={resizeColumn}
            >
                <div className='octo-table-body'>
                    <TableHeaders
                        board={board}
                        cards={cards}
                        activeView={activeView}
                        views={views}
                        readonly={props.readonly || !canEditBoardProperties}
                    />

                    {/* Table rows */}
                    <div className='table-row-container'>
                        {activeView.fields.groupById &&
                            <AutoSizer disableWidth>
                                {({ height }) => (
                                    <FixedSizeTree
                                        height={height}
                                        treeWalker={treeWalker}
                                        itemSize={44}
                                        width={'100%'}
                                    >
                                        {Node}
                                    </FixedSizeTree>
                                )}
                            </AutoSizer>
                        }

                        {/* No Grouping, Rows, one per card */}
                        {!activeView.fields.groupById &&
                            <TableRows
                                board={board}
                                activeView={activeView}
                                cards={cards}
                                selectedCardIds={props.selectedCardIds}
                                readonly={props.readonly || !canEditCards}
                                cardIdToFocusOnRender={props.cardIdToFocusOnRender}
                                showCard={props.showCard}
                                addCard={props.addCard}
                                onCardClicked={props.onCardClicked}
                                onDrop={onDropToCard}
                                useVirtualizedList={true}
                            />
                        }
                    </div>

                    {/* Add New row */}
                    <div className='octo-table-footer'>
                        {!props.readonly && !activeView.fields.groupById &&
                            <BoardPermissionGate permissions={[Permission.ManageBoardCards]}>
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
                            </BoardPermissionGate>
                        }
                    </div>

                    <CalculationRow
                        board={board}
                        cards={cards}
                        activeView={activeView}
                        readonly={props.readonly || !canEditBoardProperties}
                    />
                </div>
            </ColumnResizeProvider>

            {hiddenCardsCount > 0 &&
                <HiddenCardCount
                    showHiddenCardNotification={props.showHiddenCardCountNotification}
                    hiddenCardsCount={hiddenCardsCount}
                />}
        </div>
    )
}

export default Table
