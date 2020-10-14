import { IBlock } from "./octoTypes"
import { Utils } from "./utils"

class Block implements IBlock {
	id: string = Utils.createGuid()
	parentId: string
	type: string
	title: string
	icon?: string
	url?: string
	order: number
	properties: Record<string, string> = {}
	createAt: number = Date.now()
	updateAt: number = 0
	deleteAt: number = 0

	static duplicate(block: IBlock) {
		const now = Date.now()

		const newBlock = new Block(block)
		newBlock.id = Utils.createGuid()
		newBlock.title = `Copy of ${block.title}`
		newBlock.createAt = now
		newBlock.updateAt = now
		newBlock.deleteAt = 0

		return newBlock
	}

	constructor(block: any = {}) {
		const now = Date.now()

		this.id = block.id || Utils.createGuid()
		this.parentId = block.parentId
		this.type = block.type
		this.title = block.title
		this.icon = block.icon
		this.url = block.url
		this.order = block.order
		this.createAt = block.createAt || now
		this.updateAt = block.updateAt || now
		this.deleteAt = block.deleteAt || 0

		if (Array.isArray(block.properties)) {
			// HACKHACK: Port from old schema
			this.properties = {}
			for (const property of block.properties) {
				if (property.id) {
					this.properties[property.id] = property.value
				}
			}
		} else {
			this.properties = { ...block.properties || {} }
		}
	}
}

export { Block }
