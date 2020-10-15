import { Block } from "./block"
import { Board, IPropertyOption, IPropertyTemplate, PropertyType } from "./board"
import { BoardTree } from "./boardTree"
import { BoardView, ISortOption } from "./boardView"
import { Card } from "./card"
import { FilterGroup } from "./filterGroup"
import octoClient from "./octoClient"
import { IBlock } from "./octoTypes"
import undoManager from "./undomanager"
import { Utils } from "./utils"

//
// The Mutator is used to make all changes to server state
// It also ensures that the Undo-manager is called for each action
//
class Mutator {
	constructor() {
	}

	async insertBlock(block: IBlock, description: string = "add", afterRedo?: () => Promise<void>, beforeUndo?: () => Promise<void>) {
		await undoManager.perform(
			async () => {
				await octoClient.insertBlock(block)
				await afterRedo?.()
			},
			async () => {
				await beforeUndo?.()
				await octoClient.deleteBlock(block.id)
			},
			description
		)
	}

	async insertBlocks(blocks: IBlock[], description: string = "add", afterRedo?: () => Promise<void>, beforeUndo?: () => Promise<void>) {
		await undoManager.perform(
			async () => {
				await octoClient.insertBlocks(blocks)
				await afterRedo?.()
			},
			async () => {
				await beforeUndo?.()
				for (const block of blocks) {
					await octoClient.deleteBlock(block.id)
				}
			},
			description
		)
	}

	async deleteBlock(block: IBlock, description?: string, beforeRedo?: () => Promise<void>, afterUndo?: () => Promise<void>) {
		if (!description) {
			description = `delete ${block.type}`
		}

		await undoManager.perform(
			async () => {
				await beforeRedo?.()
				await octoClient.deleteBlock(block.id)
			},
			async () => {
				await octoClient.insertBlock(block)
				await afterUndo?.()
			},
			description
		)
	}

	async changeTitle(block: IBlock, title: string, description: string = "change title") {
		const oldValue = block.title
		await undoManager.perform(
			async () => {
				block.title = title
				await octoClient.updateBlock(block)
			},
			async () => {
				block.title = oldValue
				await octoClient.updateBlock(block)
			},
			description
		)
	}

	async changeIcon(block: Card | Board, icon: string, description: string = "change icon") {
		const oldValue = block.icon
		await undoManager.perform(
			async () => {
				block.icon = icon
				await octoClient.updateBlock(block)
			},
			async () => {
				block.icon = oldValue
				await octoClient.updateBlock(block)
			},
			description
		)
	}

	async changeOrder(block: IBlock, order: number, description: string = "change order") {
		const oldValue = block.order
		await undoManager.perform(
			async () => {
				block.order = order
				await octoClient.updateBlock(block)
			},
			async () => {
				block.order = oldValue
				await octoClient.updateBlock(block)
			},
			description
		)
	}

	// Property Templates

	async insertPropertyTemplate(boardTree: BoardTree, index: number = -1, template?: IPropertyTemplate) {
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
				await octoClient.updateBlocks(changedBlocks)
			},
			async () => {
				await octoClient.updateBlocks(oldBlocks)
			},
			description
		)
	}

	async duplicatePropertyTemplate(boardTree: BoardTree, propertyId: string) {
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
				await octoClient.updateBlocks(changedBlocks)
			},
			async () => {
				await octoClient.updateBlocks(oldBlocks)
			},
			description
		)

		return changedBlocks
	}

	async changePropertyTemplateOrder(board: Board, template: IPropertyTemplate, destIndex: number) {
		const templates = board.cardProperties
		const oldValue = templates
		const newValue = templates.slice()

		const srcIndex = templates.indexOf(template)
		Utils.log(`srcIndex: ${srcIndex}, destIndex: ${destIndex}`)
		newValue.splice(destIndex, 0, newValue.splice(srcIndex, 1)[0])

		await undoManager.perform(
			async () => {
				board.cardProperties = newValue
				await octoClient.updateBlock(board)
			},
			async () => {
				board.cardProperties = oldValue
				await octoClient.updateBlock(board)
			},
			"reorder properties"
		)
	}

	async deleteProperty(boardTree: BoardTree, propertyId: string) {
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
				await octoClient.updateBlocks(changedBlocks)
			},
			async () => {
				await octoClient.updateBlocks(oldBlocks)
			},
			"delete property"
		)
	}

	async renameProperty(board: Board, propertyId: string, name: string) {
		const oldBlocks: IBlock[] = [new Board(board)]
		const changedBlocks: IBlock[] = [board]

		const template = board.cardProperties.find(o => o.id === propertyId)
		if (!template) { Utils.assertFailure(`Can't find property template with Id: ${propertyId}`); return }
		Utils.log(`renameProperty from ${template.name} to ${name}`)
		template.name = name

		await undoManager.perform(
			async () => {
				await octoClient.updateBlocks(changedBlocks)
			},
			async () => {
				await octoClient.updateBlocks(oldBlocks)
			},
			"rename property"
		)
	}

	// Properties

	async insertPropertyOption(boardTree: BoardTree, template: IPropertyTemplate, option: IPropertyOption, description: string = "add option") {
		const { board } = boardTree

		Utils.assert(board.cardProperties.includes(template))

		const oldValue = template.options
		const newValue = template.options.slice()
		newValue.push(option)

		await undoManager.perform(
			async () => {
				template.options = newValue
				await octoClient.updateBlock(board)
			},
			async () => {
				// TODO: Also remove property on cards
				template.options = oldValue
				await octoClient.updateBlock(board)
			},
			description
		)
	}

	async deletePropertyOption(boardTree: BoardTree, template: IPropertyTemplate, option: IPropertyOption) {
		const { board } = boardTree

		const oldValue = template.options.slice()
		const newValue = template.options.filter(o => o !== option)

		// TODO: Also remove property on cards

		await undoManager.perform(
			async () => {
				template.options = newValue
				await octoClient.updateBlock(board)
			},
			async () => {
				template.options = oldValue
				await octoClient.updateBlock(board)
			},
			"delete option"
		)
	}

	async changePropertyOptionOrder(board: Board, template: IPropertyTemplate, option: IPropertyOption, destIndex: number) {
		const oldValue = template.options
		const newValue = template.options.slice()

		const srcIndex = newValue.indexOf(option)
		Utils.log(`srcIndex: ${srcIndex}, destIndex: ${destIndex}`)
		newValue.splice(destIndex, 0, newValue.splice(srcIndex, 1)[0])

		await undoManager.perform(
			async () => {
				template.options = newValue
				await octoClient.updateBlock(board)
			},
			async () => {
				template.options = oldValue
				await octoClient.updateBlock(board)
			},
			"reorder options"
		)
	}

	async changePropertyOptionValue(boardTree: BoardTree, propertyTemplate: IPropertyTemplate, option: IPropertyOption, value: string) {
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
				await octoClient.updateBlocks(changedBlocks)
			},
			async () => {
				await octoClient.updateBlocks(oldBlocks)
			},
			"rename option"
		)

		return changedBlocks
	}

	async changePropertyOptionColor(board: Board, option: IPropertyOption, color: string) {
		const oldValue = option.color

		undoManager.perform(
			async () => {
				option.color = color
				await octoClient.updateBlock(board)
			},
			async () => {
				option.color = oldValue
				await octoClient.updateBlock(board)
			},
			"change option color"
		)
	}

	async changePropertyValue(card: Card, propertyId: string, value?: string, description: string = "change property") {
		const oldValue = card.properties[propertyId]
		await undoManager.perform(
			async () => {
				card.properties[propertyId] = value
				await octoClient.updateBlock(card)
			},
			async () => {
				card.properties[propertyId] = oldValue
				await octoClient.updateBlock(card)
			},
			description
		)
	}

	async changePropertyType(board: Board, propertyTemplate: IPropertyTemplate, type: PropertyType) {
		const oldValue = propertyTemplate.type
		await undoManager.perform(
			async () => {
				propertyTemplate.type = type
				await octoClient.updateBlock(board)
			},
			async () => {
				propertyTemplate.type = oldValue
				await octoClient.updateBlock(board)
			},
			"change property type"
		)
	}

	// Views

	async changeViewSortOptions(view: BoardView, sortOptions: ISortOption[]) {
		const oldValue = view.sortOptions

		await undoManager.perform(
			async () => {
				view.sortOptions = sortOptions
				await octoClient.updateBlock(view)
			},
			async () => {
				view.sortOptions = oldValue
				await octoClient.updateBlock(view)
			},
			"sort"
		)
	}

	async changeViewFilter(view: BoardView, filter?: FilterGroup) {
		const oldValue = view.filter

		await undoManager.perform(
			async () => {
				view.filter = filter
				await octoClient.updateBlock(view)
			},
			async () => {
				view.filter = oldValue
				await octoClient.updateBlock(view)
			},
			"filter"
		)
	}

	async changeViewVisibleProperties(view: BoardView, visiblePropertyIds: string[]) {
		const oldValue = view.visiblePropertyIds

		await undoManager.perform(
			async () => {
				view.visiblePropertyIds = visiblePropertyIds
				await octoClient.updateBlock(view)
			},
			async () => {
				view.visiblePropertyIds = oldValue
				await octoClient.updateBlock(view)
			},
			"hide / show property"
		)
	}

	async changeViewGroupById(view: BoardView, groupById: string) {
		const oldValue = view.groupById

		await undoManager.perform(
			async () => {
				view.groupById = groupById
				await octoClient.updateBlock(view)
			},
			async () => {
				view.groupById = oldValue
				await octoClient.updateBlock(view)
			},
			"group by"
		)
	}

	// Not a mutator, but convenient to put here since Mutator wraps OctoClient
	async exportFullArchive() {
		return octoClient.exportFullArchive()
	}

	// Not a mutator, but convenient to put here since Mutator wraps OctoClient
	async importFullArchive(blocks: IBlock[]) {
		return octoClient.importFullArchive(blocks)
	}

	async createImageBlock(parentId: string, file: File, order = 1000): Promise<IBlock | undefined> {
		const url = await octoClient.uploadFile(file)
		if (!url) {
			return undefined
		}

		const block = new Block({ type: "image", parentId, order })
		block.fields.url = url

		await undoManager.perform(
			async () => {
				await octoClient.insertBlock(block)
			},
			async () => {
				await octoClient.deleteBlock(block.id)
			},
			"group by"
		)

		return block
	}

    async undo() {
        await undoManager.undo()
    }

    undoDescription(): string | undefined {
        return undoManager.undoDescription
    }

    async redo() {
        await undoManager.redo()
    }

    redoDescription(): string | undefined {
        return undoManager.redoDescription
    }
}

const mutator = new Mutator()
export default mutator

export { mutator }
