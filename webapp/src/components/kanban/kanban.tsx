// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
/* eslint-disable max-lines */
import React from 'react'
import {FormattedMessage, injectIntl, IntlShape} from 'react-intl'

import {IPropertyOption} from '../../blocks/board'
import {Card} from '../../blocks/card'
import mutator from '../../mutator'
import {Utils} from '../../utils'
import {BoardTree} from '../../viewModel/boardTree'
import Button from '../../widgets/buttons/button'

import KanbanCard from './kanbanCard'
import KanbanColumn from './kanbanColumn'
import KanbanColumnHeader from './kanbanColumnHeader'
import KanbanHiddenColumnItem from './kanbanHiddenColumnItem'

import './kanban.scss'

type Props = {
    boardTree: BoardTree
    selectedCardIds: string[]
    intl: IntlShape
    readonly: boolean
    onCardClicked: (e: React.MouseEvent, card: Card) => void
    addCard: (groupByOptionId?: string) => Promise<void>
}

class Kanban extends React.Component<Props> {
    private draggedCards: Card[] = []
    private draggedHeaderOption?: IPropertyOption

    shouldComponentUpdate(): boolean {
        return true
    }

    render(): JSX.Element {
        const {boardTree} = this.props
        const {groupByProperty} = boardTree

        if (!groupByProperty) {
            Utils.assertFailure('Board views must have groupByProperty set')
            return <div/>
        }

        const propertyValues = groupByProperty.options || []
        Utils.log(`${propertyValues.length} propertyValues`)

        const {board, activeView, visibleGroups, hiddenGroups} = boardTree
        const visiblePropertyTemplates = board.cardProperties.filter((template) => activeView.visiblePropertyIds.includes(template.id))
        const isManualSort = activeView.sortOptions.length < 1

        return (
            <div className='Kanban'>
                <div
                    className='octo-board-header'
                    id='mainBoardHeader'
                >
                    {/* Column headers */}

                    {visibleGroups.map((group) => (
                        <KanbanColumnHeader
                            key={group.option.id}
                            group={group}
                            boardTree={boardTree}
                            intl={this.props.intl}
                            addCard={this.props.addCard}
                            readonly={this.props.readonly}
                            propertyNameChanged={this.propertyNameChanged}
                            onDropToColumn={this.onDropToColumn}
                            setDraggedHeaderOption={(draggedHeaderOption?: IPropertyOption) => {
                                this.draggedHeaderOption = draggedHeaderOption
                            }}
                        />
                    ))}

                    {/* Hidden column header */}

                    {hiddenGroups.length > 0 &&
                        <div className='octo-board-header-cell narrow'>
                            <FormattedMessage
                                id='BoardComponent.hidden-columns'
                                defaultMessage='Hidden columns'
                            />
                        </div>
                    }

                    {!this.props.readonly &&
                        <div className='octo-board-header-cell narrow'>
                            <Button
                                onClick={this.addGroupClicked}
                            >
                                <FormattedMessage
                                    id='BoardComponent.add-a-group'
                                    defaultMessage='+ Add a group'
                                />
                            </Button>
                        </div>
                    }
                </div>

                {/* Main content */}

                <div
                    className='octo-board-body'
                    id='mainBoardBody'
                >
                    {/* Columns */}

                    {visibleGroups.map((group) => (
                        <KanbanColumn
                            key={group.option.id || 'empty'}
                            isDropZone={!isManualSort || group.cards.length < 1}
                            onDrop={() => this.onDropToColumn(group.option)}
                        >
                            {group.cards.map((card) => (
                                <KanbanCard
                                    card={card}
                                    visiblePropertyTemplates={visiblePropertyTemplates}
                                    key={card.id}
                                    readonly={this.props.readonly}
                                    isSelected={this.props.selectedCardIds.includes(card.id)}
                                    onClick={(e) => {
                                        this.props.onCardClicked(e, card)
                                    }}
                                    onDragStart={() => {
                                        if (this.props.selectedCardIds.includes(card.id)) {
                                            this.draggedCards = this.props.selectedCardIds.map((id) => boardTree.allCards.find((o) => o.id === id)!)
                                        } else {
                                            this.draggedCards = [card]
                                        }
                                    }}
                                    onDragEnd={() => {
                                        this.draggedCards = []
                                    }}

                                    isDropZone={isManualSort}
                                    onDrop={() => {
                                        this.onDropToCard(card)
                                    }}
                                />
                            ))}
                            {!this.props.readonly &&
                                <Button
                                    onClick={() => {
                                        this.props.addCard(group.option.id)
                                    }}
                                >
                                    <FormattedMessage
                                        id='BoardComponent.neww'
                                        defaultMessage='+ New'
                                    />
                                </Button>
                            }
                        </KanbanColumn>
                    ))}

                    {/* Hidden columns */}

                    {hiddenGroups.length > 0 &&
                        <div className='octo-board-column narrow'>
                            {hiddenGroups.map((group) => (
                                <KanbanHiddenColumnItem
                                    key={group.option.id}
                                    group={group}
                                    boardTree={boardTree}
                                    intl={this.props.intl}
                                    readonly={this.props.readonly}
                                    onDropToColumn={this.onDropToColumn}
                                    hasDraggedCards={this.draggedCards.length > 0}
                                />
                            ))}
                        </div>}
                </div>
            </div>
        )
    }

    private async propertyNameChanged(option: IPropertyOption, text: string): Promise<void> {
        const {boardTree} = this.props

        await mutator.changePropertyOptionValue(boardTree, boardTree.groupByProperty!, option, text)
    }

    private addGroupClicked = async () => {
        Utils.log('onAddGroupClicked')

        const {boardTree} = this.props

        const option: IPropertyOption = {
            id: Utils.createGuid(),
            value: 'New group',
            color: 'propColorDefault',
        }

        await mutator.insertPropertyOption(boardTree, boardTree.groupByProperty!, option, 'add group')
    }

    private onDropToColumn = async (option: IPropertyOption) => {
        const {boardTree} = this.props
        const {draggedCards, draggedHeaderOption} = this
        const optionId = option ? option.id : undefined

        Utils.assertValue(boardTree)

        if (draggedCards.length > 0) {
            await mutator.performAsUndoGroup(async () => {
                const description = draggedCards.length > 1 ? `drag ${draggedCards.length} cards` : 'drag card'
                const awaits = []
                for (const draggedCard of draggedCards) {
                    Utils.log(`ondrop. Card: ${draggedCard.title}, column: ${optionId}`)
                    const oldValue = draggedCard.properties[boardTree.groupByProperty!.id]
                    if (optionId !== oldValue) {
                        awaits.push(mutator.changePropertyValue(draggedCard, boardTree.groupByProperty!.id, optionId, description))
                    }
                }
                await Promise.all(awaits)
            })
        } else if (draggedHeaderOption) {
            Utils.log(`ondrop. Header option: ${draggedHeaderOption.value}, column: ${option?.value}`)

            // Move option to new index
            const visibleOptionIds = boardTree.visibleGroups.map((o) => o.option.id)

            const {activeView} = boardTree
            const srcIndex = visibleOptionIds.indexOf(draggedHeaderOption.id)
            const destIndex = visibleOptionIds.indexOf(option.id)

            visibleOptionIds.splice(destIndex, 0, visibleOptionIds.splice(srcIndex, 1)[0])

            await mutator.changeViewVisibleOptionIds(activeView, visibleOptionIds)
        }
    }

    private async onDropToCard(card: Card) {
        Utils.log(`onDropToCard: ${card.title}`)
        const {boardTree} = this.props
        const {activeView} = boardTree
        const {draggedCards} = this
        const optionId = card.properties[activeView.groupById!]

        if (draggedCards.length < 1 || draggedCards.includes(card)) {
            return
        }

        const description = draggedCards.length > 1 ? `drag ${draggedCards.length} cards` : 'drag card'

        // Update card order
        let cardOrder = boardTree.orderedCards().map((o) => o.id)
        const draggedCardIds = draggedCards.map((o) => o.id)
        const firstDraggedCard = draggedCards[0]
        const isDraggingDown = cardOrder.indexOf(firstDraggedCard.id) <= cardOrder.indexOf(card.id)
        cardOrder = cardOrder.filter((id) => !draggedCardIds.includes(id))
        let destIndex = cardOrder.indexOf(card.id)
        if (firstDraggedCard.properties[boardTree.groupByProperty!.id] === optionId && isDraggingDown) {
            // If the cards are in the same column and dragging down, drop after the target card
            destIndex += 1
        }
        cardOrder.splice(destIndex, 0, ...draggedCardIds)

        await mutator.performAsUndoGroup(async () => {
            // Update properties of dragged cards
            const awaits = []
            for (const draggedCard of draggedCards) {
                Utils.log(`draggedCard: ${draggedCard.title}, column: ${optionId}`)
                const oldOptionId = draggedCard.properties[boardTree.groupByProperty!.id]
                if (optionId !== oldOptionId) {
                    awaits.push(mutator.changePropertyValue(draggedCard, boardTree.groupByProperty!.id, optionId, description))
                }
            }
            await Promise.all(awaits)
            await mutator.changeViewCardOrder(activeView, cardOrder, description)
        })
    }
}

export default injectIntl(Kanban)
