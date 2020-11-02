// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {FormattedMessage} from 'react-intl'

import {BoardTree} from '../viewModel/boardTree'
import {Card} from '../blocks/card'
import mutator from '../mutator'

import Editable from '../widgets/editable'
import Button from '../widgets/buttons/button'

import PropertyValueElement from './propertyValueElement'
import {CardDialog} from './cardDialog'
import RootPortal from './rootPortal'

import './tableRow.scss'

type Props = {
    boardTree: BoardTree
    card: Card
    focusOnMount: boolean
    onSaveWithEnter: () => void
}

type State = {
    showCard: boolean
    title: string
}

class TableRow extends React.Component<Props, State> {
    private titleRef = React.createRef<Editable>()
    constructor(props: Props) {
        super(props)
        this.state = {
            showCard: false,
            title: props.card.title,
        }
    }

    shouldComponentUpdate(): boolean {
        return true
    }

    componentDidMount(): void {
        if (this.props.focusOnMount) {
            setTimeout(() => this.titleRef.current.focus(), 10)
        }
    }

    render(): JSX.Element {
        const {boardTree, card, onSaveWithEnter} = this.props
        const {board, activeView} = boardTree

        return (
            <div
                className='TableRow octo-table-row'
                key={card.id}
            >

                {/* Name / title */}

                <div
                    className='octo-table-cell title-cell'
                    id='mainBoardHeader'
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
                        />
                    </div>

                    <div className='open-button'>
                        <Button onClick={() => this.setState({showCard: true})}>
                            <FormattedMessage
                                id='TableRow.open'
                                defaultMessage='Open'
                            />
                        </Button>
                    </div>
                    {this.state.showCard &&
                    <RootPortal>
                        <CardDialog
                            boardTree={boardTree}
                            card={card}
                            onClose={() => this.setState({showCard: false})}
                        />
                    </RootPortal>}
                </div>

                {/* Columns, one per property */}

                {board.cardProperties.
                    filter((template) => activeView.visiblePropertyIds.includes(template.id)).
                    map((template) => {
                        return (
                            <div
                                className='octo-table-cell'
                                key={template.id}
                            >
                                <PropertyValueElement
                                    readOnly={false}
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

    focusOnTitle(): void {
        this.titleRef.current?.focus()
    }
}

export {TableRow}
