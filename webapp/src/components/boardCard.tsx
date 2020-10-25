// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {injectIntl, IntlShape} from 'react-intl'

import {MutableBlock} from '../blocks/block'

import {IPropertyTemplate} from '../blocks/board'
import {Card} from '../blocks/card'
import mutator from '../mutator'
import {OctoUtils} from '../octoUtils'
import MenuWrapper from '../widgets/menuWrapper'
import Menu from '../widgets/menu'

import './boardCard.scss'

type BoardCardProps = {
    card: Card
    visiblePropertyTemplates: IPropertyTemplate[]
    isSelected: boolean
    onClick?: (e: React.MouseEvent<HTMLDivElement>) => void
    onDragStart?: (e: React.DragEvent<HTMLDivElement>) => void
    onDragEnd?: (e: React.DragEvent<HTMLDivElement>) => void
    intl: IntlShape
}

type BoardCardState = {
    isDragged?: boolean
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
        const className = this.props.isSelected ? 'BoardCard octo-board-card selected' : 'BoardCard octo-board-card'

        const element = (
            <div
                className={className}
                draggable={true}
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
            >
                <MenuWrapper stopPropagationOnToggle={true}>
                    <div className='octo-hoverbutton square'><div className='imageOptions'/></div>
                    <Menu>
                        <Menu.Text
                            id='delete'
                            name={intl.formatMessage({id: 'BoardCard.delete', defaultMessage: 'Delete'})}
                            onClick={() => mutator.deleteBlock(card, 'delete card')}
                        />
                        <Menu.Text
                            id='duplicate'
                            name={intl.formatMessage({id: 'BoardCard.duplicate', defaultMessage: 'Duplicate'})}
                            onClick={() => mutator.insertBlock(MutableBlock.duplicate(card), 'duplicate card')}
                        />
                    </Menu>
                </MenuWrapper>

                <div className='octo-icontitle'>
                    { card.icon ? <div className='octo-icon'>{card.icon}</div> : undefined }
                    <div key='__title'>{card.title || intl.formatMessage({id: 'BoardCard.untitled', defaultMessage: 'Untitled'})}</div>
                </div>
                {visiblePropertyTemplates.map((template) => {
                    return OctoUtils.propertyValueReadonlyElement(card, template, '')
                })}
            </div>
        )

        return element
    }
}

export default injectIntl(BoardCard)
