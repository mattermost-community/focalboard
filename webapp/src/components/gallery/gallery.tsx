// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useState, useEffect} from 'react'
import {FormattedMessage} from 'react-intl'

import {Constants} from '../../constants'
import {Card} from '../../blocks/card'
import mutator from '../../mutator'
import {Utils} from '../../utils'
import {BoardTree} from '../../viewModel/boardTree'
import {CardTree, MutableCardTree} from '../../viewModel/cardTree'
import useCardListener from '../../hooks/cardListener'

import './gallery.scss'
import GalleryCard from './galleryCard'

type Props = {
    boardTree: BoardTree
    readonly: boolean
    addCard: (show: boolean) => Promise<void>
    selectedCardIds: string[]
    onCardClicked: (e: React.MouseEvent, card: Card) => void
}

const Gallery = (props: Props): JSX.Element => {
    const {boardTree} = props
    const {cards, activeView} = boardTree
    const visiblePropertyTemplates = boardTree.board.cardProperties.filter((template) => boardTree.activeView.visiblePropertyIds.includes(template.id))
    const [cardTrees, setCardTrees] = useState<{[key: string]: CardTree | undefined}>({})
    const isManualSort = activeView.sortOptions.length < 1

    const onDropToCard = (srcCard: Card, dstCard: Card) => {
        Utils.log(`onDropToCard: ${dstCard.title}`)
        const {selectedCardIds} = props

        const draggedCardIds = Array.from(new Set(selectedCardIds).add(srcCard.id))
        const description = draggedCardIds.length > 1 ? `drag ${draggedCardIds.length} cards` : 'drag card'

        // Update dstCard order
        let cardOrder = Array.from(new Set([...activeView.cardOrder, ...boardTree.cards.map((o) => o.id)]))
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

    const visibleTitle = boardTree.activeView.visiblePropertyIds.includes(Constants.titleColumnId)

    useCardListener(
        cards.map((c) => c.id),
        async (blocks) => {
            cards.forEach(async (c) => {
                const cardTree = cardTrees[c.id]
                const newCardTree = cardTree ? MutableCardTree.incrementalUpdate(cardTree, blocks) : await MutableCardTree.sync(c.id)
                setCardTrees((oldTree) => ({...oldTree, [c.id]: newCardTree}))
            })
        },
        async () => {
            cards.forEach(async (c) => {
                const newCardTree = await MutableCardTree.sync(c.id)
                setCardTrees((oldTree) => ({...oldTree, [c.id]: newCardTree}))
            })
        },
    )

    useEffect(() => {
        cards.forEach(async (c) => {
            const newCardTree = await MutableCardTree.sync(c.id)
            setCardTrees((oldTree) => ({...oldTree, [c.id]: newCardTree}))
        })
    }, [cards])

    return (
        <div className='octo-table-body Gallery'>
            {cards.map((card) => {
                const cardTree = cardTrees[card.id]
                if (cardTree) {
                    return (
                        <GalleryCard
                            key={card.id + card.updateAt}
                            cardTree={cardTree}
                            onClick={props.onCardClicked}
                            visiblePropertyTemplates={visiblePropertyTemplates}
                            visibleTitle={visibleTitle}
                            isSelected={props.selectedCardIds.includes(card.id)}
                            readonly={props.readonly}
                            onDrop={onDropToCard}
                            isManualSort={isManualSort}
                        />
                    )
                }
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
