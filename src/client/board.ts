import { Block } from "./block"

type PropertyType = "text" | "number" | "select" | "multiSelect" | "date" | "person" | "file" | "checkbox" | "url" | "email" | "phone" | "createdTime" | "createdBy" | "updatedTime" | "updatedBy"

interface IPropertyOption {
	value: string,
	color: string
}

// A template for card properties attached to a board
interface IPropertyTemplate {
	id: string
	name: string
	type: PropertyType
	options: IPropertyOption[]
}

class Board extends Block {
	get cardProperties(): IPropertyTemplate[] { return this.fields.cardProperties as IPropertyTemplate[] }
	set cardProperties(value: IPropertyTemplate[]) { this.fields.cardProperties = value }

	constructor(block: any = {}) {
		super(block)
		this.type = "board"

		if (block.fields?.cardProperties) {
			// Deep clone of card properties and their options
			this.cardProperties = block.fields?.cardProperties.map((o: IPropertyTemplate) => {
				return {
					id: o.id,
					name: o.name,
					type: o.type,
					options: o.options ? o.options.map(option => ({ ...option })) : []
				}
			})
		} else {
			this.cardProperties = []
		}

		if (block.schema !== 1) {
			this.cardProperties = block.cardProperties?.map((o: IPropertyTemplate) => {
				return {
					id: o.id,
					name: o.name,
					type: o.type,
					options: o.options ? o.options.map(option => ({ ...option })) : []
				}
			}) || []
		}
	}
}

export { Board, PropertyType, IPropertyOption, IPropertyTemplate }
