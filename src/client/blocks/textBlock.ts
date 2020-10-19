import { IOrderedBlock } from "../octoTypes"
import { Block } from "./block"

class TextBlock extends Block implements IOrderedBlock {
	get order(): number { return this.fields.order as number }
	set order(value: number) { this.fields.order = value }

	constructor(block: any = {}) {
		super(block)
		this.type = "text"
	}
}

export { TextBlock }
