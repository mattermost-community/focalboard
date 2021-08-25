// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {FormattedMessage} from 'react-intl'

import {Constants} from '../../constants'
import {Card} from '../../blocks/card'
import {Board, IPropertyTemplate} from '../../blocks/board'
import {BoardView} from '../../blocks/boardView'
import mutator from '../../mutator'
import {Utils} from '../../utils'

import './gallery.scss'
import GalleryCard from './galleryCard'

type Props = {
    board: Board
    cards: Card[]
    activeView: BoardView
    readonly: boolean
    addCard: (show: boolean) => Promise<void>
    selectedCardIds: string[]
    onCardClicked: (e: React.MouseEvent, card: Card) => void
}

const Gallery = (props: Props): JSX.Element => {
    const {activeView, board, cards} = props
    const visiblePropertyTemplates = board.fields.cardProperties.filter((template: IPropertyTemplate) => activeView.fields.visiblePropertyIds.includes(template.id))
    const isManualSort = activeView.fields.sortOptions.length === 0

    const onDropToCard = (srcCard: Card, dstCard: Card) => {
        Utils.log(`onDropToCard: ${dstCard.title}`)
        const {selectedCardIds} = props

        const draggedCardIds = Array.from(new Set(selectedCardIds).add(srcCard.id))
        const description = draggedCardIds.length > 1 ? `drag ${draggedCardIds.length} cards` : 'drag card'

        // Update dstCard order
        let cardOrder = Array.from(new Set([...activeView.fields.cardOrder, ...cards.map((o) => o.id)]))
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

    const visibleTitle = activeView.fields.visiblePropertyIds.includes(Constants.titleColumnId)

    return (
        <div className='Gallery'>
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
