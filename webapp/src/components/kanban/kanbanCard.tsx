// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {useIntl} from 'react-intl'

import {Board, IPropertyTemplate} from '../../blocks/board'
import {Card} from '../../blocks/card'
import mutator from '../../mutator'
import IconButton from '../../widgets/buttons/iconButton'
import DeleteIcon from '../../widgets/icons/delete'
import DuplicateIcon from '../../widgets/icons/duplicate'
import OptionsIcon from '../../widgets/icons/options'
import LinkIcon from '../../widgets/icons/Link'
import Menu from '../../widgets/menu'
import MenuWrapper from '../../widgets/menuWrapper'
import {useSortable} from '../../hooks/sortable'
import {Utils} from '../../utils'
import {sendFlashMessage} from '../flashMessages'
import {useAppSelector} from '../../store/hooks'
import {getCardContents} from '../../store/contents'
import {getCardComments} from '../../store/comments'

import './kanbanCard.scss'
import PropertyValueElement from '../propertyValueElement'
import Tooltip from '../../widgets/tooltip'

type Props = {
    card: Card
    board: Board
    visiblePropertyTemplates: IPropertyTemplate[]
    isSelected: boolean
    onClick?: (e: React.MouseEvent<HTMLDivElement>) => void
    readonly: boolean
    onDrop: (srcCard: Card, dstCard: Card) => void
    showCard: (cardId?: string) => void
    isManualSort: boolean
}

const KanbanCard = React.memo((props: Props) => {
    const {card, board} = props
    const intl = useIntl()
    const [isDragging, isOver, cardRef] = useSortable('card', card, !props.readonly, props.onDrop)
    const visiblePropertyTemplates = props.visiblePropertyTemplates || []
    let className = props.isSelected ? 'KanbanCard selected' : 'KanbanCard'
    if (props.isManualSort && isOver) {
        className += ' dragover'
    }

    const contents = useAppSelector(getCardContents(card.id))
    const comments = useAppSelector(getCardComments(card.id))

    return (
        <div
            ref={props.readonly ? () => null : cardRef}
            className={className}
            draggable={!props.readonly}
            style={{opacity: isDragging ? 0.5 : 1}}
            onClick={props.onClick}
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
                            name={intl.formatMessage({id: 'KanbanCard.delete', defaultMessage: 'Delete'})}
                            onClick={() => mutator.deleteBlock(card, 'delete card')}
                        />
                        <Menu.Text
                            icon={<DuplicateIcon/>}
                            id='duplicate'
                            name={intl.formatMessage({id: 'KanbanCard.duplicate', defaultMessage: 'Duplicate'})}
                            onClick={() => {
                                mutator.duplicateCard(
                                    card.id,
                                    'duplicate card',
                                    false,
                                    async (newCardId) => {
                                        props.showCard(newCardId)
                                    },
                                    async () => {
                                        props.showCard(undefined)
                                    },
                                )
                            }}
                        />
                        <Menu.Text
                            icon={<LinkIcon/>}
                            id='copy'
                            name={intl.formatMessage({id: 'KanbanCard.copyLink', defaultMessage: 'Copy link'})}
                            onClick={() => {
                                let cardLink = window.location.href

                                if (!cardLink.includes(card.id)) {
                                    cardLink += `/${card.id}`
                                }

                                Utils.copyTextToClipboard(cardLink)
                                sendFlashMessage({content: intl.formatMessage({id: 'KanbanCard.copiedLink', defaultMessage: 'Copied!'}), severity: 'high'})
                            }}
                        />
                    </Menu>
                </MenuWrapper>
            }

            <div className='octo-icontitle'>
                { card.fields.icon ? <div className='octo-icon'>{card.fields.icon}</div> : undefined }
                <div key='__title'>{card.title || intl.formatMessage({id: 'KanbanCard.untitled', defaultMessage: 'Untitled'})}</div>
            </div>
            {visiblePropertyTemplates.map((template) => (
                <Tooltip
                    key={template.id}
                    title={template.name}
                >
                    <PropertyValueElement
                        board={board}
                        readOnly={true}
                        card={card}
                        contents={contents}
                        comments={comments}
                        propertyTemplate={template}
                        showEmptyPlaceholder={false}
                    />
                </Tooltip>
            ))}
        </div>
    )
})

export default KanbanCard
