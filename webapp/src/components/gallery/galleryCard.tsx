// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {FormattedMessage, useIntl} from 'react-intl'

import {Board, IPropertyTemplate} from '../../blocks/board'
import {Card} from '../../blocks/card'
import {ContentBlock} from '../../blocks/contentBlock'
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
import Tooltip from '../../widgets/tooltip'
import {useAppSelector} from '../../store/hooks'
import {getCardContents} from '../../store/contents'
import {getCardComments} from '../../store/comments'

import './galleryCard.scss'

type Props = {
    board: Board
    card: Card
    onClick: (e: React.MouseEvent, card: Card) => void
    visiblePropertyTemplates: IPropertyTemplate[]
    visibleTitle: boolean
    isSelected: boolean
    readonly: boolean
    isManualSort: boolean
    onDrop: (srcCard: Card, dstCard: Card) => void
}

const GalleryCard = React.memo((props: Props) => {
    const {card, board} = props
    const intl = useIntl()
    const [isDragging, isOver, cardRef] = useSortable('card', card, props.isManualSort && !props.readonly, props.onDrop)
    const contents = useAppSelector(getCardContents(card.id))
    const comments = useAppSelector(getCardComments(card.id))

    const visiblePropertyTemplates = props.visiblePropertyTemplates || []

    let image: ContentBlock | undefined
    for (let i = 0; i < contents.length; ++i) {
        if (Array.isArray(contents[i])) {
            image = (contents[i] as ContentBlock[]).find((c) => c.type === 'image')
        } else if ((contents[i] as ContentBlock).type === 'image') {
            image = contents[i] as ContentBlock
        }

        if (image) {
            break
        }
    }

    let className = props.isSelected ? 'GalleryCard selected' : 'GalleryCard'
    if (isOver) {
        className += ' dragover'
    }

    return (
        <div
            className={className}
            onClick={(e: React.MouseEvent) => props.onClick(e, card)}
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
                            name={intl.formatMessage({id: 'GalleryCard.delete', defaultMessage: 'Delete'})}
                            onClick={() => mutator.deleteBlock(card, 'delete card')}
                        />
                        <Menu.Text
                            icon={<DuplicateIcon/>}
                            id='duplicate'
                            name={intl.formatMessage({id: 'GalleryCard.duplicate', defaultMessage: 'Duplicate'})}
                            onClick={() => {
                                mutator.duplicateCard(card.id)
                            }}
                        />
                    </Menu>
                </MenuWrapper>
            }

            {image &&
                <div className='gallery-image'>
                    <ImageElement block={image}/>
                </div>}
            {!image &&
                <div className='gallery-item'>
                    {contents.map((block) => {
                        if (Array.isArray(block)) {
                            return block.map((b) => (
                                <ContentElement
                                    key={b.id}
                                    block={b}
                                    readonly={true}
                                />
                            ))
                        }

                        return (
                            <ContentElement
                                key={block.id}
                                block={block}
                                readonly={true}
                            />
                        )
                    })}
                </div>}
            {props.visibleTitle &&
                <div className='gallery-title'>
                    { card.fields.icon ? <div className='octo-icon'>{card.fields.icon}</div> : undefined }
                    <div key='__title'>
                        {card.title ||
                            <FormattedMessage
                                id='KanbanCard.untitled'
                                defaultMessage='Untitled'
                            />}
                    </div>
                </div>}
            {visiblePropertyTemplates.length > 0 &&
                <div className='gallery-props'>
                    {visiblePropertyTemplates.map((template) => (
                        <Tooltip
                            key={template.id}
                            title={template.name}
                            placement='top'
                        >
                            <PropertyValueElement
                                contents={contents}
                                comments={comments}
                                board={board}
                                readOnly={true}
                                card={card}
                                propertyTemplate={template}
                                showEmptyPlaceholder={false}
                            />
                        </Tooltip>
                    ))}
                </div>}
        </div>
    )
})

export default GalleryCard
