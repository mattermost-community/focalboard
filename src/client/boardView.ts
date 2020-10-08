import { Block } from "./block"
import { FilterGroup } from "./filterGroup"

type IViewType = "board" | "table" | "calendar" | "list" | "gallery"
type ISortOption = { propertyId: "__name" | string, reversed: boolean }

class BoardView extends Block {
	viewType: IViewType
	groupById?: string
	sortOptions: ISortOption[]
	visiblePropertyIds: string[]
	filter?: FilterGroup

	constructor(block: any = {}) {
		super(block)

		this.type = "view"
		this.viewType = block.viewType || "board"
		this.groupById = block.groupById
		this.sortOptions = block.sortOptions ? block.sortOptions.map((o: ISortOption) => ({...o})) : []		// Deep clone
		this.visiblePropertyIds = block.visiblePropertyIds ? block.visiblePropertyIds.slice() : []
		this.filter = new FilterGroup(block.filter)
	}
}

export { BoardView, IViewType, ISortOption }
