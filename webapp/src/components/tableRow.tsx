// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'

import {BoardTree} from '../viewModel/boardTree'
import {Card} from '../blocks/card'
import mutator from '../mutator'

import Editable from '../widgets/editable'

import PropertyValueElement from './propertyValueElement'
import {CardDialog} from './cardDialog'
import RootPortal from './rootPortal'

type Props = {
    boardTree: BoardTree
    card: Card
    focusOnMount: boolean
    onKeyDown: (e: React.KeyboardEvent) => void
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
            this.titleRef.current.focus()
        }
    }

    render(): JSX.Element {
        const {boardTree, card, onKeyDown} = this.props
        const {board, activeView} = boardTree

        const openButonRef = React.createRef<HTMLDivElement>()

        return (
            <div
                className='octo-table-row'
                key={card.id}
            >

                {/* Name / title */}

                <div
                    className='octo-table-cell title-cell'
                    id='mainBoardHeader'
                    onMouseOver={() => {
                        openButonRef.current.style.display = null
                    }}
                    onMouseLeave={() => {
                        openButonRef.current.style.display = 'none'
                    }}
                >
                    <div className='octo-icontitle'>
                        <div className='octo-icon'>{card.icon}</div>
                        <Editable
                            ref={this.titleRef}
                            value={this.state.title}
                            placeholderText='Untitled'
                            onChange={(title: string) => this.setState({title})}
                            onBlur={() => mutator.changeTitle(card, this.state.title)}
                            onFocus={() => this.titleRef.current.focus()}
                            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>): void => {
                                if (e.keyCode === 27 && !(e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey) { // ESC
                                    e.stopPropagation()
                                    this.setState({title: card.title})
                                    setTimeout(() => this.titleRef.current.blur(), 0)
                                } else if (e.keyCode === 13 && !(e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey) { // Return
                                    e.stopPropagation()
                                    mutator.changeTitle(card, this.state.title)
                                    this.titleRef.current.blur()
                                }
                                onKeyDown(e)
                            }}
                        />
                    </div>

                    <div
                        ref={openButonRef}
                        className='octo-hoverbutton'
                        style={{display: 'none'}}
                        onClick={() => {
                            this.setState({showCard: true})
                        }}
                    >Open</div>
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
