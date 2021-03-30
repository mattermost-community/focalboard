// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {FormattedMessage} from 'react-intl'

import {BoardTree} from '../../viewModel/boardTree'

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

    return (
        <div className='octo-table-body Gallery'>
            {cards.map((card) => {
                const tableRow = (
                    <GalleryCard
                        key={card.id + card.updateAt}
                        card={card}
                        showCard={props.showCard}
                    />)

                return tableRow
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
