// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {Board, IPropertyOption, IPropertyTemplate, MutableBoard} from '../blocks/board'
import {BoardView, MutableBoardView} from '../blocks/boardView'
import {Card, MutableCard} from '../blocks/card'
import {CardFilter} from '../cardFilter'
import octoClient from '../octoClient'
import {IBlock, IMutableBlock} from '../blocks/block'
import {OctoUtils} from '../octoUtils'
import {Utils} from '../utils'

type Group = {
    option: IPropertyOption
    cards: Card[]
    isHidden: boolean
}

interface BoardTree {
    readonly board: Board
    readonly views: readonly BoardView[]
    readonly cards: readonly Card[]
    readonly emptyGroupCards: readonly Card[]
    readonly groups: readonly Group[]
    readonly allBlocks: readonly IBlock[]

    readonly activeView?: BoardView
    readonly groupByProperty?: IPropertyTemplate

    getSearchText(): string | undefined
}

class MutableBoardTree implements BoardTree {
    board!: MutableBoard
    views: MutableBoardView[] = []
    cards: MutableCard[] = []
    emptyGroupCards: MutableCard[] = []
    groups: Group[] = []

    activeView?: MutableBoardView
    groupByProperty?: IPropertyTemplate

    private searchText?: string
    private allCards: MutableCard[] = []
    get allBlocks(): IBlock[] {
        return [this.board, ...this.views, ...this.allCards]
    }

    constructor(private boardId: string) {
    }

    async sync() {
        const blocks = await octoClient.getSubtree(this.boardId)
        this.rebuild(OctoUtils.hydrateBlocks(blocks))
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

        /*
        // TODO: Remove fixup code. Fix board cardProperties schema
        for (const template of this.board.cardProperties) {
            if (template.type === 'select') {
                for (const option of template.options) {
                    if (!option.id) {
                        option.id = Utils.createGuid()
                        Utils.log(`FIXUP template ${template.name}, option: ${option.value}, guid: ${option.id}`)
                    }
                }
            }
        }

        // TODO: Remove fixup code. Fix card schema
        for (const card of this.allCards) {
            if (card.schema < 2) {
                card.schema = 2
                for (const propertyId in card.properties) {
                    if (!Object.prototype.hasOwnProperty.call(card.properties, propertyId)) {
                        continue
                    }
                    const template = board.cardProperties.find((o) => o.id === propertyId)
                    if (!template) {
                        Utils.log(`No template with id: ${propertyId}`)
                    }
                    if (template?.type === 'select') {
                        const value = card.properties[propertyId]
                        const option = template.options.find((o) => o.value === value)
                        if (!option) {
                            Utils.assertFailure(`No option for template: ${template.name} with option value: ${value}`)
                        }
                        if (option) {
                            card.properties[propertyId] = option?.id
                        }
                        Utils.log(`FIXUP card ${template.name}, option: ${option?.value}, guid: ${option?.id}`)
                    }
                }
            }
        }
*/
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
        this.groups = []

        const groupByPropertyId = this.groupByProperty.id

        this.emptyGroupCards = this.cards.filter((o) => {
            const optionId = o.properties[groupByPropertyId]
            return !optionId || !this.groupByProperty.options.find((option) => option.id === optionId)
        })

        const propertyOptions = this.groupByProperty.options || []
        for (const option of propertyOptions) {
            const cards = this.cards.
                filter((o) => {
                    const optionId = o.properties[groupByPropertyId]
                    return optionId && optionId === option.id
                })

            const isHidden = this.activeView.hiddenColumnIds.includes(option.id)
            const group: Group = {
                option,
                cards,
                isHidden,
            }

            this.groups.push(group)
        }
    }

    private filterCards(cards: MutableCard[]): Card[] {
        const {board} = this
        const filterGroup = this.activeView?.filter
        if (!filterGroup) {
            return cards.slice()
        }

        return CardFilter.applyFilterGroup(filterGroup, board.cardProperties, cards)
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
            Utils.log('Default sort')
            sortedCards = cards.sort((a, b) => {
                const aValue = a.title || ''
                const bValue = b.title || ''

                // Always put empty values at the bottom
                if (aValue && !bValue) {
                    return -1
                }
                if (bValue && !aValue) {
                    return 1
                }
                if (!aValue && !bValue) {
                    return a.createAt - b.createAt
                }

                return a.createAt - b.createAt
            })
        } else {
            sortOptions.forEach((sortOption) => {
                if (sortOption.propertyId === '__name') {
                    Utils.log('Sort by name')
                    sortedCards = cards.sort((a, b) => {
                        const aValue = a.title || ''
                        const bValue = b.title || ''

                        // Always put empty values at the bottom, newest last
                        if (aValue && !bValue) {
                            return -1
                        }
                        if (bValue && !aValue) {
                            return 1
                        }
                        if (!aValue && !bValue) {
                            return a.createAt - b.createAt
                        }

                        let result = aValue.localeCompare(bValue)
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
                    Utils.log(`Sort by ${template?.name}`)
                    sortedCards = cards.sort((a, b) => {
                        // Always put cards with no titles at the bottom
                        if (a.title && !b.title) {
                            return -1
                        }
                        if (b.title && !a.title) {
                            return 1
                        }
                        if (!a.title && !b.title) {
                            return a.createAt - b.createAt
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
                                return a.createAt - b.createAt
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
                                return a.createAt - b.createAt
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
                                return a.createAt - b.createAt
                            }

                            result = aValue.localeCompare(bValue)
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
}

export {MutableBoardTree, BoardTree, Group as BoardTreeGroup}
