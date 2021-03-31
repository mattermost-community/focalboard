// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useState, useEffect} from 'react'
import {FormattedMessage} from 'react-intl'

import {BoardTree} from '../../viewModel/boardTree'
import {CardTree, MutableCardTree} from '../../viewModel/cardTree'
import useCardListener from '../../hooks/cardListener'

import './gallery.scss'
import GalleryCard from './galleryCard'

type Props = {
    boardTree: BoardTree
    readonly: boolean
    showCard: (cardId?: string) => void
    addCard: (show: boolean) => Promise<void>
}

const Gallery = (props: Props): JSX.Element => {
    const {boardTree} = props
    const {cards} = boardTree
    const visiblePropertyTemplates = boardTree.board.cardProperties.filter((template) => boardTree.activeView.visiblePropertyIds.includes(template.id))
    const [cardTrees, setCardTrees] = useState<{[key: string]: CardTree | undefined}>({})

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
                            showCard={props.showCard}
                            visiblePropertyTemplates={visiblePropertyTemplates}
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
                        props.addCard(false)
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
