// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
/* eslint-disable max-lines */
import React from 'react'

import {useDrop} from 'react-dnd'

import {IPropertyOption} from '../../blocks/board'
import {Card} from '../../blocks/card'
import {BoardTree, BoardTreeGroup} from '../../viewModel/boardTree'

import TableGroupHeaderRow from './tableGroupHeaderRow'
import TableRows from './tableRows'

type Props = {
    boardTree: BoardTree
    group: BoardTreeGroup
    readonly: boolean
    columnRefs: Map<string, React.RefObject<HTMLDivElement>>
    selectedCardIds: string[]
    cardIdToFocusOnRender: string
    hideGroup: (groupByOptionId: string) => void
    addCard: (groupByOptionId?: string) => Promise<void>
    showCard: (cardId?: string) => void
    propertyNameChanged: (option: IPropertyOption, text: string) => Promise<void>
    onCardClicked: (e: React.MouseEvent, card: Card) => void
    onDropToGroupHeader: (srcOption: IPropertyOption, dstOption?: IPropertyOption) => void
    onDropToCard: (srcCard: Card, dstCard: Card) => void
    onDropToGroup: (srcCard: Card, groupID: string, dstCardID: string) => void
}

const TableGroup = React.memo((props: Props): JSX.Element => {
    const {boardTree, group, onDropToGroup} = props
    const groupId = group.option.id

    const [{isOver}, drop] = useDrop(() => ({
        accept: 'card',
        collect: (monitor) => ({
            isOver: monitor.isOver(),
        }),
        drop: (item: Card, monitor) => {
            if (monitor.isOver({shallow: true})) {
                onDropToGroup(item, groupId, '')
            }
        },
    }), [onDropToGroup, groupId])

    let className = 'octo-table-group'
    if (isOver) {
        className += ' dragover'
    }

    return (
        <div
            ref={drop}
            className={className}
            key={group.option.id}
        >
            <TableGroupHeaderRow
                group={group}
                boardTree={boardTree}
                hideGroup={props.hideGroup}
                addCard={props.addCard}
                readonly={props.readonly}
                propertyNameChanged={props.propertyNameChanged}
                onDrop={props.onDropToGroupHeader}
            />

            {(group.cards.length > 0) &&
            <TableRows
                boardTree={boardTree}
                columnRefs={props.columnRefs}
                cards={group.cards}
                selectedCardIds={props.selectedCardIds}
                readonly={props.readonly}
                cardIdToFocusOnRender={props.cardIdToFocusOnRender}
                showCard={props.showCard}
                addCard={props.addCard}
                onCardClicked={props.onCardClicked}
                onDrop={props.onDropToCard}
            />}
        </div>
    )
})

export default TableGroup
