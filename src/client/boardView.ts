import { Block } from "./block"
import { FilterGroup } from "./filterGroup"

type IViewType = "board" | "table" | "calendar" | "list" | "gallery"
type ISortOption = { propertyId: "__name" | string, reversed: boolean }

class BoardView extends Block {
	get viewType(): IViewType { return this.fields.viewType }
	set viewType(value: IViewType) { this.fields.viewType = value }

	get groupById(): string | undefined { return this.fields.groupById }
	set groupById(value: string | undefined) { this.fields.groupById = value }

	get sortOptions(): ISortOption[] { return this.fields.sortOptions }
	set sortOptions(value: ISortOption[]) { this.fields.sortOptions = value }

	get visiblePropertyIds(): string[] { return this.fields.visiblePropertyIds }
	set visiblePropertyIds(value: string[]) { this.fields.visiblePropertyIds = value }

	get filter(): FilterGroup | undefined { return this.fields.filter }
	set filter(value: FilterGroup | undefined) { this.fields.filter = value }

	constructor(block: any = {}) {
		super(block)

		this.type = "view"

		this.sortOptions = block.properties?.sortOptions?.map((o: ISortOption) => ({ ...o })) || []		// Deep clone
		this.visiblePropertyIds = block.properties?.visiblePropertyIds?.slice() || []
		this.filter = new FilterGroup(block.properties?.filter)

		// TODO: Remove this fixup code
		if (block.schema !== 1) {
			this.viewType = block.viewType || "board"
			this.groupById = block.groupById
			this.sortOptions = block.sortOptions ? block.sortOptions.map((o: ISortOption) => ({ ...o })) : [] 		// Deep clone
			this.visiblePropertyIds = block.visiblePropertyIds ? block.visiblePropertyIds.slice() : []
			this.filter = new FilterGroup(block.filter)
		}

		if (!this.viewType) { this.viewType = "board" }
	}
}

export { BoardView, IViewType, ISortOption }
