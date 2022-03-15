// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useCallback} from 'react'
import {useDragLayer} from 'react-dnd'

import {Card} from '../../blocks/card'
import {Board} from '../../blocks/board'
import {BoardView} from '../../blocks/boardView'

import './table.scss'

import TableRow from './tableRow'

type Props = {
    board: Board
    activeView: BoardView
    columnRefs: Map<string, React.RefObject<HTMLDivElement>>
    cards: readonly Card[]
    selectedCardIds: string[]
    readonly: boolean
    cardIdToFocusOnRender: string
    showCard: (cardId?: string) => void
    addCard: (groupByOptionId?: string) => Promise<void>
    onCardClicked: (e: React.MouseEvent, card: Card) => void
    onDrop: (srcCard: Card, dstCard: Card) => void
}

const TableRows = (props: Props): JSX.Element => {
    const {board, cards, activeView} = props

    const onSaveWithEnter = useCallback((card: Card) => {
        if (cards.length > 0 && cards[cards.length - 1] === card) {
            props.addCard(activeView.fields.groupById ? card.fields.properties[activeView.fields.groupById!] as string : '')
        }
    }, [cards.length > 0 && cards[cards.length - 1], props.addCard, activeView.fields.groupById])

    const onClickRow = useCallback((e: React.MouseEvent<HTMLDivElement>, card: Card) => {
        props.onCardClicked(e, card)
    }, [props.onCardClicked])

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

    return (
        <>
            {cards.map((card) => {
                const tableRow = (
                    <TableRow
                        key={card.id + card.updateAt}
                        board={board}
                        activeView={activeView}
                        card={card}
                        isSelected={props.selectedCardIds.includes(card.id)}
                        focusOnMount={props.cardIdToFocusOnRender === card.id}
                        onSaveWithEnter={onSaveWithEnter}
                        onClick={onClickRow}
                        showCard={props.showCard}
                        readonly={props.readonly}
                        onDrop={props.onDrop}
                        offset={offset}
                        resizingColumn={resizingColumn}
                        columnRefs={props.columnRefs}
                    />)

                return tableRow
            })}
        </>
    )
}

export default TableRows
