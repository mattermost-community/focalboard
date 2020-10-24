// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {FormattedMessage} from 'react-intl'

import {BlockIcons} from '../blockIcons'
import {IPropertyTemplate} from '../blocks/board'
import {Card, MutableCard} from '../blocks/card'
import {BoardTree} from '../viewModel/boardTree'
import mutator from '../mutator'
import {Utils} from '../utils'

import MenuWrapper from '../widgets/menuWrapper'

import {CardDialog} from './cardDialog'
import {Editable} from './editable'
import RootPortal from './rootPortal'
import {TableRow} from './tableRow'
import ViewHeader from './viewHeader'
import ViewTitle from './viewTitle'
import TableHeaderMenu from './tableHeaderMenu'

type Props = {
    boardTree?: BoardTree
    showView: (id: string) => void
    setSearchText: (text: string) => void
}

type State = {
    isSearching: boolean
    shownCard?: Card
    viewMenu: boolean
    showFilter: boolean
}

class TableComponent extends React.Component<Props, State> {
    private draggedHeaderTemplate: IPropertyTemplate
    private cardIdToRowMap = new Map<string, React.RefObject<TableRow>>()
    private cardIdToFocusOnRender: string
    private searchFieldRef = React.createRef<Editable>()

    constructor(props: Props) {
        super(props)
        this.state = {isSearching: Boolean(this.props.boardTree?.getSearchText()), viewMenu: false, showFilter: false}
    }

    shouldComponentUpdate(): boolean {
        return true
    }

    componentDidUpdate(prevPros: Props, prevState: State): void {
        if (this.state.isSearching && !prevState.isSearching) {
            this.searchFieldRef.current.focus()
        }
    }

    render(): JSX.Element {
        const {boardTree, showView} = this.props

        if (!boardTree || !boardTree.board) {
            return (
                <div>
                    <FormattedMessage
                        id='TableComponent.loading'
                        defaultMessage='Loading...'
                    />
                </div>
            )
        }

        const {board, cards, activeView} = boardTree

        this.cardIdToRowMap.clear()

        return (
            <div className='octo-app'>
                {this.state.shownCard &&
                <RootPortal>
                    <CardDialog
                        boardTree={boardTree}
                        card={this.state.shownCard}
                        onClose={() => this.setState({shownCard: undefined})}
                    />
                </RootPortal>}
                <div className='octo-frame'>
                    <ViewTitle board={board}/>

                    <div className='octo-table'>
                        <ViewHeader
                            boardTree={boardTree}
                            showView={showView}
                            setSearchText={this.props.setSearchText}
                            addCard={this.addCard}
                        />

                        {/* Main content */}

                        <div className='octo-table-body'>

                            {/* Headers */}

                            <div
                                className='octo-table-header'
                                id='mainBoardHeader'
                            >
                                <div
                                    className='octo-table-cell title-cell'
                                    style={{overflow: 'unset'}}
                                    id='mainBoardHeader'
                                >
                                    <MenuWrapper>
                                        <div
                                            className='octo-label'
                                            style={{cursor: 'pointer'}}
                                        >
                                            <FormattedMessage
                                                id='TableComponent.name'
                                                defaultMessage='Name'
                                            />
                                        </div>
                                        <TableHeaderMenu
                                            boardTree={boardTree}
                                            templateId='__name'
                                        />
                                    </MenuWrapper>
                                </div>

                                {board.cardProperties.
                                    filter((template) => activeView.visiblePropertyIds.includes(template.id)).
                                    map((template) =>
                                        (<div
                                            key={template.id}
                                            style={{overflow: 'unset'}}
                                            className='octo-table-cell'

                                            draggable={true}
                                            onDragStart={() => {
                                                this.draggedHeaderTemplate = template
                                            }}
                                            onDragEnd={() => {
                                                this.draggedHeaderTemplate = undefined
                                            }}

                                            onDragOver={(e) => {
                                                e.preventDefault(); (e.target as HTMLElement).classList.add('dragover')
                                            }}
                                            onDragEnter={(e) => {
                                                e.preventDefault(); (e.target as HTMLElement).classList.add('dragover')
                                            }}
                                            onDragLeave={(e) => {
                                                e.preventDefault(); (e.target as HTMLElement).classList.remove('dragover')
                                            }}
                                            onDrop={(e) => {
                                                e.preventDefault(); (e.target as HTMLElement).classList.remove('dragover'); this.onDropToColumn(template)
                                            }}
                                        >
                                            <MenuWrapper>
                                                <div
                                                    className='octo-label'
                                                    style={{cursor: 'pointer'}}
                                                >{template.name}</div>
                                                <TableHeaderMenu
                                                    boardTree={boardTree}
                                                    templateId={template.id}
                                                />
                                            </MenuWrapper>
                                        </div>),
                                    )}
                            </div>

                            {/* Rows, one per card */}

                            {cards.map((card) => {
                                const openButonRef = React.createRef<HTMLDivElement>()
                                const tableRowRef = React.createRef<TableRow>()

                                let focusOnMount = false
                                if (this.cardIdToFocusOnRender && this.cardIdToFocusOnRender === card.id) {
                                    this.cardIdToFocusOnRender = undefined
                                    focusOnMount = true
                                }

                                const tableRow = (<TableRow
                                    key={card.id}
                                    ref={tableRowRef}
                                    boardTree={boardTree}
                                    card={card}
                                    focusOnMount={focusOnMount}
                                    onKeyDown={(e) => {
                                        if (e.keyCode === 13) {
                                            // Enter: Insert new card if on last row
                                            if (cards.length > 0 && cards[cards.length - 1] === card) {
                                                this.addCard(false)
                                            }
                                        }
                                    }}
                                />)

                                this.cardIdToRowMap.set(card.id, tableRowRef)

                                return tableRow
                            })}

                            {/* Add New row */}

                            <div className='octo-table-footer'>
                                <div
                                    className='octo-table-cell'
                                    onClick={() => {
                                        this.addCard()
                                    }}
                                >
                                    <FormattedMessage
                                        id='TableComponent.plus-new'
                                        defaultMessage='+ New'
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div >
            </div >
        )
    }

    private focusOnCardTitle(cardId: string): void {
        const tableRowRef = this.cardIdToRowMap.get(cardId)
        Utils.log(`focusOnCardTitle, ${tableRowRef?.current ?? 'undefined'}`)
        tableRowRef?.current.focusOnTitle()
    }

    private async addCard(show = false) {
        const {boardTree} = this.props

        const card = new MutableCard()
        card.parentId = boardTree.board.id
        card.icon = BlockIcons.shared.randomIcon()
        await mutator.insertBlock(
            card,
            'add card',
            async () => {
                if (show) {
                    this.setState({shownCard: card})
                } else {
                    // Focus on this card's title inline on next render
                    this.cardIdToFocusOnRender = card.id
                }
            },
        )
    }

    private async onDropToColumn(template: IPropertyTemplate) {
        const {draggedHeaderTemplate} = this
        if (!draggedHeaderTemplate) {
            return
        }

        const {boardTree} = this.props
        const {board} = boardTree

        Utils.assertValue(mutator)
        Utils.assertValue(boardTree)

        Utils.log(`ondrop. Source column: ${draggedHeaderTemplate.name}, dest column: ${template.name}`)

        // Move template to new index
        const destIndex = template ? board.cardProperties.indexOf(template) : 0
        await mutator.changePropertyTemplateOrder(board, draggedHeaderTemplate, destIndex)
    }
}

export {TableComponent}
