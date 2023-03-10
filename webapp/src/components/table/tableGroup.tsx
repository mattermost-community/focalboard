// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
/* eslint-disable max-lines */
import React from 'react'

import {useDrop} from 'react-dnd'

import {Board, IPropertyOption, IPropertyTemplate, BoardGroup} from '../../blocks/board'
import {BoardView} from '../../blocks/boardView'
import {Card} from '../../blocks/card'

import TableGroupHeaderRow from './tableGroupHeaderRow'
import TableRows from './tableRows'

type Props = {
    board: Board
    activeView: BoardView
    groupByProperty?: IPropertyTemplate
    group: BoardGroup
    readonly: boolean
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

const TableGroup = (props: Props): JSX.Element => {
    const {board, activeView, group, onDropToGroup, groupByProperty} = props

    return (
        <>
            <TableGroupHeaderRow
                group={group}
                board={board}
                activeView={activeView}
                groupByProperty={groupByProperty}
                hideGroup={props.hideGroup}
                addCard={props.addCard}
                readonly={props.readonly}
                propertyNameChanged={props.propertyNameChanged}
                onDrop={props.onDropToGroupHeader}
                key={group.option.id}
                onDropToGroup={onDropToGroup}
                groupToggle={() => {}}
            />

            {(group.cards.length > 0) &&
            <TableRows
                board={board}
                activeView={activeView}
                cards={group.cards}
                selectedCardIds={props.selectedCardIds}
                readonly={props.readonly}
                cardIdToFocusOnRender={props.cardIdToFocusOnRender}
                showCard={props.showCard}
                addCard={props.addCard}
                onCardClicked={props.onCardClicked}
                onDrop={props.onDropToCard}
                useVirtualizedList={false}
            />}
        </>    
    )
}

export default React.memo(TableGroup)
