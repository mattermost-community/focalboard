// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {FormattedMessage} from 'react-intl'

import {CardTree} from '../../viewModel/cardTree'
import {IContentBlock} from '../../blocks/contentBlock'

import ImageElement from '../content/imageElement'
import ContentElement from '../content/contentElement'

import './galleryCard.scss'

type Props = {
    cardTree: CardTree
    showCard: (cardId: string) => void
}

const GalleryCard = React.memo((props: Props) => {
    const {cardTree} = props

    let images: IContentBlock[] = []
    images = cardTree.contents.filter((content) => content.type === 'image')

    return (
        <div
            className='GalleryCard'
            onClick={() => props.showCard(cardTree.card.id)}
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
                { cardTree.card.icon ? <div className='octo-icon'>{cardTree.card.icon}</div> : undefined }
                <div key='__title'>
                    {cardTree.card.title ||
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
