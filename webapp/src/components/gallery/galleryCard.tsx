// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {FormattedMessage} from 'react-intl'

import {Card} from '../../blocks/card'
import {BoardTree} from '../../viewModel/boardTree'

import PropertyValueElement from '../propertyValueElement'

import './galleryCard.scss'

type Props = {
    boardTree: BoardTree
    card: Card
    showCard: (cardId: string) => void
}

const GalleryCard = React.memo((props: Props) => {
    const {boardTree, card} = props
    const {board} = boardTree

    // const images = card.contents.filter((content) => content.type == 'image')
    const images = []

    return (
        <div
            className='GalleryCard'
            onClick={() => props.showCard(props.card.id)}
        >
            <div
                className='gallery-item'
            >
                {images?.length > 0 && null }
                {images?.length === 0 && board.cardProperties.map((template) => (
                    <PropertyValueElement
                        key={template.id}
                        readOnly={true}
                        card={card}
                        propertyTemplate={template}
                        emptyDisplayValue=''
                    />
                ))}
            </div>
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
