// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react'
import {FormattedMessage, injectIntl} from 'react-intl'

import {IPropertyTemplate} from '../../blocks/board'
import {MutableBoardView} from '../../blocks/boardView'
import {Card} from '../../blocks/card'
import {Constants} from '../../constants'
import mutator from '../../mutator'
import {Utils} from '../../utils'
import {BoardTree} from '../../viewModel/boardTree'
import SortDownIcon from '../../widgets/icons/sortDown'
import SortUpIcon from '../../widgets/icons/sortUp'
import MenuWrapper from '../../widgets/menuWrapper'

import {HorizontalGrip} from '../horizontalGrip'

import './table.scss'
import TableHeaderMenu from './tableHeaderMenu'
import TableRow from './tableRow'

type Props = {
    boardTree: BoardTree
    selectedCardIds: string[]
    readonly: boolean
    cardIdToFocusOnRender: string
    showCard: (cardId?: string) => void
    addCard: (show: boolean) => Promise<void>
    onCardClicked: (e: React.MouseEvent, card: Card) => void
}

type State = {
    shownCardId?: string
}

class Table extends React.Component<Props, State> {
    private draggedHeaderTemplate?: IPropertyTemplate
    private cardIdToRowMap = new Map<string, React.RefObject<TableRow>>()
    state: State = {}

    shouldComponentUpdate(): boolean {
        return true
    }

    render(): JSX.Element {
        const {boardTree} = this.props
        const {board, cards, activeView} = boardTree
        const titleRef = React.createRef<HTMLDivElement>()

        let titleSortIcon: React.ReactNode
        const titleSortOption = activeView.sortOptions.find((o) => o.propertyId === Constants.titleColumnId)
        if (titleSortOption) {
            titleSortIcon = titleSortOption.reversed ? <SortUpIcon/> : <SortDownIcon/>
        }

        this.cardIdToRowMap.clear()

        return (
            <div className='octo-table-body Table'>

                {/* Headers */}

                <div
                    className='octo-table-header'
                    id='mainBoardHeader'
                >
                    <div
                        id='mainBoardHeader'
                        ref={titleRef}
                        className='octo-table-cell header-cell'
                        style={{overflow: 'unset', width: this.columnWidth(Constants.titleColumnId)}}
                    >
                        <MenuWrapper disabled={this.props.readonly}>
                            <div
                                className='octo-label'
                            >
                                <FormattedMessage
                                    id='TableComponent.name'
                                    defaultMessage='Name'
                                />
                                {titleSortIcon}
                            </div>
                            <TableHeaderMenu
                                boardTree={boardTree}
                                templateId={Constants.titleColumnId}
                            />
                        </MenuWrapper>

                        <div className='octo-spacer'/>

                        {!this.props.readonly &&
                            <HorizontalGrip
                                onDrag={(offset) => {
                                    const originalWidth = this.columnWidth(Constants.titleColumnId)
                                    const newWidth = Math.max(Constants.minColumnWidth, originalWidth + offset)
                                    if (titleRef.current) {
                                        titleRef.current.style.width = `${newWidth}px`
                                    }
                                }}
                                onDragEnd={(offset) => {
                                    Utils.log(`onDragEnd offset: ${offset}`)
                                    const originalWidth = this.columnWidth(Constants.titleColumnId)
                                    const newWidth = Math.max(Constants.minColumnWidth, originalWidth + offset)
                                    if (titleRef.current) {
                                        titleRef.current.style.width = `${newWidth}px`
                                    }

                                    const columnWidths = {...activeView.columnWidths}
                                    if (newWidth !== columnWidths[Constants.titleColumnId]) {
                                        columnWidths[Constants.titleColumnId] = newWidth

                                        const newView = new MutableBoardView(activeView)
                                        newView.columnWidths = columnWidths
                                        mutator.updateBlock(newView, activeView, 'resize column')
                                    }
                                }}
                            />
                        }
                    </div>

                    {/* Table header row */}

                    {board.cardProperties.
                        filter((template) => activeView.visiblePropertyIds.includes(template.id)).
                        map((template) => {
                            const headerRef = React.createRef<HTMLDivElement>()
                            let sortIcon
                            const sortOption = activeView.sortOptions.find((o) => o.propertyId === template.id)
                            if (sortOption) {
                                sortIcon = sortOption.reversed ? <SortUpIcon/> : <SortDownIcon/>
                            }

                            return (
                                <div
                                    key={template.id}
                                    ref={headerRef}
                                    style={{overflow: 'unset', width: this.columnWidth(template.id)}}
                                    className='octo-table-cell header-cell'

                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        (e.target as HTMLElement).classList.add('dragover')
                                    }}
                                    onDragEnter={(e) => {
                                        e.preventDefault();
                                        (e.target as HTMLElement).classList.add('dragover')
                                    }}
                                    onDragLeave={(e) => {
                                        e.preventDefault();
                                        (e.target as HTMLElement).classList.remove('dragover')
                                    }}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        (e.target as HTMLElement).classList.remove('dragover')
                                        this.onDropToColumn(template)
                                    }}
                                >
                                    <MenuWrapper
                                        disabled={this.props.readonly}
                                    >
                                        <div
                                            className='octo-label'
                                            draggable={!this.props.readonly}
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

                                    {!this.props.readonly &&
                                        <HorizontalGrip
                                            onDrag={(offset) => {
                                                const originalWidth = this.columnWidth(template.id)
                                                const newWidth = Math.max(Constants.minColumnWidth, originalWidth + offset)
                                                if (headerRef.current) {
                                                    headerRef.current.style.width = `${newWidth}px`
                                                }
                                            }}
                                            onDragEnd={(offset) => {
                                                Utils.log(`onDragEnd offset: ${offset}`)
                                                const originalWidth = this.columnWidth(template.id)
                                                const newWidth = Math.max(Constants.minColumnWidth, originalWidth + offset)
                                                if (headerRef.current) {
                                                    headerRef.current.style.width = `${newWidth}px`
                                                }

                                                const columnWidths = {...activeView.columnWidths}
                                                if (newWidth !== columnWidths[template.id]) {
                                                    columnWidths[template.id] = newWidth

                                                    const newView = new MutableBoardView(activeView)
                                                    newView.columnWidths = columnWidths
                                                    mutator.updateBlock(newView, activeView, 'resize column')
                                                }
                                            }}
                                        />
                                    }
                                </div>)
                        })}
                </div>

                {/* Rows, one per card */}

                {cards.map((card) => {
                    const tableRowRef = React.createRef<TableRow>()

                    const tableRow = (
                        <TableRow
                            key={card.id + card.updateAt}
                            ref={tableRowRef}
                            boardTree={boardTree}
                            card={card}
                            isSelected={this.props.selectedCardIds.includes(card.id)}
                            focusOnMount={this.props.cardIdToFocusOnRender === card.id}
                            onSaveWithEnter={() => {
                                if (cards.length > 0 && cards[cards.length - 1] === card) {
                                    this.props.addCard(false)
                                }
                            }}
                            onClick={(e: React.MouseEvent<HTMLDivElement>) => {
                                this.props.onCardClicked(e, card)
                            }}
                            showCard={this.props.showCard}
                            readonly={this.props.readonly}
                        />)

                    this.cardIdToRowMap.set(card.id, tableRowRef)

                    return tableRow
                })}

                {/* Add New row */}

                <div className='octo-table-footer'>
                    {!this.props.readonly &&
                        <div
                            className='octo-table-cell'
                            onClick={() => {
                                this.props.addCard(false)
                            }}
                        >
                            <FormattedMessage
                                id='TableComponent.plus-new'
                                defaultMessage='+ New'
                            />
                        </div>
                    }
                </div>
            </div>
        )
    }

    private columnWidth(templateId: string): number {
        return Math.max(Constants.minColumnWidth, this.props.boardTree.activeView.columnWidths[templateId] || 0)
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

export default Table
