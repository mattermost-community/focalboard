// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
/* eslint-disable max-lines */
import React from 'react'
import {IntlShape} from 'react-intl'

import {IPropertyOption} from '../../blocks/board'
import {Card} from '../../blocks/card'
import {BoardTree, BoardTreeGroup} from '../../viewModel/boardTree'

import TableGroupHeader from './tableGroupHeader'
import TableRows from './tableRows'

type Props = {
    boardTree: BoardTree
    group: BoardTreeGroup
    intl: IntlShape
    readonly: boolean
    columnRefs: Map<string, React.RefObject<HTMLDivElement>>
    selectedCardIds: string[]
    cardIdToFocusOnRender: string

    hideGroup: (groupByOptionId: string) => void
    addCard: (groupByOptionId?: string) => Promise<void>
    showCard: (cardId?: string) => void
    propertyNameChanged: (option: IPropertyOption, text: string) => Promise<void>

    // onDropToColumn: (srcOption: IPropertyOption, card?: Card, dstOption?: IPropertyOption) => void
    onCardClicked: (e: React.MouseEvent, card: Card) => void

    onDropToGroupHeader: (srcOption: IPropertyOption, dstOption?: IPropertyOption) => void
}

const TableGroup = React.memo((props: Props): JSX.Element => {
    const {boardTree, group} = props

    return (
        <div>
            <TableGroupHeader
                group={group}
                boardTree={boardTree}
                intl={props.intl}
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
                intl={props.intl}
                showCard={props.showCard}
                addCard={props.addCard}
                onCardClicked={props.onCardClicked}
            />}
        </div>
    )
})

export default TableGroup
