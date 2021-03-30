// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useState, useEffect} from 'react'
import {FormattedMessage} from 'react-intl'

import {Card} from '../../blocks/card'
import {CardTree, MutableCardTree} from '../../viewModel/cardTree'
import {IContentBlock} from '../../blocks/contentBlock'

import ImageElement from '../content/imageElement'
import ContentElement from '../content/contentElement'

import './galleryCard.scss'

type Props = {
    card: Card
    showCard: (cardId: string) => void
}

const GalleryCard = React.memo((props: Props) => {
    const {card} = props
    const [cardTree, setCardTree] = useState<CardTree>()

    useEffect(() => {
        const f = async () => setCardTree(await MutableCardTree.sync(card.id))
        f()
    }, [])

    let images: IContentBlock[] = []
    if (cardTree) {
        images = cardTree.contents.filter((content) => content.type === 'image')
    }

    return (
        <div
            className='GalleryCard'
            onClick={() => props.showCard(props.card.id)}
        >
            {images?.length > 0 &&
                <div className='gallery-image'>
                    <ImageElement block={images[0]}/>
                </div>}
            {images?.length === 0 &&
                <div className='gallery-item'>
                    {cardTree && images?.length === 0 && cardTree.contents.map((block) => (
                        <ContentElement
                            key={block.id}
                            block={block}
                            readonly={true}
                        />
                    ))}
                </div>}
            <div className='gallery-title'>
                { card.icon ? <div className='octo-icon'>{card.icon}</div> : undefined }
                <div key='__title'>
                    {card.title ||
                        <FormattedMessage
                            id='KanbanCard.untitled'
                            defaultMessage='Untitled'
                        />}
                </div>
            </div>
        </div>
    )
})

export default GalleryCard
