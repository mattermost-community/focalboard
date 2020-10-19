import { Block } from "./block"

class Card extends Block {
	get icon(): string { return this.fields.icon as string }
	set icon(value: string) { this.fields.icon = value }

	get properties(): Record<string, string> { return this.fields.properties as Record<string, string> }
	set properties(value: Record<string, string>) { this.fields.properties = value }

	constructor(block: any = {}) {
		super(block)
		this.type = "card"

		this.properties = { ...(block.fields?.properties || {}) }
	}
}

export { Card }
