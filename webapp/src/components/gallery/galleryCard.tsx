// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {FormattedMessage, injectIntl, IntlShape} from 'react-intl'

import {IPropertyTemplate} from '../../blocks/board'
import {Card} from '../../blocks/card'
import {CardTree} from '../../viewModel/cardTree'
import {IContentBlock} from '../../blocks/contentBlock'
import mutator from '../../mutator'

import IconButton from '../../widgets/buttons/iconButton'
import DeleteIcon from '../../widgets/icons/delete'
import DuplicateIcon from '../../widgets/icons/duplicate'
import OptionsIcon from '../../widgets/icons/options'
import Menu from '../../widgets/menu'
import MenuWrapper from '../../widgets/menuWrapper'
import {useSortable} from '../../hooks/sortable'

import ImageElement from '../content/imageElement'
import ContentElement from '../content/contentElement'
import PropertyValueElement from '../propertyValueElement'

import './galleryCard.scss'

type Props = {
    cardTree: CardTree
    onClick: (e: React.MouseEvent, card: Card) => void
    visiblePropertyTemplates: IPropertyTemplate[]
    visibleTitle: boolean
    isSelected: boolean
    intl: IntlShape
    readonly: boolean
    isManualSort: boolean
    onDrop: (srcCard: Card, dstCard: Card) => void
}

const GalleryCard = React.memo((props: Props) => {
    const {cardTree} = props
    const [isDragging, isOver, cardRef] = useSortable('card', cardTree.card, props.isManualSort, props.onDrop)

    const visiblePropertyTemplates = props.visiblePropertyTemplates || []

    let images: IContentBlock[] = []
    images = cardTree.contents.filter((content) => content.type === 'image')
    let className = props.isSelected ? 'GalleryCard selected' : 'GalleryCard'
    if (isOver) {
        className += ' dragover'
    }

    return (
        <div
            className={className}
            onClick={(e: React.MouseEvent) => props.onClick(e, cardTree.card)}
            style={{opacity: isDragging ? 0.5 : 1}}
            ref={cardRef}
        >
            {!props.readonly &&
                <MenuWrapper
                    className='optionsMenu'
                    stopPropagationOnToggle={true}
                >
                    <IconButton icon={<OptionsIcon/>}/>
                    <Menu position='left'>
                        <Menu.Text
                            icon={<DeleteIcon/>}
                            id='delete'
                            name={props.intl.formatMessage({id: 'GalleryCard.delete', defaultMessage: 'Delete'})}
                            onClick={() => mutator.deleteBlock(cardTree.card, 'delete card')}
                        />
                        <Menu.Text
                            icon={<DuplicateIcon/>}
                            id='duplicate'
                            name={props.intl.formatMessage({id: 'GalleryCard.duplicate', defaultMessage: 'Duplicate'})}
                            onClick={() => {
                                mutator.duplicateCard(cardTree.card.id)
                            }}
                        />
                    </Menu>
                </MenuWrapper>
            }

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
            {props.visibleTitle &&
                <div className='gallery-title'>
                    { cardTree.card.icon ? <div className='octo-icon'>{cardTree.card.icon}</div> : undefined }
                    <div key='__title'>
                        {cardTree.card.title ||
                            <FormattedMessage
                                id='KanbanCard.untitled'
                                defaultMessage='Untitled'
                            />}
                    </div>
                </div>}
            {visiblePropertyTemplates.length > 0 &&
                <div className='gallery-props'>
                    {visiblePropertyTemplates.map((template) => (
                        <PropertyValueElement
                            key={template.id}
                            readOnly={true}
                            card={cardTree.card}
                            propertyTemplate={template}
                            emptyDisplayValue=''
                        />
                    ))}
                </div>}
        </div>
    )
})

export default injectIntl(GalleryCard)
