import { Block } from "./block"
import { Board, IPropertyOption, IPropertyTemplate, PropertyType } from "./board"
import { BoardTree } from "./boardTree"
import { BoardView, ISortOption } from "./boardView"
import { FilterGroup } from "./filterGroup"
import { OctoClient } from "./octoClient"
import { IBlock } from "./octoTypes"
import { UndoManager } from "./undomanager"
import { Utils } from "./utils"

//
// The Mutator is used to make all changes to server state
// It also ensures that the Undo-manager is called for each action
//
class Mutator {
	constructor(private octo: OctoClient, private undoManager = UndoManager.shared) {
	}

	async insertBlock(block: IBlock, description: string = "add", afterRedo?: () => Promise<void>, beforeUndo?: () => Promise<void>) {
		const { octo, undoManager } = this

		await undoManager.perform(
			async () => {
				await octo.insertBlock(block)
				await afterRedo?.()
			},
			async () => {
				await beforeUndo?.()
				await octo.deleteBlock(block.id)
			},
			description
		)
	}

	async insertBlocks(blocks: IBlock[], description: string = "add", afterRedo?: () => Promise<void>, beforeUndo?: () => Promise<void>) {
		const { octo, undoManager } = this

		await undoManager.perform(
			async () => {
				await octo.insertBlocks(blocks)
				await afterRedo?.()
			},
			async () => {
				await beforeUndo?.()
				for (const block of blocks) {
					await octo.deleteBlock(block.id)
				}
			},
			description
		)
	}

	async deleteBlock(block: IBlock, description?: string, beforeRedo?: () => Promise<void>, afterUndo?: () => Promise<void>) {
		const { octo, undoManager } = this

		if (!description) {
			description = `delete ${block.type}`
		}

		await undoManager.perform(
			async () => {
				await beforeRedo?.()
				await octo.deleteBlock(block.id)
			},
			async () => {
				await octo.insertBlock(block)
				await afterUndo?.()
			},
			description
		)
	}

	async changeTitle(block: IBlock, title: string, description: string = "change title") {
		const { octo, undoManager } = this

		const oldValue = block.title
		await undoManager.perform(
			async () => {
				block.title = title
				await octo.updateBlock(block)
			},
			async () => {
				block.title = oldValue
				await octo.updateBlock(block)
			},
			description
		)
	}

	async changeIcon(block: IBlock, icon: string, description: string = "change icon") {
		const { octo, undoManager } = this

		const oldValue = block.icon
		await undoManager.perform(
			async () => {
				block.icon = icon
				await octo.updateBlock(block)
			},
			async () => {
				block.icon = oldValue
				await octo.updateBlock(block)
			},
			description
		)
	}

	async changeOrder(block: IBlock, order: number, description: string = "change order") {
		const { octo, undoManager } = this

		const oldValue = block.order
		await undoManager.perform(
			async () => {
				block.order = order
				await octo.updateBlock(block)
			},
			async () => {
				block.order = oldValue
				await octo.updateBlock(block)
			},
			description
		)
	}

	// Property Templates

	async insertPropertyTemplate(boardTree: BoardTree, index: number = -1, template?: IPropertyTemplate) {
		const { octo, undoManager } = this
		const { board, activeView } = boardTree

		if (index < 0) { index = board.cardProperties.length }

		if (!template) {
			template = {
				id: Utils.createGuid(),
				name: "New Property",
				type: "text",
				options: []
			}
		}

		const oldBlocks: IBlock[] = [new Board(board)]

		const changedBlocks: IBlock[] = [board]
		board.cardProperties.splice(index, 0, template)

		let description = "add property"

		if (activeView.viewType === "table") {
			oldBlocks.push(new BoardView(activeView))
			activeView.visiblePropertyIds.push(template.id)
			changedBlocks.push(activeView)

			description = "add column"
		}

		await undoManager.perform(
			async () => {
				await octo.updateBlocks(changedBlocks)
			},
			async () => {
				await octo.updateBlocks(oldBlocks)
			},
			description
		)
	}

	async duplicatePropertyTemplate(boardTree: BoardTree, propertyId: string) {
		const { octo, undoManager } = this
		const { board, activeView } = boardTree

		const oldBlocks: IBlock[] = [new Board(board)]

		const changedBlocks: IBlock[] = [board]
		const index = board.cardProperties.findIndex(o => o.id === propertyId)
		if (index === -1) { Utils.assertFailure(`Cannot find template with id: ${propertyId}`); return }
		const srcTemplate = board.cardProperties[index]
		const newTemplate: IPropertyTemplate = {
			id: Utils.createGuid(),
			name: `Copy of ${srcTemplate.name}`,
			type: srcTemplate.type,
			options: srcTemplate.options.slice()
		}
		board.cardProperties.splice(index + 1, 0, newTemplate)

		let description = "duplicate property"
		if (activeView.viewType === "table") {
			oldBlocks.push(new BoardView(activeView))
			activeView.visiblePropertyIds.push(newTemplate.id)
			changedBlocks.push(activeView)

			description = "duplicate column"
		}

		await undoManager.perform(
			async () => {
				await octo.updateBlocks(changedBlocks)
			},
			async () => {
				await octo.updateBlocks(oldBlocks)
			},
			description
		)

		return changedBlocks
	}

	async changePropertyTemplateOrder(board: Board, template: IPropertyTemplate, destIndex: number) {
		const { octo, undoManager } = this

		const templates = board.cardProperties
		const oldValue = templates
		const newValue = templates.slice()

		const srcIndex = templates.indexOf(template)
		Utils.log(`srcIndex: ${srcIndex}, destIndex: ${destIndex}`)
		newValue.splice(destIndex, 0, newValue.splice(srcIndex, 1)[0])

		await undoManager.perform(
			async () => {
				board.cardProperties = newValue
				await octo.updateBlock(board)
			},
			async () => {
				board.cardProperties = oldValue
				await octo.updateBlock(board)
			},
			"reorder properties"
		)
	}

	async deleteProperty(boardTree: BoardTree, propertyId: string) {
		const { octo, undoManager } = this
		const { board, views, cards } = boardTree

		const oldBlocks: IBlock[] = [new Board(board)]

		const changedBlocks: IBlock[] = [board]
		board.cardProperties = board.cardProperties.filter(o => o.id !== propertyId)

		views.forEach(view => {
			if (view.visiblePropertyIds.includes(propertyId)) {
				oldBlocks.push(new BoardView(view))
				view.visiblePropertyIds = view.visiblePropertyIds.filter(o => o !== propertyId)
				changedBlocks.push(view)
			}
		})
		cards.forEach(card => {
			if (card.properties[propertyId]) {
				oldBlocks.push(new Block(card))
				delete card.properties[propertyId]
				changedBlocks.push(card)
			}
		})

		await undoManager.perform(
			async () => {
				await octo.updateBlocks(changedBlocks)
			},
			async () => {
				await octo.updateBlocks(oldBlocks)
			},
			"delete property"
		)
	}

	async renameProperty(board: Board, propertyId: string, name: string) {
		const { octo, undoManager } = this

		const oldBlocks: IBlock[] = [new Board(board)]
		const changedBlocks: IBlock[] = [board]

		const template = board.cardProperties.find(o => o.id === propertyId)
		if (!template) { Utils.assertFailure(`Can't find property template with Id: ${propertyId}`); return }
		Utils.log(`renameProperty from ${template.name} to ${name}`)
		template.name = name

		await undoManager.perform(
			async () => {
				await octo.updateBlocks(changedBlocks)
			},
			async () => {
				await octo.updateBlocks(oldBlocks)
			},
			"rename property"
		)
	}

	// Properties

	async insertPropertyOption(boardTree: BoardTree, template: IPropertyTemplate, option: IPropertyOption, description: string = "add option") {
		const { octo, undoManager } = this
		const { board } = boardTree

		const oldValue = template.options
		const newValue = template.options.slice()
		newValue.push(option)

		await undoManager.perform(
			async () => {
				template.options = newValue
				await octo.updateBlock(board)
			},
			async () => {
				// TODO: Also remove property on cards
				template.options = oldValue
				await octo.updateBlock(board)
			},
			description
		)
	}

	async deletePropertyOption(boardTree: BoardTree, template: IPropertyTemplate, option: IPropertyOption) {
		const { octo, undoManager } = this
		const { board } = boardTree

		const oldValue = template.options.slice()
		const newValue = template.options.filter(o => o !== option)

		// TODO: Also remove property on cards

		await undoManager.perform(
			async () => {
				template.options = newValue
				await octo.updateBlock(board)
			},
			async () => {
				template.options = oldValue
				await octo.updateBlock(board)
			},
			"delete option"
		)
	}

	async changePropertyOptionOrder(board: Board, template: IPropertyTemplate, option: IPropertyOption, destIndex: number) {
		const { octo, undoManager } = this

		const oldValue = template.options
		const newValue = template.options.slice()

		const srcIndex = newValue.indexOf(option)
		Utils.log(`srcIndex: ${srcIndex}, destIndex: ${destIndex}`)
		newValue.splice(destIndex, 0, newValue.splice(srcIndex, 1)[0])

		await undoManager.perform(
			async () => {
				template.options = newValue
				await octo.updateBlock(board)
			},
			async () => {
				template.options = oldValue
				await octo.updateBlock(board)
			},
			"reorder options"
		)
	}

	async changePropertyOptionValue(boardTree: BoardTree, propertyTemplate: IPropertyTemplate, option: IPropertyOption, value: string) {
		const { octo, undoManager } = this
		const { board, cards } = boardTree

		const oldValue = option.value
		const oldBlocks: IBlock[] = [new Board(board)]

		const changedBlocks: IBlock[] = [board]
		option.value = value

		// Change the value on all cards that have this property too
		for (const card of cards) {
			const propertyValue = card.properties[propertyTemplate.id]
			if (propertyValue && propertyValue === oldValue) {
				oldBlocks.push(new Block(card))
				card.properties[propertyTemplate.id] = value
				changedBlocks.push(card)
			}
		}

		await undoManager.perform(
			async () => {
				await octo.updateBlocks(changedBlocks)
			},
			async () => {
				await octo.updateBlocks(oldBlocks)
			},
			"rename option"
		)

		return changedBlocks
	}

	async changePropertyOptionColor(board: Board, option: IPropertyOption, color: string) {
		const { octo, undoManager } = this

		const oldValue = option.color

		undoManager.perform(
			async () => {
				option.color = color
				await octo.updateBlock(board)
			},
			async () => {
				option.color = oldValue
				await octo.updateBlock(board)
			},
			"change option color"
		)
	}

	async changePropertyValue(block: IBlock, propertyId: string, value?: string, description: string = "change property") {
		const { octo, undoManager } = this

		const oldValue = Block.getPropertyValue(block, propertyId)
		await undoManager.perform(
			async () => {
				Block.setProperty(block, propertyId, value)
				await octo.updateBlock(block)
			},
			async () => {
				Block.setProperty(block, propertyId, oldValue)
				await octo.updateBlock(block)
			},
			description
		)
	}

	async changePropertyType(board: Board, propertyTemplate: IPropertyTemplate, type: PropertyType) {
		const { octo, undoManager } = this

		const oldValue = propertyTemplate.type
		await undoManager.perform(
			async () => {
				propertyTemplate.type = type
				await octo.updateBlock(board)
			},
			async () => {
				propertyTemplate.type = oldValue
				await octo.updateBlock(board)
			},
			"change property type"
		)
	}

	// Views

	async changeViewSortOptions(view: BoardView, sortOptions: ISortOption[]) {
		const { octo, undoManager } = this

		const oldValue = view.sortOptions

		await undoManager.perform(
			async () => {
				view.sortOptions = sortOptions
				await octo.updateBlock(view)
			},
			async () => {
				view.sortOptions = oldValue
				await octo.updateBlock(view)
			},
			"sort"
		)
	}

	async changeViewFilter(view: BoardView, filter?: FilterGroup) {
		const { octo, undoManager } = this

		const oldValue = view.filter

		await undoManager.perform(
			async () => {
				view.filter = filter
				await octo.updateBlock(view)
			},
			async () => {
				view.filter = oldValue
				await octo.updateBlock(view)
			},
			"filter"
		)
	}

	async changeViewVisibleProperties(view: BoardView, visiblePropertyIds: string[]) {
		const { octo, undoManager } = this

		const oldValue = view.visiblePropertyIds

		await undoManager.perform(
			async () => {
				view.visiblePropertyIds = visiblePropertyIds
				await octo.updateBlock(view)
			},
			async () => {
				view.visiblePropertyIds = oldValue
				await octo.updateBlock(view)
			},
			"hide / show property"
		)
	}

	async changeViewGroupById(view: BoardView, groupById: string) {
		const { octo, undoManager } = this

		const oldValue = view.groupById

		await undoManager.perform(
			async () => {
				view.groupById = groupById
				await octo.updateBlock(view)
			},
			async () => {
				view.groupById = oldValue
				await octo.updateBlock(view)
			},
			"group by"
		)
	}

	// Not a mutator, but convenient to put here since Mutator wraps OctoClient
	async exportFullArchive() {
		return this.octo.exportFullArchive()
	}

	// Not a mutator, but convenient to put here since Mutator wraps OctoClient
	async importFullArchive(blocks: IBlock[]) {
		return this.octo.importFullArchive(blocks)
	}

	async createImageBlock(parentId: string, file: File, order = 1000): Promise<IBlock | undefined> {
		const { octo, undoManager } = this

		const url = await octo.uploadFile(file)
		if (!url) {
			return undefined
		}

		const block = new Block({ type: "image", parentId, url, order })

		await undoManager.perform(
			async () => {
				await octo.insertBlock(block)
			},
			async () => {
				await octo.deleteBlock(block.id)
			},
			"group by"
		)

		return block
	}
}

export { Mutator }
