// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {useIntl} from 'react-intl'

import {IPropertyTemplate} from '../../blocks/board'
import {Card} from '../../blocks/card'
import mutator from '../../mutator'
import IconButton from '../../widgets/buttons/iconButton'
import DeleteIcon from '../../widgets/icons/delete'
import DuplicateIcon from '../../widgets/icons/duplicate'
import OptionsIcon from '../../widgets/icons/options'
import Menu from '../../widgets/menu'
import MenuWrapper from '../../widgets/menuWrapper'
import {useSortable} from '../../hooks/sortable'

import './kanbanCard.scss'
import PropertyValueElement from '../propertyValueElement'
import {CardTree} from '../../viewModel/cardTree'
import Tooltip from '../../widgets/tooltip'

type Props = {
    card: Card
    cardTree?: CardTree
    visiblePropertyTemplates: IPropertyTemplate[]
    isSelected: boolean
    onClick?: (e: React.MouseEvent<HTMLDivElement>) => void
    readonly: boolean
    onDrop: (srcCard: Card, dstCard: Card) => void
    showCard: (cardId?: string) => void
    isManualSort: boolean
}

const KanbanCard = React.memo((props: Props) => {
    const {card} = props
    const intl = useIntl()
    const [isDragging, isOver, cardRef] = useSortable('card', card, !props.readonly, props.onDrop)
    const visiblePropertyTemplates = props.visiblePropertyTemplates || []
    let className = props.isSelected ? 'KanbanCard selected' : 'KanbanCard'
    if (props.isManualSort && isOver) {
        className += ' dragover'
    }

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
                    </Menu>
                </MenuWrapper>
            }

            <div className='octo-icontitle'>
                { card.icon ? <div className='octo-icon'>{card.icon}</div> : undefined }
                <div key='__title'>{card.title || intl.formatMessage({id: 'KanbanCard.untitled', defaultMessage: 'Untitled'})}</div>
            </div>
            {visiblePropertyTemplates.map((template) => (
                <Tooltip
                    key={template.id}
                    title={template.name}
                >
                    <PropertyValueElement
                        readOnly={true}
                        card={card}
                        cardTree={props.cardTree}
                        propertyTemplate={template}
                        emptyDisplayValue=''
                    />
                </Tooltip>
            ))}
        </div>
    )
})

export default KanbanCard
