// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useCallback} from 'react'
import {FixedSizeList, ListChildComponentProps} from 'react-window'
import AutoSizer from 'react-virtualized-auto-sizer'

import {Card} from '../../blocks/card'
import {Board} from '../../blocks/board'
import {BoardView} from '../../blocks/boardView'

import './table.scss'

import TableRow from './tableRow'

type Props = {
    board: Board
    activeView: BoardView
    cards: readonly Card[]
    selectedCardIds: string[]
    readonly: boolean
    cardIdToFocusOnRender: string
    showCard: (cardId?: string) => void
    addCard: (groupByOptionId?: string) => Promise<void>
    onCardClicked: (e: React.MouseEvent, card: Card) => void
    onDrop: (srcCard: Card, dstCard: Card) => void
    useVirtualizedList: boolean
}

const TableRows = (props: Props): JSX.Element => {
    const {board, cards, activeView, useVirtualizedList} = props

    const onClickRow = useCallback((e: React.MouseEvent<HTMLDivElement>, card: Card) => {
        props.onCardClicked(e, card)
    }, [props.onCardClicked])

    if (!useVirtualizedList) {
        return (
            <>
                {cards.map((card, idx) => {
                    return (
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
                            isLastCard={idx === (cards.length - 1)}
                            onClick={onClickRow}
                            showCard={props.showCard}
                            readonly={props.readonly}
                            onDrop={props.onDrop}
                        />
                    )
                })}
            </>
        )
    }

    const isItemLoaded = (index: number) => {
        return index < cards.length;
    }

    const Item = ({index, style}: ListChildComponentProps) => {
        const card = cards[index]
        if (isItemLoaded(index)) {
            return (
                <div
                    style={style}
                    key={card.id + card.updateAt}
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
                        isLastCard={index === (cards.length - 1)}
                        onClick={onClickRow}
                        showCard={props.showCard}
                        readonly={props.readonly}
                        onDrop={props.onDrop}
                    />
                </div>
                
            )
        }

        return null
    }

    return (
        <AutoSizer disableWidth>
            {({height}) => (
                <FixedSizeList
                    height={height}
                    itemCount={1828}
                    itemSize={44}
                    width={'100%'}
                >
                    {Item}
                </FixedSizeList>
            )}
        </AutoSizer>
        
    )
}

export default TableRows
