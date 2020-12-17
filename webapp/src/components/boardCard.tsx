// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {injectIntl, IntlShape} from 'react-intl'

import {IPropertyTemplate} from '../blocks/board'
import {Card} from '../blocks/card'
import mutator from '../mutator'
import IconButton from '../widgets/buttons/iconButton'
import DeleteIcon from '../widgets/icons/delete'
import DuplicateIcon from '../widgets/icons/duplicate'
import OptionsIcon from '../widgets/icons/options'
import Menu from '../widgets/menu'
import MenuWrapper from '../widgets/menuWrapper'

import './boardCard.scss'
import PropertyValueElement from './propertyValueElement'

type BoardCardProps = {
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

type BoardCardState = {
    isDragged?: boolean
    isDragOver?: boolean
}

class BoardCard extends React.Component<BoardCardProps, BoardCardState> {
    constructor(props: BoardCardProps) {
        super(props)
        this.state = {}
    }

    shouldComponentUpdate(): boolean {
        return true
    }

    render(): JSX.Element {
        const {card, intl} = this.props
        const visiblePropertyTemplates = this.props.visiblePropertyTemplates || []
        let className = this.props.isSelected ? 'BoardCard selected' : 'BoardCard'
        if (this.props.isDropZone && this.state.isDragOver) {
            className += ' dragover'
        }

        const element = (
            <div
                className={className}
                draggable={!this.props.readonly}
                style={{opacity: this.state.isDragged ? 0.5 : 1}}
                onClick={this.props.onClick}
                onDragStart={(e) => {
                    this.setState({isDragged: true})
                    this.props.onDragStart(e)
                }}
                onDragEnd={(e) => {
                    this.setState({isDragged: false})
                    this.props.onDragEnd(e)
                }}

                onDragOver={() => {
                    if (!this.state.isDragOver) {
                        this.setState({isDragOver: true})
                    }
                }}
                onDragEnter={() => {
                    if (!this.state.isDragOver) {
                        this.setState({isDragOver: true})
                    }
                }}
                onDragLeave={() => {
                    this.setState({isDragOver: false})
                }}
                onDrop={(e) => {
                    this.setState({isDragOver: false})
                    if (this.props.isDropZone) {
                        this.props.onDrop(e)
                    }
                }}
            >
                {!this.props.readonly &&
                    <MenuWrapper
                        className='optionsMenu'
                        stopPropagationOnToggle={true}
                    >
                        <IconButton icon={<OptionsIcon/>}/>
                        <Menu position='left'>
                            <Menu.Text
                                icon={<DeleteIcon/>}
                                id='delete'
                                name={intl.formatMessage({id: 'BoardCard.delete', defaultMessage: 'Delete'})}
                                onClick={() => mutator.deleteBlock(card, 'delete card')}
                            />
                            <Menu.Text
                                icon={<DuplicateIcon/>}
                                id='duplicate'
                                name={intl.formatMessage({id: 'BoardCard.duplicate', defaultMessage: 'Duplicate'})}
                                onClick={() => {
                                    mutator.duplicateCard(card.id)
                                }}
                            />
                        </Menu>
                    </MenuWrapper>
                }

                <div className='octo-icontitle'>
                    { card.icon ? <div className='octo-icon'>{card.icon}</div> : undefined }
                    <div key='__title'>{card.title || intl.formatMessage({id: 'BoardCard.untitled', defaultMessage: 'Untitled'})}</div>
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

        return element
    }
}

export default injectIntl(BoardCard)
