import { IBlock } from "../octoTypes"
import { Utils } from "../utils"

class Block implements IBlock {
	id: string = Utils.createGuid()
	schema: number
	parentId: string
	type: string
	title: string
	order: number
	fields: Record<string, any> = {}
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
		this.schema = 1
		this.parentId = block.parentId
		this.type = block.type

		// Shallow copy here. Derived classes must make deep copies of their known properties in their constructors.
		this.fields = block.fields ? { ...block.fields } : {}

		this.title = block.title
		this.order = block.order

		this.createAt = block.createAt || now
		this.updateAt = block.updateAt || now
		this.deleteAt = block.deleteAt || 0
	}
}

export { Block }
