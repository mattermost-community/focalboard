import { Board, IPropertyOption, IPropertyTemplate } from "./board"
import { BoardView } from "./boardView"
import { CardFilter } from "./cardFilter"
import { OctoClient } from "./octoClient"
import { IBlock } from "./octoTypes"
import { Utils } from "./utils"

type Group = { option: IPropertyOption, cards: IBlock[] }

class BoardTree {
	board!: Board
	views: BoardView[] = []
	cards: IBlock[] = []
	emptyGroupCards: IBlock[] = []
	groups: Group[] = []

	activeView?: BoardView
	groupByProperty?: IPropertyTemplate

	private allCards: IBlock[] = []
	get allBlocks(): IBlock[] {
		return [this.board, ...this.views, ...this.allCards]
	}

	constructor(
		private octo: OctoClient,
		private boardId: string) {
	}

	async sync() {
		const blocks = await this.octo.getSubtree(this.boardId)
		this.rebuild(blocks)
	}

	private rebuild(blocks: IBlock[]) {
		const boardBlock = blocks.find(block => block.type === "board")

		if (boardBlock) {
			this.board = new Board(boardBlock)
		}

		const viewBlocks = blocks.filter(block => block.type === "view")
		this.views = viewBlocks.map(o => new BoardView(o))

		const cardBlocks = blocks.filter(block => block.type === "card")
		this.allCards = cardBlocks
		this.cards = []

		this.ensureMinimumSchema()
	}

	private async ensureMinimumSchema() {
		const { board } = this

		let didChange = false

		// At least one select property
		const selectProperties = board.cardProperties.find(o => o.type === "select")
		if (!selectProperties) {
			const property: IPropertyTemplate = {
				id: Utils.createGuid(),
				name: "Status",
				type: "select",
				options: []
			}
			board.cardProperties.push(property)
			didChange = true
		}

		// At least one view
		if (this.views.length < 1) {
			const view = new BoardView()
			view.parentId = board.id
			view.groupById = board.cardProperties.find(o => o.type === "select")?.id
			this.views.push(view)
			didChange = true
		}

		return didChange
	}

	setActiveView(viewId: string) {
		this.activeView = this.views.find(o => o.id === viewId)
		if (!this.activeView) {
			Utils.logError(`Cannot find BoardView: ${viewId}`)
			this.activeView = this.views[0]
		}

		// Fix missing group by (e.g. for new views)
		if (this.activeView.viewType === "board" && !this.activeView.groupById) {
			this.activeView.groupById = this.board.cardProperties.find(o => o.type === "select")?.id
		}
		this.applyFilterSortAndGroup()
	}

	applyFilterSortAndGroup() {
		this.cards = this.filterCards(this.allCards)
		this.cards = this.sortCards(this.cards)

		if (this.activeView.groupById) {
			this.setGroupByProperty(this.activeView.groupById)
		} else {
			Utils.assert(this.activeView.viewType !== "board")
		}
	}

	private setGroupByProperty(propertyId: string) {
		const { board } = this

		let property = board.cardProperties.find(o => o.id === propertyId)
		// TODO: Handle multi-select
		if (!property || property.type !== "select") {
			Utils.logError(`this.view.groupById card property not found: ${propertyId}`)
			property = board.cardProperties.find(o => o.type === "select")
			Utils.assertValue(property)
		}
		this.groupByProperty = property

		this.groupCards()
	}

	private groupCards() {
		this.groups = []

		const groupByPropertyId = this.groupByProperty.id

		this.emptyGroupCards = this.cards.filter(o => {
			const property = o.properties.find(p => p.id === groupByPropertyId)
			return !property || !property.value || !this.groupByProperty.options.find(option => option.value === property.value)
		})

		const propertyOptions = this.groupByProperty.options || []
		for (const option of propertyOptions) {
			const cards = this.cards
				.filter(o => {
					const property = o.properties.find(p => p.id === groupByPropertyId)
					return property && property.value === option.value
				})

			const group: Group = {
				option,
				cards
			}

			this.groups.push(group)
		}
	}

	private filterCards(cards: IBlock[]): IBlock[] {
		const { board } = this
		const filterGroup = this.activeView?.filter
		if (!filterGroup) { return cards.slice() }

		return CardFilter.applyFilterGroup(filterGroup, board.cardProperties, cards)
	}

	private sortCards(cards: IBlock[]): IBlock[] {
		if (!this.activeView) { Utils.assertFailure(); return cards }
		const { board } = this
		const { sortOptions } = this.activeView
		let sortedCards: IBlock[]

		if (sortOptions.length < 1) {
			Utils.log(`Default sort`)
			sortedCards = cards.sort((a, b) => {
				const aValue = a.title || ""
				const bValue = b.title || ""

				// Always put empty values at the bottom
				if (aValue && !bValue) { return -1 }
				if (bValue && !aValue) { return 1 }
				if (!aValue && !bValue) { return a.createAt - b.createAt }

				return a.createAt - b.createAt
			})
		} else {
			sortOptions.forEach(sortOption => {
				if (sortOption.propertyId === "__name") {
					Utils.log(`Sort by name`)
					sortedCards = cards.sort((a, b) => {
						const aValue = a.title || ""
						const bValue = b.title || ""

						// Always put empty values at the bottom, newest last
						if (aValue && !bValue) { return -1 }
						if (bValue && !aValue) { return 1 }
						if (!aValue && !bValue) { return a.createAt - b.createAt }

						let result = aValue.localeCompare(bValue)
						if (sortOption.reversed) { result = -result }
						return result
					})
				} else {
					const sortPropertyId = sortOption.propertyId
					const template = board.cardProperties.find(o => o.id === sortPropertyId)
					Utils.log(`Sort by ${template.name}`)
					sortedCards = cards.sort((a, b) => {
						// Always put cards with no titles at the bottom
						if (a.title && !b.title) { return -1 }
						if (b.title && !a.title) { return 1 }
						if (!a.title && !b.title) { return a.createAt - b.createAt }

						const aProperty = a.properties.find(o => o.id === sortPropertyId)
						const bProperty = b.properties.find(o => o.id === sortPropertyId)
						const aValue = aProperty ? aProperty.value : ""
						const bValue = bProperty ? bProperty.value : ""
						let result = 0
						if (template.type === "select") {
							// Always put empty values at the bottom
							if (aValue && !bValue) { return -1 }
							if (bValue && !aValue) { return 1 }
							if (!aValue && !bValue) { return a.createAt - b.createAt }

							// Sort by the option order (not alphabetically by value)
							const aOrder = template.options.findIndex(o => o.value === aValue)
							const bOrder = template.options.findIndex(o => o.value === bValue)

							result = aOrder - bOrder
						} else if (template.type === "number" || template.type === "date") {
							// Always put empty values at the bottom
							if (aValue && !bValue) { return -1 }
							if (bValue && !aValue) { return 1 }
							if (!aValue && !bValue) { return a.createAt - b.createAt }

							result = Number(aValue) - Number(bValue)
						} else if (template.type === "createdTime") {
							result = a.createAt - b.createAt
						} else if (template.type === "updatedTime") {
							result = a.updateAt - b.updateAt
						} else {
							// Text-based sort

							// Always put empty values at the bottom
							if (aValue && !bValue) { return -1 }
							if (bValue && !aValue) { return 1 }
							if (!aValue && !bValue) { return a.createAt - b.createAt }

							result = aValue.localeCompare(bValue)
						}

						if (sortOption.reversed) { result = -result }
						return result
					})
				}
			})
		}

		return sortedCards
	}
}

export { BoardTree }
