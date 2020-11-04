// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {FormattedMessage} from 'react-intl'

import {Constants} from '../constants'
import {BlockIcons} from '../blockIcons'
import {IPropertyTemplate} from '../blocks/board'
import {Card, MutableCard} from '../blocks/card'
import {BoardTree} from '../viewModel/boardTree'
import mutator from '../mutator'
import {Utils} from '../utils'

import MenuWrapper from '../widgets/menuWrapper'
import SortDownIcon from '../widgets/icons/sortDown'
import SortUpIcon from '../widgets/icons/sortUp'

import {CardDialog} from './cardDialog'
import RootPortal from './rootPortal'
import {TableRow} from './tableRow'
import ViewHeader from './viewHeader'
import ViewTitle from './viewTitle'
import TableHeaderMenu from './tableHeaderMenu'

import './tableComponent.scss'
import {HorizontalGrip} from './horizontalGrip'

import {MutableBoardView} from '../blocks/boardView'

type Props = {
    boardTree?: BoardTree
    showView: (id: string) => void
    setSearchText: (text: string) => void
}

type State = {
    shownCard?: Card
}

class TableComponent extends React.Component<Props, State> {
    private draggedHeaderTemplate: IPropertyTemplate
    private cardIdToRowMap = new Map<string, React.RefObject<TableRow>>()
    private cardIdToFocusOnRender: string
    state: State = {}

    shouldComponentUpdate(): boolean {
        return true
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
        const titleRef = React.createRef<HTMLDivElement>()

        this.cardIdToRowMap.clear()

        return (
            <div className='TableComponent octo-app'>
                {this.state.shownCard &&
                <RootPortal>
                    <CardDialog
                        boardTree={boardTree}
                        card={this.state.shownCard}
                        onClose={() => this.setState({shownCard: undefined})}
                    />
                </RootPortal>}
                <div className='octo-frame'>
                    <ViewTitle
                        key={board.id + board.title}
                        board={board}
                    />

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
                                    id='mainBoardHeader'
                                    ref={titleRef}
                                    className='octo-table-cell title-cell header-cell'
                                    style={{overflow: 'unset', width: this.columnWidth(Constants.titleColumnId)}}
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

                                    <div className='octo-spacer'/>

                                    <HorizontalGrip
                                        onDrag={(offset) => {
                                            const originalWidth = this.columnWidth(Constants.titleColumnId)
                                            const newWidth = Math.max(Constants.minColumnWidth, originalWidth + offset)
                                            titleRef.current.style.width = `${newWidth}px`
                                        }}
                                        onDragEnd={(offset) => {
                                            Utils.log(`onDragEnd offset: ${offset}`)
                                            const originalWidth = this.columnWidth(Constants.titleColumnId)
                                            const newWidth = Math.max(Constants.minColumnWidth, originalWidth + offset)
                                            titleRef.current.style.width = `${newWidth}px`

                                            const columnWidths = {...activeView.columnWidths}
                                            if (newWidth !== columnWidths[Constants.titleColumnId]) {
                                                columnWidths[Constants.titleColumnId] = newWidth

                                                const newView = new MutableBoardView(activeView)
                                                newView.columnWidths = columnWidths
                                                mutator.updateBlock(newView, activeView, 'resize column')
                                            }
                                        }}
                                    />
                                </div>

                                {/* Table header row */}

                                {board.cardProperties.
                                    filter((template) => activeView.visiblePropertyIds.includes(template.id)).
                                    map((template) => {
                                        const headerRef = React.createRef<HTMLDivElement>()
                                        let sortIcon = undefined
                                        const sortOption = activeView.sortOptions.find(o => o.propertyId === template.id)
                                        if (sortOption) {
                                            sortIcon = sortOption.reversed ? <SortUpIcon /> : <SortDownIcon />
                                        }

                                        return (<div
                                            key={template.id}
                                            ref={headerRef}
                                            style={{overflow: 'unset', width: this.columnWidth(template.id)}}
                                            className='octo-table-cell header-cell'

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
                                                    draggable={true}
                                                    onDragStart={() => {
                                                        this.draggedHeaderTemplate = template
                                                    }}
                                                    onDragEnd={() => {
                                                        this.draggedHeaderTemplate = undefined
                                                    }}
                                                >
                                                    {template.name}
                                                    {sortIcon}
                                                </div>
                                                <TableHeaderMenu
                                                    boardTree={boardTree}
                                                    templateId={template.id}
                                                />
                                            </MenuWrapper>

                                            <div className='octo-spacer'/>

                                            <HorizontalGrip
                                                onDrag={(offset) => {
                                                    const originalWidth = this.columnWidth(template.id)
                                                    const newWidth = Math.max(Constants.minColumnWidth, originalWidth + offset)
                                                    headerRef.current.style.width = `${newWidth}px`
                                                }}
                                                onDragEnd={(offset) => {
                                                    Utils.log(`onDragEnd offset: ${offset}`)
                                                    const originalWidth = this.columnWidth(template.id)
                                                    const newWidth = Math.max(Constants.minColumnWidth, originalWidth + offset)
                                                    headerRef.current.style.width = `${newWidth}px`

                                                    const columnWidths = {...activeView.columnWidths}
                                                    if (newWidth !== columnWidths[template.id]) {
                                                        columnWidths[template.id] = newWidth

                                                        const newView = new MutableBoardView(activeView)
                                                        newView.columnWidths = columnWidths
                                                        mutator.updateBlock(newView, activeView, 'resize column')
                                                    }
                                                }}
                                            />
                                        </div>)
                                    })}
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
                                    onSaveWithEnter={() => {
                                        console.log('WORKING')
                                        if (cards.length > 0 && cards[cards.length - 1] === card) {
                                            this.addCard(false)
                                        }
                                        console.log('STILL WORKING')
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

    private columnWidth(templateId: string): number {
        return Math.max(Constants.minColumnWidth, this.props.boardTree?.activeView?.columnWidths[templateId] || 0)
    }

    private addCard = async (show = false) => {
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
