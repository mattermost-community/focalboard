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
	cardProperties: IPropertyTemplate[] = []

	constructor(block: any = {}) {
		super(block)
		this.type = "board"
		if (block.cardProperties) {
			// Deep clone of properties and their options
			this.cardProperties = block.cardProperties.map((o: IPropertyTemplate) => {
				return {
					id: o.id,
					name: o.name,
					type: o.type,
					options: o.options ? o.options.map(option => ({...option})): []
				}
			})
		} else {
			this.cardProperties = []
		}
	}
}

export { Board, PropertyType, IPropertyOption, IPropertyTemplate }
