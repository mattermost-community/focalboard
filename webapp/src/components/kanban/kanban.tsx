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
    addCard: (groupByOptionId?: string, show?:boolean) => Promise<void>
}

type State = {
    draggedCards: Card[]
    draggedHeaderOption?: IPropertyOption
}

class Kanban extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = {
            draggedCards: [],
        }
    }

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
                            onDrop={(card: Card) => this.onDropToColumn(group.option, card)}
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
                                    onDrop={this.onDropToCard}
                                    isManualSort={isManualSort}
                                />
                            ))}
                            {!this.props.readonly &&
                                <Button
                                    onClick={() => {
                                        this.props.addCard(group.option.id, true)
                                    }}
                                >
                                    <FormattedMessage
                                        id='BoardComponent.new'
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
                                    onDrop={(card: Card) => this.onDropToColumn(group.option, card)}
                                />
                            ))}
                        </div>}
                </div>
            </div>
        )
    }

    private propertyNameChanged = async (option: IPropertyOption, text: string): Promise<void> => {
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

    private onDropToColumn = async (option: IPropertyOption, card?: Card, dstOption?: IPropertyOption) => {
        const {boardTree, selectedCardIds} = this.props
        const optionId = option ? option.id : undefined

        let draggedCardIds = selectedCardIds
        if (card) {
            draggedCardIds = Array.from(new Set(selectedCardIds).add(card.id))
        }

        Utils.assertValue(boardTree)

        if (draggedCardIds.length > 0) {
            const orderedCards = boardTree.orderedCards()
            const cardsById: {[key: string]: Card} = orderedCards.reduce((acc: {[key: string]: Card}, c: Card): {[key: string]: Card} => {
                acc[c.id] = c
                return acc
            }, {})
            const draggedCards: Card[] = draggedCardIds.map((o: string) => cardsById[o])
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
        } else if (dstOption) {
            Utils.log(`ondrop. Header option: ${dstOption.value}, column: ${option?.value}`)

            // Move option to new index
            const visibleOptionIds = boardTree.visibleGroups.map((o) => o.option.id)

            const {activeView} = boardTree
            const srcIndex = visibleOptionIds.indexOf(dstOption.id)
            const destIndex = visibleOptionIds.indexOf(option.id)

            visibleOptionIds[srcIndex] = option.id
            visibleOptionIds[destIndex] = dstOption.id

            await mutator.changeViewVisibleOptionIds(activeView, visibleOptionIds)
        }
    }

    private onDropToCard = async (srcCard: Card, dstCard: Card) => {
        Utils.log(`onDropToCard: ${dstCard.title}`)
        const {boardTree, selectedCardIds} = this.props
        const {activeView} = boardTree
        const optionId = dstCard.properties[activeView.groupById!]

        const draggedCardIds = Array.from(new Set(selectedCardIds).add(srcCard.id))

        const description = draggedCardIds.length > 1 ? `drag ${draggedCardIds.length} cards` : 'drag card'

        // Update dstCard order
        const orderedCards = boardTree.orderedCards()
        const cardsById: {[key: string]: Card} = orderedCards.reduce((acc: {[key: string]: Card}, card: Card): {[key: string]: Card} => {
            acc[card.id] = card
            return acc
        }, {})
        const draggedCards: Card[] = draggedCardIds.map((o: string) => cardsById[o])
        let cardOrder = orderedCards.map((o) => o.id)
        const isDraggingDown = cardOrder.indexOf(srcCard.id) <= cardOrder.indexOf(dstCard.id)
        cardOrder = cardOrder.filter((id) => !draggedCardIds.includes(id))
        let destIndex = cardOrder.indexOf(dstCard.id)
        if (srcCard.properties[boardTree.groupByProperty!.id] === optionId && isDraggingDown) {
            // If the cards are in the same column and dragging down, drop after the target dstCard
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
