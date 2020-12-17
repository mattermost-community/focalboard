// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {FormattedMessage} from 'react-intl'

import {Card} from '../blocks/card'
import {Constants} from '../constants'
import mutator from '../mutator'
import {BoardTree} from '../viewModel/boardTree'
import Button from '../widgets/buttons/button'
import Editable from '../widgets/editable'

import PropertyValueElement from './propertyValueElement'
import './tableRow.scss'

type Props = {
    boardTree: BoardTree
    card: Card
    focusOnMount: boolean
    onSaveWithEnter: () => void
    showCard: (cardId: string) => void
    readonly: boolean
}

type State = {
    title: string
}

class TableRow extends React.Component<Props, State> {
    private titleRef = React.createRef<Editable>()
    constructor(props: Props) {
        super(props)
        this.state = {
            title: props.card.title,
        }
    }

    shouldComponentUpdate(): boolean {
        return true
    }

    componentDidMount(): void {
        if (this.props.focusOnMount) {
            setTimeout(() => this.titleRef.current?.focus(), 10)
        }
    }

    render(): JSX.Element {
        const {boardTree, card, onSaveWithEnter} = this.props
        const {board, activeView} = boardTree

        return (
            <div
                className='TableRow octo-table-row'
            >

                {/* Name / title */}

                <div
                    className='octo-table-cell title-cell'
                    id='mainBoardHeader'
                    style={{width: this.columnWidth(Constants.titleColumnId)}}
                >
                    <div className='octo-icontitle'>
                        <div className='octo-icon'>{card.icon}</div>
                        <Editable
                            ref={this.titleRef}
                            value={this.state.title}
                            placeholderText='Untitled'
                            onChange={(title: string) => this.setState({title})}
                            onSave={(saveType) => {
                                mutator.changeTitle(card, this.state.title)
                                if (saveType === 'onEnter') {
                                    onSaveWithEnter()
                                }
                            }}
                            onCancel={() => this.setState({title: card.title})}
                            readonly={this.props.readonly}
                        />
                    </div>

                    <div className='open-button'>
                        <Button onClick={() => this.props.showCard(this.props.card.id)}>
                            <FormattedMessage
                                id='TableRow.open'
                                defaultMessage='Open'
                            />
                        </Button>
                    </div>
                </div>

                {/* Columns, one per property */}

                {board.cardProperties.
                    filter((template) => activeView.visiblePropertyIds.includes(template.id)).
                    map((template) => {
                        return (
                            <div
                                className='octo-table-cell'
                                key={template.id}
                                style={{width: this.columnWidth(template.id)}}
                            >
                                <PropertyValueElement
                                    readOnly={this.props.readonly}
                                    card={card}
                                    boardTree={boardTree}
                                    propertyTemplate={template}
                                    emptyDisplayValue='Empty'
                                />
                            </div>)
                    })}
            </div>
        )
    }

    private columnWidth(templateId: string): number {
        return Math.max(Constants.minColumnWidth, this.props.boardTree.activeView.columnWidths[templateId] || 0)
    }

    focusOnTitle(): void {
        this.titleRef.current?.focus()
    }
}

export {TableRow}
