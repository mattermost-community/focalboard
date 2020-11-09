// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {Board, IPropertyOption, IPropertyTemplate, MutableBoard} from '../blocks/board'
import {BoardView, MutableBoardView} from '../blocks/boardView'
import {Card, MutableCard} from '../blocks/card'
import {CardFilter} from '../cardFilter'
import {Constants} from '../constants'
import octoClient from '../octoClient'
import {IBlock, IMutableBlock} from '../blocks/block'
import {OctoUtils} from '../octoUtils'
import {Utils} from '../utils'

type Group = {
    option: IPropertyOption
    cards: Card[]
}

interface BoardTree {
    readonly board: Board
    readonly views: readonly BoardView[]
    readonly cards: readonly Card[]
    readonly allCards: readonly Card[]
    readonly visibleGroups: readonly Group[]
    readonly hiddenGroups: readonly Group[]
    readonly allBlocks: readonly IBlock[]

    readonly activeView?: BoardView
    readonly groupByProperty?: IPropertyTemplate

    getSearchText(): string | undefined
    orderedCards(): Card[]

    mutableCopy(): MutableBoardTree
}

class MutableBoardTree implements BoardTree {
    board!: MutableBoard
    views: MutableBoardView[] = []
    cards: MutableCard[] = []
    visibleGroups: Group[] = []
    hiddenGroups: Group[] = []

    activeView?: MutableBoardView
    groupByProperty?: IPropertyTemplate

    private rawBlocks: IBlock[] = []
    private searchText?: string
    allCards: MutableCard[] = []
    get allBlocks(): IBlock[] {
        return [this.board, ...this.views, ...this.allCards]
    }

    constructor(private boardId: string) {
    }

    async sync() {
        this.rawBlocks = await octoClient.getSubtree(this.boardId)
        this.rebuild(OctoUtils.hydrateBlocks(this.rawBlocks))
    }

    incrementalUpdate(updatedBlocks: IBlock[]): boolean {
        const relevantBlocks = updatedBlocks.filter((block) => block.id === this.boardId || block.parentId === this.boardId)
        if (relevantBlocks.length < 1) {
            return false
        }
        this.rawBlocks = OctoUtils.mergeBlocks(this.rawBlocks, relevantBlocks)
        this.rebuild(OctoUtils.hydrateBlocks(this.rawBlocks))
        return true
    }

    private rebuild(blocks: IMutableBlock[]) {
        this.board = blocks.find((block) => block.type === 'board') as MutableBoard
        this.views = blocks.filter((block) => block.type === 'view') as MutableBoardView[]
        this.allCards = blocks.filter((block) => block.type === 'card') as MutableCard[]
        this.cards = []

        this.ensureMinimumSchema()
    }

    private ensureMinimumSchema(): boolean {
        const {board} = this

        let didChange = false

        // At least one select property
        const selectProperties = board?.cardProperties.find((o) => o.type === 'select')
        if (!selectProperties) {
            const newBoard = new MutableBoard(board)
            const property: IPropertyTemplate = {
                id: Utils.createGuid(),
                name: 'Status',
                type: 'select',
                options: [],
            }
            newBoard.cardProperties.push(property)
            this.board = newBoard
            didChange = true
        }

        // At least one view
        if (this.views.length < 1) {
            const view = new MutableBoardView()
            view.parentId = board?.id
            view.groupById = board?.cardProperties.find((o) => o.type === 'select')?.id
            this.views.push(view)
            didChange = true
        }

        return didChange
    }

    setActiveView(viewId: string) {
        this.activeView = this.views.find((o) => o.id === viewId)
        if (!this.activeView) {
            Utils.logError(`Cannot find BoardView: ${viewId}`)
            this.activeView = this.views[0]
        }

        // Fix missing group by (e.g. for new views)
        if (this.activeView.viewType === 'board' && !this.activeView.groupById) {
            this.activeView.groupById = this.board.cardProperties.find((o) => o.type === 'select')?.id
        }

        this.applyFilterSortAndGroup()
    }

    getSearchText(): string | undefined {
        return this.searchText
    }

    setSearchText(text?: string) {
        this.searchText = text
        this.applyFilterSortAndGroup()
    }

    applyFilterSortAndGroup() {
        Utils.assert(this.allCards !== undefined)

        this.cards = this.filterCards(this.allCards) as MutableCard[]
        Utils.assert(this.cards !== undefined)
        this.cards = this.searchFilterCards(this.cards) as MutableCard[]
        Utils.assert(this.cards !== undefined)
        this.cards = this.sortCards(this.cards) as MutableCard[]
        Utils.assert(this.cards !== undefined)

        if (this.activeView.groupById) {
            this.setGroupByProperty(this.activeView.groupById)
        } else {
            Utils.assert(this.activeView.viewType !== 'board')
        }

        Utils.assert(this.cards !== undefined)
    }

    private searchFilterCards(cards: Card[]): Card[] {
        const searchText = this.searchText?.toLocaleLowerCase()
        if (!searchText) {
            return cards.slice()
        }

        return cards.filter((card) => {
            if (card.title?.toLocaleLowerCase().indexOf(searchText) !== -1) {
                return true
            }
        })
    }

    private setGroupByProperty(propertyId: string) {
        const {board} = this

        let property = board.cardProperties.find((o) => o.id === propertyId)

        // TODO: Handle multi-select
        if (!property || property.type !== 'select') {
            Utils.logError(`this.view.groupById card property not found: ${propertyId}`)
            property = board.cardProperties.find((o) => o.type === 'select')
            Utils.assertValue(property)
        }
        this.groupByProperty = property

        this.groupCards()
    }

    private groupCards() {
        const {activeView, groupByProperty} = this

        const unassignedOptionIds = groupByProperty.options.
            filter((o) => !activeView.visibleOptionIds.includes(o.id) && !activeView.hiddenOptionIds.includes(o.id)).
            map((o) => o.id)
        const visibleOptionIds = [...activeView.visibleOptionIds, ...unassignedOptionIds]
        const {hiddenOptionIds} = activeView

        // If the empty group positon is not explicitly specified, make it the first visible column
        if (!activeView.visibleOptionIds.includes('') && !activeView.hiddenOptionIds.includes('')) {
            visibleOptionIds.unshift('')
        }

        this.visibleGroups = this.groupCardsByOptions(visibleOptionIds, groupByProperty)
        this.hiddenGroups = this.groupCardsByOptions(hiddenOptionIds, groupByProperty)
    }

    private groupCardsByOptions(optionIds: string[], groupByProperty: IPropertyTemplate) {
        const groups = []
        for (const optionId of optionIds) {
            if (optionId) {
                const option = groupByProperty.options.find((o) => o.id === optionId)
                if (option) {
                    const cards = this.cards.filter((o) => optionId === o.properties[groupByProperty.id])
                    const group: Group = {
                        option,
                        cards,
                    }
                    groups.push(group)
                } else {
                    Utils.logError(`groupCardsByOptions: Missing option with id: ${optionId}`)
                }
            } else {
                // Empty group
                const emptyGroupCards = this.cards.filter((o) => {
                    const optionId = o.properties[groupByProperty.id]
                    return !optionId || !this.groupByProperty.options.find((option) => option.id === optionId)
                })
                const group: Group = {
                    option: {id: '', value: `No ${groupByProperty.name}`, color: ''},
                    cards: emptyGroupCards,
                }
                groups.push(group)
            }
        }

        return groups
    }

    private filterCards(cards: MutableCard[]): Card[] {
        const {board} = this
        const filterGroup = this.activeView?.filter
        if (!filterGroup) {
            return cards.slice()
        }

        return CardFilter.applyFilterGroup(filterGroup, board.cardProperties, cards)
    }

    private titleOrCreatedOrder(cardA: Card, cardB: Card) {
        const aValue = cardA.title || ''
        const bValue = cardB.title || ''

        if (aValue && bValue) {
            return aValue.localeCompare(bValue)
        }

        // Always put untitled cards at the bottom
        if (aValue && !bValue) {
            return -1
        }
        if (bValue && !aValue) {
            return 1
        }

        // If both cards are untitled, use the create date
        return cardA.createAt - cardB.createAt
    }

    private manualOrder(cardA: Card, cardB: Card) {
        const {activeView} = this

        const indexA = activeView.cardOrder.indexOf(cardA.id)
        const indexB = activeView.cardOrder.indexOf(cardB.id)

        if (indexA < 0 && indexB < 0) {
            return this.titleOrCreatedOrder(cardA, cardB)
        } else if (indexA < 0 && indexB >= 0) {
            // If cardA's order is not defined, put it at the end
            return 1
        }
        return indexA - indexB
    }

    private sortCards(cards: Card[]): Card[] {
        if (!this.activeView) {
            Utils.assertFailure()
            return cards
        }
        const {board} = this
        const {sortOptions} = this.activeView
        let sortedCards: Card[] = []

        if (sortOptions.length < 1) {
            Utils.log('Manual sort')
            sortedCards = cards.sort((a, b) => this.manualOrder(a, b))
        } else {
            sortOptions.forEach((sortOption) => {
                if (sortOption.propertyId === Constants.titleColumnId) {
                    Utils.log('Sort by title')
                    sortedCards = cards.sort((a, b) => {
                        let result = this.titleOrCreatedOrder(a, b)

                        if (sortOption.reversed) {
                            result = -result
                        }
                        return result
                    })
                } else {
                    const sortPropertyId = sortOption.propertyId
                    const template = board.cardProperties.find((o) => o.id === sortPropertyId)
                    if (!template) {
                        Utils.logError(`Missing template for property id: ${sortPropertyId}`)
                        return cards.slice()
                    }
                    Utils.log(`Sort by property: ${template?.name}`)
                    sortedCards = cards.sort((a, b) => {
                        // Always put cards with no titles at the bottom, regardless of sort
                        if (!a.title || !b.title) {
                            return this.titleOrCreatedOrder(a, b)
                        }

                        const aValue = a.properties[sortPropertyId] || ''
                        const bValue = b.properties[sortPropertyId] || ''
                        let result = 0
                        if (template.type === 'select') {
                            // Always put empty values at the bottom
                            if (aValue && !bValue) {
                                return -1
                            }
                            if (bValue && !aValue) {
                                return 1
                            }
                            if (!aValue && !bValue) {
                                return this.titleOrCreatedOrder(a, b)
                            }

                            // Sort by the option order (not alphabetically by value)
                            const aOrder = template.options.findIndex((o) => o.id === aValue)
                            const bOrder = template.options.findIndex((o) => o.id === bValue)

                            result = aOrder - bOrder
                        } else if (template.type === 'number' || template.type === 'date') {
                            // Always put empty values at the bottom
                            if (aValue && !bValue) {
                                return -1
                            }
                            if (bValue && !aValue) {
                                return 1
                            }
                            if (!aValue && !bValue) {
                                return this.titleOrCreatedOrder(a, b)
                            }

                            result = Number(aValue) - Number(bValue)
                        } else if (template.type === 'createdTime') {
                            result = a.createAt - b.createAt
                        } else if (template.type === 'updatedTime') {
                            result = a.updateAt - b.updateAt
                        } else {
                            // Text-based sort

                            // Always put empty values at the bottom
                            if (aValue && !bValue) {
                                return -1
                            }
                            if (bValue && !aValue) {
                                return 1
                            }
                            if (!aValue && !bValue) {
                                return this.titleOrCreatedOrder(a, b)
                            }

                            result = aValue.localeCompare(bValue)
                        }

                        if (result === 0) {
                            // In case of "ties", use the title order
                            result = this.titleOrCreatedOrder(a, b)
                        }

                        if (sortOption.reversed) {
                            result = -result
                        }
                        return result
                    })
                }
            })
        }

        return sortedCards
    }

    orderedCards(): Card[] {
        const cards: Card[] = []
        for (const group of this.visibleGroups) {
            cards.push(...group.cards)
        }
        for (const group of this.hiddenGroups) {
            cards.push(...group.cards)
        }

        return cards
    }

    mutableCopy(): MutableBoardTree {
        const boardTree = new MutableBoardTree(this.boardId)
        boardTree.incrementalUpdate(this.rawBlocks)
        return boardTree
    }
}

export {MutableBoardTree, BoardTree, Group as BoardTreeGroup}
