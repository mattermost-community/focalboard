// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useState, useEffect} from 'react'
import {FormattedMessage} from 'react-intl'

import {Constants} from '../../constants'
import {MutableCard, Card} from '../../blocks/card'
import {Board} from '../../blocks/board'
import {BoardView} from '../../blocks/boardView'
import mutator from '../../mutator'
import {Utils} from '../../utils'
import useCardListener from '../../hooks/cardListener'
import {useAppDispatch, useAppSelector} from '../../store/hooks'
import {updateCards, getCardsByBoard} from '../../store/cards'

import './gallery.scss'
import GalleryCard from './galleryCard'

type Props = {
    board: Board
    activeView: BoardView
    readonly: boolean
    addCard: (show: boolean) => Promise<void>
    selectedCardIds: string[]
    onCardClicked: (e: React.MouseEvent, card: Card) => void
}

const Gallery = (props: Props): JSX.Element => {
    const {activeView, board} = props
    const visiblePropertyTemplates = board.cardProperties.filter((template) => activeView.visiblePropertyIds.includes(template.id))
    const cards = useAppSelector(getCardsByBoard(board.id))
    const isManualSort = activeView.sortOptions.length === 0
    const dispatch = useAppDispatch()

    const onDropToCard = (srcCard: Card, dstCard: Card) => {
        Utils.log(`onDropToCard: ${dstCard.title}`)
        const {selectedCardIds} = props

        const draggedCardIds = Array.from(new Set(selectedCardIds).add(srcCard.id))
        const description = draggedCardIds.length > 1 ? `drag ${draggedCardIds.length} cards` : 'drag card'

        // Update dstCard order
        let cardOrder = Array.from(new Set([...activeView.cardOrder, ...cards.map((o) => o.id)]))
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

    const visibleTitle = activeView.visiblePropertyIds.includes(Constants.titleColumnId)

    useCardListener(
        async (blocks) => {
            dispatch(updateCards(blocks.filter((o) => o.type === 'card') as MutableCard[]))
        },
        () => {},
    )

    return (
        <div className='octo-table-body Gallery'>
            {cards.filter((c) => c.parentId === board.id).map((card) => {
                return (
                    <GalleryCard
                        key={card.id + card.updateAt}
                        card={card}
                        board={board}
                        onClick={props.onCardClicked}
                        visiblePropertyTemplates={visiblePropertyTemplates}
                        visibleTitle={visibleTitle}
                        isSelected={props.selectedCardIds.includes(card.id)}
                        readonly={props.readonly}
                        onDrop={onDropToCard}
                        isManualSort={isManualSort}
                    />
                )
                return null
            })}

            {/* Add New row */}

            {!props.readonly &&
                <div
                    className='octo-gallery-new'
                    onClick={() => {
                        props.addCard(true)
                    }}
                >
                    <FormattedMessage
                        id='TableComponent.plus-new'
                        defaultMessage='+ New'
                    />
                </div>
            }
        </div>
    )
}

export default Gallery
