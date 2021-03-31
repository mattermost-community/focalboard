// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React, {useState} from 'react'
import {injectIntl, IntlShape} from 'react-intl'

import {IPropertyTemplate} from '../../blocks/board'
import {Card} from '../../blocks/card'
import mutator from '../../mutator'
import IconButton from '../../widgets/buttons/iconButton'
import DeleteIcon from '../../widgets/icons/delete'
import DuplicateIcon from '../../widgets/icons/duplicate'
import OptionsIcon from '../../widgets/icons/options'
import Menu from '../../widgets/menu'
import MenuWrapper from '../../widgets/menuWrapper'

import './kanbanCard.scss'
import PropertyValueElement from '../propertyValueElement'

type Props = {
    card: Card
    visiblePropertyTemplates: IPropertyTemplate[]
    isSelected: boolean
    isDropZone?: boolean
    onClick?: (e: React.MouseEvent<HTMLDivElement>) => void
    onDragStart: (e: React.DragEvent<HTMLDivElement>) => void
    onDragEnd: (e: React.DragEvent<HTMLDivElement>) => void
    onDrop: (e: React.DragEvent<HTMLDivElement>) => void
    intl: IntlShape
    readonly: boolean
}

const KanbanCard = (props: Props) => {
    const [isDragged, setIsDragged] = useState(false)
    const [isDragOver, setIsDragOver] = useState(false)

    const {card, intl} = props
    const visiblePropertyTemplates = props.visiblePropertyTemplates || []
    let className = props.isSelected ? 'KanbanCard selected' : 'KanbanCard'
    if (props.isDropZone && isDragOver) {
        className += ' dragover'
    }

    return (
        <div
            className={className}
            draggable={!props.readonly}
            style={{opacity: isDragged ? 0.5 : 1}}
            onClick={props.onClick}
            onDragStart={(e) => {
                setIsDragged(true)
                props.onDragStart(e)
            }}
            onDragEnd={(e) => {
                setIsDragged(false)
                props.onDragEnd(e)
            }}

            onDragOver={() => {
                if (!isDragOver) {
                    setIsDragOver(true)
                }
            }}
            onDragEnter={() => {
                if (!isDragOver) {
                    setIsDragOver(true)
                }
            }}
            onDragLeave={() => {
                setIsDragOver(false)
            }}
            onDrop={(e) => {
                setIsDragOver(false)
                if (props.isDropZone) {
                    props.onDrop(e)
                }
            }}
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
                                mutator.duplicateCard(card.id)
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
                <PropertyValueElement
                    key={template.id}
                    readOnly={true}
                    card={card}
                    propertyTemplate={template}
                    emptyDisplayValue=''
                />
            ))}
        </div>
    )
}

export default injectIntl(KanbanCard)
